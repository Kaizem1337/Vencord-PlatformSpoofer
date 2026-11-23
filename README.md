# PlatformSpoofer

Vencord userplugin to spoof your Discord client platform status icon (VR Headset, iOS, Android, Xbox, PlayStation, Web, or Desktop).

## Quick Install (Drag & Drop)

Download `Vencord-PlatformSpoofer-dist.zip` from [Releases](https://github.com/Kaizem1337/Vencord-PlatformSpoofer/releases/latest), unzip it, drop the `dist` folder into your Vencord folder (`%AppData%\Vencord` on Windows), restart Discord, and enable **PlatformSpoofer** in Vencord Plugins.

## Build From Source

1. Clone this repo into your Vencord `src/userplugins/platformSpoofer` directory:
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
