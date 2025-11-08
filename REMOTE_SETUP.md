# Remote Discord Setup Guide

This guide explains how to set up the Discord Companion module when Discord is running on a different computer than Bitfocus Companion.

## Overview

The remote setup consists of two components:

1. **Discord Proxy** - Runs on your workstation (where Discord is installed)
2. **Companion Module** - Runs on your Companion server (configured to use remote endpoint)

## Architecture

```
[Your PC with Discord] <-- IPC --> [Discord Proxy] <-- WebSocket --> [Companion Server] <-- Network --> [Companion Module]
```

## Prerequisites

- Discord installed and running on your workstation
- Node.js 18 or higher installed on your workstation
- Bitfocus Companion running on a server (can be the same or different network)
- Network connectivity between your workstation and Companion server
- Discord Application credentials (Client ID and Secret)

## Step 1: Get Discord Application Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select an existing one
3. Go to the **OAuth2** tab
4. In the **Redirects** section, add `http://localhost` as a redirect URL
5. Copy your **Client ID** and **Client Secret** (you'll need these for both the proxy and Companion module)

## Step 2: Install and Run the Discord Proxy (On Your Workstation)

### Installation

1. Clone or download this repository to your workstation
2. Navigate to the proxy directory:
   ```bash
   cd companion-module-discord-api/proxy
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the proxy:
   ```bash
   npm run build
   ```

### Running the Proxy

**On Windows:**
```cmd
set DISCORD_CLIENT_ID=your_client_id_here
set DISCORD_CLIENT_SECRET=your_client_secret_here
npm start
```

**On macOS/Linux:**
```bash
DISCORD_CLIENT_ID=your_client_id_here DISCORD_CLIENT_SECRET=your_client_secret_here npm start
```

### Custom Port (Optional)

By default, the proxy listens on port `8080`. To use a different port:

**Windows:**
```cmd
set PORT=9000
set DISCORD_CLIENT_ID=your_client_id_here
set DISCORD_CLIENT_SECRET=your_client_secret_here
npm start
```

**macOS/Linux:**
```bash
PORT=9000 DISCORD_CLIENT_ID=your_client_id_here DISCORD_CLIENT_SECRET=your_client_secret_here npm start
```

### Verify Proxy is Running

You should see output similar to:
```
[Proxy] Starting Discord Companion Proxy...
[Proxy] WebSocket server listening on port 8080
[Proxy] Waiting for companion to connect...
```

## Step 3: Configure Firewall (On Your Workstation)

You need to allow incoming connections on the proxy port (default: 8080).

### Windows Firewall

Open Command Prompt as Administrator and run:
```cmd
netsh advfirewall firewall add rule name="Discord Companion Proxy" dir=in action=allow protocol=TCP localport=8080
```

### macOS Firewall

1. Open **System Preferences** > **Security & Privacy** > **Firewall**
2. Click **Firewall Options**
3. Click **+** and add Node.js
4. Select **Allow incoming connections**

### Linux (ufw)

```bash
sudo ufw allow 8080/tcp
```

## Step 4: Find Your Workstation's IP Address

You need to know your workstation's IP address on the local network.

### Windows

Open Command Prompt and run:
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

### macOS

Open Terminal and run:
```bash
ifconfig | grep "inet "
```
Look for your local IP (e.g., `192.168.1.100`)

### Linux

Open Terminal and run:
```bash
hostname -I
```
or
```bash
ip addr show
```

## Step 5: Configure Companion Module (On Companion Server)

1. Open Bitfocus Companion in your web browser
2. Add or edit a Discord API module instance
3. Configure the following settings:
   - **Client ID**: Your Discord Application Client ID
   - **Client Secret**: Your Discord Application Client Secret
   - **Use Remote Endpoint**: ✅ Enable this checkbox
   - **Remote Host**: Your workstation's IP address (e.g., `192.168.1.100`)
   - **Remote Port**: `8080` (or the custom port you configured)
4. Save the configuration

## Step 6: Verify Connection

1. Check the proxy console on your workstation - you should see:
   ```
   [Proxy] Companion connected
   [Proxy] Discord client ready
   ```

2. Check Companion - the Discord module instance should show as connected

3. The first time you connect, Discord will prompt you to authorize the application on your workstation

## Troubleshooting

### Companion Cannot Connect to Proxy

**Symptoms**: Companion shows connection error, proxy shows "Waiting for companion to connect"

**Solutions**:
- Verify the IP address is correct
- Check that the proxy is running on your workstation
- Ensure firewall allows connections on the proxy port
- Try pinging your workstation from the Companion server:
  ```bash
  ping 192.168.1.100
  ```
- If on different networks, ensure routing/VPN is properly configured

### Discord Authorization Issues

**Symptoms**: Proxy shows authentication errors

**Solutions**:
- Verify Client ID and Secret are correct
- Ensure `http://localhost` is added as a redirect URL in Discord Developer Portal
- Make sure Discord is running on your workstation
- Try restarting Discord
- Check Discord Developer Portal for any application restrictions

### Proxy Disconnects

**Symptoms**: Proxy shows repeated disconnection/reconnection messages

**Solutions**:
- Check your network stability
- Ensure Discord stays running
- Check for Windows updates or antivirus interference
- Review proxy logs for specific error messages

### Events Not Updating in Companion

**Symptoms**: Companion connected but doesn't show voice state changes

**Solutions**:
- Verify you're in a voice channel in Discord
- Check proxy logs for event messages
- Restart both the proxy and Discord
- Check Companion module logs for errors

## Network Security Considerations

⚠️ **Important Security Notes**:

1. The WebSocket connection is **not encrypted** by default
2. The proxy accepts connections from any IP address
3. Your Discord Client Secret is transmitted during initial configuration

**Recommendations**:
- Use only on trusted networks (home network, VPN)
- Consider using a VPN for remote connections
- Don't expose the proxy port to the internet
- Keep your Client Secret secure

## Running Proxy as a Service (Advanced)

For production use, you may want to run the proxy as a service.

### Windows (NSSM)

1. Download [NSSM](https://nssm.cc/)
2. Install the proxy as a service:
   ```cmd
   nssm install DiscordProxy
   ```
3. Configure:
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: `path\to\proxy`
   - Arguments: `dist\index.js`
   - Environment variables: Add `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`

### Linux (systemd)

Create `/etc/systemd/system/discord-proxy.service`:
```ini
[Unit]
Description=Discord Companion Proxy
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/proxy
Environment="DISCORD_CLIENT_ID=your_client_id"
Environment="DISCORD_CLIENT_SECRET=your_client_secret"
Environment="PORT=8080"
ExecStart=/usr/bin/node /path/to/proxy/dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable discord-proxy
sudo systemctl start discord-proxy
```

### macOS (launchd)

Create `~/Library/LaunchAgents/com.discord.proxy.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.discord.proxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/proxy/dist/index.js</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>DISCORD_CLIENT_ID</key>
        <string>your_client_id</string>
        <key>DISCORD_CLIENT_SECRET</key>
        <string>your_client_secret</string>
        <key>PORT</key>
        <string>8080</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Then:
```bash
launchctl load ~/Library/LaunchAgents/com.discord.proxy.plist
```

## Support

If you encounter issues:

1. Check the proxy logs for error messages
2. Check Companion module logs
3. Verify all firewall rules are correct
4. Test with proxy and Companion on the same machine first
5. Open an issue on GitHub with:
   - Proxy logs
   - Companion logs
   - Your network setup description
   - Steps to reproduce the issue
