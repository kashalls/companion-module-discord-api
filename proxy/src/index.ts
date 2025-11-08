import { WebSocketServer } from 'ws'
import { DiscordProxyClient } from './discord-client'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || ''
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || ''

interface ProxyConfig {
	port: number
	clientId: string
	clientSecret: string
}

class DiscordCompanionProxy {
	private wss: WebSocketServer
	private discordClient: DiscordProxyClient
	private config: ProxyConfig

	constructor(config: ProxyConfig) {
		this.config = config
		this.wss = new WebSocketServer({ port: config.port })
		this.discordClient = new DiscordProxyClient({
			clientId: config.clientId,
			clientSecret: config.clientSecret,
		})

		this.setupWebSocket()
		this.setupDiscordClient()
	}

	private setupWebSocket() {
		console.log(`[Proxy] WebSocket server listening on port ${this.config.port}`)

		this.wss.on('connection', (ws) => {
			console.log('[Proxy] Companion connected')

			ws.on('message', (data) => {
				try {
					const message = JSON.parse(data.toString())
					this.handleCompanionMessage(message)
				} catch (error) {
					console.error('[Proxy] Error parsing message from companion:', error)
				}
			})

			ws.on('close', () => {
				console.log('[Proxy] Companion disconnected')
			})

			ws.on('error', (error) => {
				console.error('[Proxy] WebSocket error:', error)
			})

			// Send current state when companion connects
			this.sendToCompanion({
				type: 'connected',
				data: {
					connected: this.discordClient.isConnected(),
				},
			})
		})

		this.wss.on('error', (error) => {
			console.error('[Proxy] WebSocket server error:', error)
		})
	}

	private setupDiscordClient() {
		// Forward Discord events to companion
		this.discordClient.on('ready', (data) => {
			console.log('[Proxy] Discord client ready')
			this.sendToCompanion({ type: 'ready', data })
		})

		this.discordClient.on('disconnected', () => {
			console.log('[Proxy] Discord client disconnected')
			this.sendToCompanion({ type: 'disconnected', data: {} })
		})

		this.discordClient.on('error', (error) => {
			console.error('[Proxy] Discord client error:', error)
			this.sendToCompanion({ type: 'error', data: { error: String(error) } })
		})

		// Forward all Discord events
		const events = [
			'CHANNEL_CREATE',
			'GUILD_CREATE',
			'VOICE_CHANNEL_SELECT',
			'VOICE_CONNECTION_STATUS',
			'VOICE_SETTINGS_UPDATE',
			'VOICE_STATE_CREATE',
			'VOICE_STATE_DELETE',
			'VOICE_STATE_UPDATE',
			'SPEAKING_START',
			'SPEAKING_STOP',
		]

		events.forEach((eventName) => {
			this.discordClient.on(eventName, (data) => {
				this.sendToCompanion({ type: 'event', event: eventName, data })
			})
		})
	}

	private handleCompanionMessage(message: any) {
		const { type, method, params, id } = message

		if (type === 'command') {
			// Execute Discord client method
			this.executeDiscordCommand(method, params, id)
		} else if (type === 'login') {
			// Handle login request
			this.discordClient.login(params)
		}
	}

	private async executeDiscordCommand(method: string, params: any, id: string) {
		try {
			const result = await this.discordClient.executeCommand(method, params)
			this.sendToCompanion({
				type: 'response',
				id,
				result,
			})
		} catch (error) {
			this.sendToCompanion({
				type: 'response',
				id,
				error: String(error),
			})
		}
	}

	private sendToCompanion(message: any) {
		const data = JSON.stringify(message)
		this.wss.clients.forEach((client) => {
			if (client.readyState === 1) {
				// WebSocket.OPEN
				client.send(data)
			}
		})
	}

	async start() {
		console.log('[Proxy] Starting Discord Companion Proxy...')
		console.log(`[Proxy] WebSocket server will listen on port ${this.config.port}`)
		console.log('[Proxy] Waiting for companion to connect...')
	}

	async stop() {
		console.log('[Proxy] Stopping Discord Companion Proxy...')
		await this.discordClient.destroy()
		this.wss.close()
	}
}

// Main entry point
async function main() {
	if (!CLIENT_ID || !CLIENT_SECRET) {
		console.error('Error: DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables are required')
		console.error('')
		console.error('Usage:')
		console.error('  DISCORD_CLIENT_ID=your_client_id DISCORD_CLIENT_SECRET=your_secret npm start')
		console.error('')
		console.error('Optional:')
		console.error('  PORT=8080 (default: 8080)')
		process.exit(1)
	}

	const proxy = new DiscordCompanionProxy({
		port: PORT,
		clientId: CLIENT_ID,
		clientSecret: CLIENT_SECRET,
	})

	await proxy.start()

	// Handle shutdown
	process.on('SIGINT', async () => {
		console.log('\n[Proxy] Shutting down...')
		await proxy.stop()
		process.exit(0)
	})

	process.on('SIGTERM', async () => {
		console.log('\n[Proxy] Shutting down...')
		await proxy.stop()
		process.exit(0)
	})
}

main().catch((error) => {
	console.error('[Proxy] Fatal error:', error)
	process.exit(1)
})
