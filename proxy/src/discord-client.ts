import { Client, type Channel, type VoiceSettings, type VoiceState } from '@distdev/discord-ipc'
import { EventEmitter } from 'events'

export interface DiscordProxyClientConfig {
	clientId: string
	clientSecret: string
	accessToken?: string
	refreshToken?: string
}

export class DiscordProxyClient extends EventEmitter {
	private client: Client
	private config: DiscordProxyClientConfig
	private connected: boolean = false
	private readonly scopes = ['identify', 'rpc', 'rpc.voice.read', 'rpc.voice.write', 'guilds']

	constructor(config: DiscordProxyClientConfig) {
		super()
		this.config = config
		this.client = new Client()
		this.setupListeners()
	}

	private setupListeners() {
		this.client.on('ready', () => {
			this.connected = true
			this.emit('ready', {
				accessToken: this.client.accessToken,
				refreshToken: this.client.refreshToken,
				user: this.client.user,
			})
		})

		this.client.on('disconnected', () => {
			this.connected = false
			this.emit('disconnected')
		})

		this.client.on('error', (error) => {
			this.emit('error', error)
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
			this.client.on(eventName, (data: any) => {
				this.emit(eventName, data)
			})
		})
	}

	async login(params?: { accessToken?: string; refreshToken?: string }) {
		try {
			const loginConfig = {
				clientId: this.config.clientId,
				clientSecret: this.config.clientSecret,
				redirectUri: 'http://localhost',
				scopes: this.scopes,
				accessToken: params?.accessToken || this.config.accessToken,
				refreshToken: params?.refreshToken || this.config.refreshToken,
			}

			await this.client.login(loginConfig)
		} catch (error) {
			console.error('[Discord Client] Login error:', error)
			// Try new login if token refresh fails
			if ((error as any)?.code === 4009) {
				await this.client.login({
					clientId: this.config.clientId,
					clientSecret: this.config.clientSecret,
					redirectUri: 'http://localhost',
					scopes: this.scopes,
				})
			} else {
				throw error
			}
		}
	}

	async executeCommand(method: string, params: any): Promise<any> {
		if (!this.connected) {
			throw new Error('Discord client not connected')
		}

		// Map method names to Discord client methods
		switch (method) {
			case 'getChannels':
				return await this.client.getChannels(params.guildId)

			case 'getGuilds':
				return await this.client.getGuilds()

			case 'getSelectedVoiceChannel':
				return await this.client.getSelectedVoiceChannel()

			case 'getVoiceSettings':
				return await this.client.getVoiceSettings()

			case 'setVoiceSettings':
				return await this.client.setVoiceSettings(params.settings)

			case 'setUserVoiceSettings':
				return await this.client.setUserVoiceSettings(params.userId, params.settings)

			case 'selectVoiceChannel':
				return await this.client.selectVoiceChannel(params.channelId, params.options)

			case 'selectTextChannel':
				return await this.client.selectTextChannel(params.channelId)

			case 'subscribe':
				return await this.client.subscribe(params.event, params.args)

			case 'unsubscribe':
				// Handle unsubscribe if needed
				return { success: true }

			case 'setActivity':
				return await this.client.setActivity(params.activity)

			case 'clearActivity':
				return await this.client.clearActivity()

			default:
				throw new Error(`Unknown command: ${method}`)
		}
	}

	isConnected(): boolean {
		return this.connected
	}

	async destroy() {
		if (this.client) {
			await this.client.destroy()
		}
		this.connected = false
	}
}
