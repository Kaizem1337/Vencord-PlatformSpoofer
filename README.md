# PlatformSpoofer

Vencord userplugin to spoof your Discord client platform status icon (VR Headset, iOS, Android, Xbox, PlayStation, Web, or Desktop) while preserving Desktop features and performance.

## Quick Install (Drag & Drop)

1. Download `Vencord-PlatformSpoofer-dist.zip` from [Releases](https://github.com/Kaizem1337/Vencord-PlatformSpoofer/releases/latest) and unzip it.
2. Drop the `dist` folder into your Vencord folder (`%AppData%\Vencord` on Windows, `~/Library/Application Support/Vencord` on macOS, `~/.config/Vencord` on Linux).
3. Restart Discord and enable **PlatformSpoofer** in Discord Settings -> Vencord -> Plugins.

Includes built-in update checks and one-click updates inside the plugin settings.

## Build From Source

1. Clone into `Vencord/src/userplugins/platformSpoofer`:
   ```bash
   git clone https://github.com/Kaizem1337/Vencord-PlatformSpoofer src/userplugins/platformSpoofer
   ```
2. Build and inject Vencord:
   ```bash
   pnpm build
   pnpm inject
   ```
3. Enable **PlatformSpoofer** in Discord Settings -> Vencord -> Plugins.

> Note: Discord only shows the VR headset or mobile icon on your avatar when no other unspoofed desktop/web session is active on your account.
