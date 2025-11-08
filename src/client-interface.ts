import { type Channel, type VoiceSettings } from '@distdev/discord-ipc'
import type { RichPresence } from './client'

/**
 * Interface for Discord client operations that can be fulfilled by either
 * local Discord IPC client or remote proxy client
 */
export interface IDiscordClient {
	// Properties
	accessToken: string | null
	refreshToken: string | null
	user: any

	// Authentication
	login(options: any): Promise<void>
	destroy(): Promise<void>

	// Channel operations
	getChannels(guildId: string): Promise<Partial<Channel>[]>
	getGuilds(): Promise<any[]>
	getSelectedVoiceChannel(): Promise<Channel | null>
	selectVoiceChannel(channelId: string | null, options?: any): Promise<void>
	selectTextChannel(channelId: string): Promise<void>

	// Voice operations
	getVoiceSettings(): Promise<VoiceSettings>
	setVoiceSettings(settings: Partial<VoiceSettings>): Promise<VoiceSettings>
	setUserVoiceSettings(userId: string, settings: any): Promise<void>

	// Subscriptions
	subscribe(event: string, args: any): Promise<any>

	// Activity/Rich Presence
	setActivity(activity: RichPresence): Promise<void>
	clearActivity(): Promise<void>

	// Event listeners
	on(event: string, listener: (...args: any[]) => void): void
}
