# Discord Companion Proxy

This proxy application runs on your PC (where Discord is installed) and allows Bitfocus Companion (running on a remote server) to control Discord.

## Prerequisites

- Node.js 18 or higher
- Discord installed and running on your PC
- Discord Application credentials (Client ID and Client Secret)

## Installation

1. Navigate to the proxy directory:
```bash
cd proxy
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

## Configuration

You need to provide your Discord Application credentials via environment variables:

- `DISCORD_CLIENT_ID`: Your Discord Application Client ID
- `DISCORD_CLIENT_SECRET`: Your Discord Application Client Secret
- `PORT` (optional): WebSocket server port (default: 8080)

### Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select an existing one
3. Go to the OAuth2 tab
4. Add `http://localhost` as a redirect URL
5. Copy your Client ID and Client Secret

## Usage

### Running the Proxy

**Windows:**
```cmd
set DISCORD_CLIENT_ID=your_client_id
set DISCORD_CLIENT_SECRET=your_client_secret
npm start
```

**Linux/Mac:**
```bash
DISCORD_CLIENT_ID=your_client_id DISCORD_CLIENT_SECRET=your_client_secret npm start
```

### Custom Port

To use a different port:

**Windows:**
```cmd
set PORT=9000
set DISCORD_CLIENT_ID=your_client_id
set DISCORD_CLIENT_SECRET=your_client_secret
npm start
```

**Linux/Mac:**
```bash
PORT=9000 DISCORD_CLIENT_ID=your_client_id DISCORD_CLIENT_SECRET=your_client_secret npm start
```

### Running in Development Mode

For development with auto-reload:
```bash
DISCORD_CLIENT_ID=your_client_id DISCORD_CLIENT_SECRET=your_client_secret npm run dev
```

## Connecting Companion

1. Start the proxy application on your PC
2. Note the IP address of your PC (e.g., `192.168.1.100`)
3. In Bitfocus Companion, configure the Discord module:
   - Enable "Use Remote Endpoint"
   - Set "Remote Host" to your PC's IP address (e.g., `192.168.1.100`)
   - Set "Remote Port" to the proxy port (default: `8080`)
   - Enter your Discord Client ID and Client Secret

## Firewall Configuration

Make sure to allow incoming connections on the WebSocket port (default: 8080) in your firewall.

**Windows Firewall:**
```cmd
netsh advfirewall firewall add rule name="Discord Companion Proxy" dir=in action=allow protocol=TCP localport=8080
```

## Troubleshooting

### Connection Issues

- Ensure Discord is running on your PC
- Check that the proxy is running and shows "WebSocket server listening on port XXXX"
- Verify your firewall allows connections on the configured port
- Ensure Companion can reach your PC's IP address

### Discord Authentication Issues

- Make sure you've added `http://localhost` as a redirect URL in your Discord Application settings
- Verify your Client ID and Client Secret are correct
- Check the proxy logs for authentication errors

## Logs

The proxy outputs logs to the console. Look for:
- `[Proxy] WebSocket server listening on port XXXX` - Server started successfully
- `[Proxy] Companion connected` - Companion has connected
- `[Proxy] Discord client ready` - Discord connection established
- `[Proxy] Discord client error` - Discord connection issues

## Security Notes

- The proxy only listens for local network connections
- Keep your Client Secret secure and don't share it
- The WebSocket connection is not encrypted by default - use a VPN or secure network for remote connections
