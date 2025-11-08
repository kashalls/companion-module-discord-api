import { RemoteDiscordClient } from './remote-client'
import type DiscordInstance from './index'
import type { IDiscordClient } from './client-interface'
import type { RichPresence } from './client'

/**
 * Wrapper around RemoteDiscordClient to match the IDiscordClient interface
 */
export class RemoteClientWrapper implements IDiscordClient {
	private remoteClient: RemoteDiscordClient
	public accessToken: string | null = null
	public refreshToken: string | null = null
	public user: any = null

	constructor(instance: DiscordInstance) {
		this.remoteClient = new RemoteDiscordClient(instance, {
			host: instance.config.remoteHost,
			port: instance.config.remotePort,
			clientId: instance.config.clientID,
			clientSecret: instance.config.clientSecret,
			accessToken: instance.config.accessToken,
			refreshToken: instance.config.refreshToken,
		})
	}

	async login(_options: unknown): Promise<void> {
		// Connect to proxy and login handled automatically
		this.remoteClient.connect()
	}

	async destroy(): Promise<void> {
		this.remoteClient.disconnect()
	}

	async getChannels(guildId: string): Promise<any[]> {
		return this.remoteClient.executeCommand('getChannels', { guildId })
	}

	async getGuilds(): Promise<any[]> {
		return this.remoteClient.executeCommand('getGuilds', {})
	}

	async getSelectedVoiceChannel(): Promise<any> {
		return this.remoteClient.executeCommand('getSelectedVoiceChannel', {})
	}

	async selectVoiceChannel(channelId: string | null, options?: unknown): Promise<void> {
		await this.remoteClient.executeCommand('selectVoiceChannel', { channelId, options })
	}

	async selectTextChannel(channelId: string): Promise<void> {
		await this.remoteClient.executeCommand('selectTextChannel', { channelId })
	}

	async getVoiceSettings(): Promise<any> {
		return this.remoteClient.executeCommand('getVoiceSettings', {})
	}

	async setVoiceSettings(settings: unknown): Promise<any> {
		return this.remoteClient.executeCommand('setVoiceSettings', { settings })
	}

	async setUserVoiceSettings(userId: string, settings: unknown): Promise<void> {
		await this.remoteClient.executeCommand('setUserVoiceSettings', { userId, settings })
	}

	async subscribe(event: string, args: unknown): Promise<any> {
		return this.remoteClient.executeCommand('subscribe', { event, args })
	}

	async setActivity(activity: RichPresence): Promise<void> {
		await this.remoteClient.executeCommand('setActivity', { activity })
	}

	async clearActivity(): Promise<void> {
		await this.remoteClient.executeCommand('clearActivity', {})
	}

	on(event: string, listener: (...args: any[]) => void): void {
		this.remoteClient.on(event, listener)
	}
}
