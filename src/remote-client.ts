import WebSocket from 'ws'
import { EventEmitter } from 'events'
import type DiscordInstance from './index'

export interface RemoteClientConfig {
	host: string
	port: number
	clientId: string
	clientSecret: string
	accessToken?: string
	refreshToken?: string
}

export class RemoteDiscordClient extends EventEmitter {
	private ws: WebSocket | null = null
	private config: RemoteClientConfig
	private instance: DiscordInstance
	private reconnectTimer: NodeJS.Timeout | null = null
	private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map()
	private requestId = 0

	constructor(instance: DiscordInstance, config: RemoteClientConfig) {
		super()
		this.instance = instance
		this.config = config
	}

	connect(): void {
		if (this.ws) {
			return
		}

		const url = `ws://${this.config.host}:${this.config.port}`
		this.instance.log('debug', `Connecting to proxy at ${url}`)

		this.ws = new WebSocket(url)

		this.ws.on('open', () => {
			this.instance.log('debug', 'Connected to proxy')
			this.clearReconnectTimer()

			// Send login request with tokens
			this.send({
				type: 'login',
				params: {
					accessToken: this.config.accessToken,
					refreshToken: this.config.refreshToken,
				},
			})
		})

		this.ws.on('message', (data: WebSocket.Data) => {
			try {
				let messageStr: string
				if (typeof data === 'string') {
					messageStr = data
				} else if (Buffer.isBuffer(data)) {
					messageStr = data.toString('utf-8')
				} else if (Array.isArray(data)) {
					messageStr = Buffer.concat(data).toString('utf-8')
				} else {
					messageStr = new TextDecoder().decode(data)
				}
				const message = JSON.parse(messageStr)
				this.handleMessage(message)
			} catch (error) {
				this.instance.log('error', `Error parsing message from proxy: ${String(error)}`)
			}
		})

		this.ws.on('close', () => {
			this.instance.log('warn', 'Disconnected from proxy')
			this.ws = null
			this.emit('disconnected')
			this.scheduleReconnect()
		})

		this.ws.on('error', (error) => {
			this.instance.log('error', `WebSocket error: ${error}`)
			this.emit('error', error)
		})
	}

	private handleMessage(message: any) {
		const { type, event, data, id, result, error } = message

		if (type === 'response') {
			// Handle command response
			const pending = this.pendingRequests.get(id)
			if (pending) {
				this.pendingRequests.delete(id)
				if (error) {
					pending.reject(new Error(error))
				} else {
					pending.resolve(result)
				}
			}
		} else if (type === 'event') {
			// Forward Discord event
			this.emit(event, data)
		} else if (type === 'ready') {
			// Discord client ready
			this.emit('ready', data)
		} else if (type === 'disconnected') {
			// Discord client disconnected
			this.emit('discord-disconnected')
		} else if (type === 'error') {
			// Discord client error
			this.emit('discord-error', data.error)
		} else if (type === 'connected') {
			// Proxy connected confirmation
			this.instance.log('debug', `Proxy connection status: ${data.connected}`)
		}
	}

	private send(message: any) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message))
		} else {
			this.instance.log('warn', 'Cannot send message: WebSocket not connected')
		}
	}

	private scheduleReconnect() {
		if (this.reconnectTimer) {
			return
		}

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null
			this.instance.log('debug', 'Attempting to reconnect to proxy...')
			this.connect()
		}, 5000)
	}

	private clearReconnectTimer() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
	}

	async executeCommand(method: string, params: unknown): Promise<any> {
		return new Promise((resolve, reject) => {
			const id = `req_${++this.requestId}`
			this.pendingRequests.set(id, { resolve, reject })

			this.send({
				type: 'command',
				id,
				method,
				params,
			})

			// Timeout after 30 seconds
			setTimeout(() => {
				if (this.pendingRequests.has(id)) {
					this.pendingRequests.delete(id)
					reject(new Error('Request timeout'))
				}
			}, 30000)
		})
	}

	disconnect(): void {
		this.clearReconnectTimer()
		if (this.ws) {
			this.ws.close()
			this.ws = null
		}
		this.pendingRequests.clear()
	}
}
