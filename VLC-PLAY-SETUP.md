# VLC Play Button for Jackett

This feature adds a **Play (▶)** button to Jackett's Manual Search results that allows you to immediately play torrents/magnets in VLC without downloading them first.

## Features

- **Instant Playback**: Click ▶ to start streaming in VLC
- **Smart Conversion**: Automatically converts torrent files to magnet links when needed
- **No Downloads**: Streams directly without storing torrents locally
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Quick Setup

### 1. Install Requirements

**Node.js** (if not already installed):
- Download from [nodejs.org](https://nodejs.org)
- Choose the LTS version

**VLC Media Player**:
- Download from [videolan.org](https://www.videolan.org/vlc/)
- Install normally

**Peerflix** (for streaming):
```bash
npm install -g peerflix
```

### 2. Download and Run VLC Helper

1. Download `vlc-helper.js` from the Jackett repository
2. Open terminal/command prompt in the folder containing the script
3. Run:
   ```bash
   node vlc-helper.js
   ```
4. Keep the terminal window open while using Jackett

### 3. Use the Play Button

1. Open Jackett → Manual Search
2. Search for content
3. Click the **▶ Play** button next to any result
4. VLC will open and start streaming the content

## How It Works

1. **Magnet Links**: If available, plays directly
2. **Torrent Files**: Converts to magnet link first, then plays
3. **Streaming**: Uses peerflix to stream content to VLC
4. **No Storage**: Content streams without being saved locally

## Troubleshooting

### "VLC Helper Setup Required" Error

This means the VLC helper service isn't running:

1. **Check if Node.js is installed**:
   ```bash
   node --version
   ```

2. **Check if peerflix is installed**:
   ```bash
   peerflix --version
   ```

3. **Start the helper service**:
   ```bash
   node vlc-helper.js
   ```

4. **Test the connection**:
   ```bash
   curl http://127.0.0.1:48888/ping
   ```

### Windows-Specific Issues

#### "spawn peerflix ENOENT" Error

This is common on Windows with Node Version Manager (nvm4w). The service will automatically try alternative methods:

1. **Use the Windows batch file** (recommended):
   ```cmd
   start-vlc-helper.bat
   ```

2. **Manual fix** - Find your npm global modules path:
   ```cmd
   npm root -g
   ```
   Then run peerflix directly:
   ```cmd
   node "C:\nvm4w\nodejs\node_modules\peerflix\app.js" --version
   ```

3. **Alternative: Use direct VLC mode**:
   ```cmd
   set MODE=vlc
   node vlc-helper.js
   ```

#### PATH Issues with nvm4w

If you're using Node Version Manager for Windows (nvm4w):

1. **Check your npm global root**:
   ```cmd
   npm root -g
   ```

2. **Verify peerflix installation**:
   ```cmd
   dir "C:\nvm4w\nodejs\node_modules\peerflix"
   ```

3. **Use the batch file** which handles PATH issues automatically

### VLC Doesn't Open

1. **Check VLC installation**: Make sure VLC is installed and accessible
2. **Try different mode**: Set `MODE=vlc` environment variable
3. **Check VLC path**: Set `VLC_PATH` environment variable to VLC executable

### Peerflix Errors

1. **Reinstall peerflix**:
   ```bash
   npm uninstall -g peerflix
   npm install -g peerflix
   ```

2. **Check Node.js version**: Use Node.js 14 or later

3. **Windows PATH fix**: Add npm global modules to your PATH:
   ```cmd
   set PATH=%PATH%;C:\nvm4w\nodejs\node_modules\.bin
   ```

## Advanced Configuration

### Environment Variables

- `PORT`: Service port (default: 48888)
- `MODE`: Playback mode - `peerflix` (default) or `vlc`
- `VLC_PATH`: Path to VLC executable

### Examples

**Windows (PowerShell)**:
```powershell
$env:MODE="vlc"
$env:VLC_PATH="C:\Program Files\VideoLAN\VLC\vlc.exe"
node vlc-helper.js
```

**macOS/Linux**:
```bash
MODE=vlc VLC_PATH="/Applications/VLC.app/Contents/MacOS/VLC" node vlc-helper.js
```

### Auto-Start on Boot

**Windows**:
1. Create a batch file with: `node "C:\path\to\vlc-helper.js"`
2. Add to Windows Startup folder

**macOS**:
1. Create a LaunchAgent plist file
2. Place in `~/Library/LaunchAgents/`

**Linux**:
1. Create a systemd user service
2. Enable with `systemctl --user enable vlc-helper`

## Security Notes

- The service only binds to `127.0.0.1` (localhost)
- No external network access required
- No torrent files are stored permanently
- All streaming is temporary and in-memory

## Performance Tips

- **RAM**: Ensure sufficient RAM for streaming (2GB+ recommended)
- **Network**: Stable internet connection recommended
- **CPU**: Modern CPU recommended for smooth playback
- **Storage**: No permanent storage required

## Support

If you encounter issues:

1. Check the terminal output for error messages
2. Ensure all requirements are properly installed
3. Try the test connection button in Jackett
4. Check Jackett's browser console for JavaScript errors

## Technical Details

- **Service Port**: 48888 (configurable)
- **Protocol**: HTTP GET requests
- **Endpoints**: `/ping` (health check), `/play` (playback)
- **Streaming**: Uses peerflix for reliable streaming
- **Fallback**: Direct VLC mode available
