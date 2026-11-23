# PlatformSpoofer

Vencord userplugin to spoof your Discord client platform status icon (VR Headset, iOS, Android, Xbox, PlayStation, Web, or Desktop).

## Install

1. Clone this repo into your Vencord `src/userplugins/platformSpoofer` directory:
   ```bash
   git clone https://github.com/Kaizem1337/vencord-platform-spoofer src/userplugins/platformSpoofer
   ```
2. Build and inject Vencord:
   ```bash
   pnpm build
   pnpm inject
   ```
3. Enable **PlatformSpoofer** in Discord Settings -> Vencord -> Plugins.

> Note: Discord only shows the VR headset or mobile icon on your avatar when no other unspoofed desktop/web session is active on your account.
