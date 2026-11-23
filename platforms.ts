/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Kaizem
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type PlatformKey =
    | "vr"
    | "ios"
    | "android"
    | "xbox"
    | "playstation"
    | "web"
    | "desktop"
    | "off";

export interface SpoofProperties {
    os?: string;
    browser: string;
    device: string;
}

export interface PlatformPreset {
    key: PlatformKey;
    label: string;
    shortLabel: string;
    description: string;
    iconPath: string;
    iconViewBox: string;
    properties: SpoofProperties | null;
}

const ICON_VR =
    "M8.46 8.64a1 1 0 0 1 1 1c0 .44-.3.8-.72.92l-.11.07c-.08.06-.2.19-.2.41a.99.99 0 0 1-.98.86h-.06a1 1 0 0 1-.94-1.05l.02-.32c.05-1.06.92-1.9 1.99-1.9ZM15.55 5a5.5 5.5 0 0 1 5.15 3.67h.3a2 2 0 0 1 2 2v3.18a2 2 0 0 1-2 1.99h-.2A4.54 4.54 0 0 1 16.55 19a4.45 4.45 0 0 1-3.6-1.83 1.2 1.2 0 0 0-1.9 0 4.44 4.44 0 0 1-3.9 1.82 4.54 4.54 0 0 1-3.94-3.15H3a2 2 0 0 1-2-2v-3.18c0-1.1.9-1.99 2-1.99h.3A5.5 5.5 0 0 1 8.46 5h7.09Zm-7.1 2C6.6 7 5.06 8.5 4.97 10.41l-.02.66v3.18c0 1.43 1.05 2.66 2.34 2.74.85.06 1.63-.32 2.14-1.01a3.2 3.2 0 0 1 2.57-1.3c1 0 1.97.48 2.57 1.3.5.69 1.3 1.08 2.14 1.01 1.3-.08 2.34-1.31 2.34-2.74l-.02-3.84a3.54 3.54 0 0 0-3.49-3.43H8.45Z";

const ICON_MOBILE =
    "M7 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H7Zm0 3h10v11H7V5Zm5 13.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z";

const ICON_CONSOLE =
    "M3.06 20.4q-1.53 0-2.37-1.065T.06 16.74l1.26-9q.27-1.8 1.605-2.97T6.06 3.6h11.88q1.8 0 3.135 1.17t1.605 2.97l1.26 9q.21 1.53-.63 2.595T20.94 20.4q-.63 0-1.17-.225T18.78 19.5l-2.7-2.7H7.92l-2.7 2.7q-.45.45-.99.675t-1.17.225Zm14.94-7.2q.51 0 .855-.345T19.2 12q0-.51-.345-.855T18 10.8q-.51 0-.855.345T16.8 12q0 .51.345 .855T18 13.2Zm-2.4-3.6q.51 0 .855-.345T16.8 8.4q0-.51-.345-.855T15.6 7.2q-.51 0-.855.345T14.4 8.4q0 .51.345 .855T15.6 9.6ZM6.9 13.2h1.8v-2.1h2.1v-1.8h-2.1v-2.1h-1.8v2.1h-2.1v1.8h2.1v2.1Z";

const ICON_WEB =
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93Zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39Z";

const ICON_DESKTOP =
    "M4 2.5c-1.103 0-2 .897-2 2v11c0 1.104.897 2 2 2h7v2H7v2h10v-2h-4v-2h7c1.103 0 2-.896 2-2v-11c0-1.103-.897-2-2-2H4Zm16 2v9H4v-9h16Z";

const ICON_OFF =
    "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 0 1-6.32-12.9l11.22 11.22A7.95 7.95 0 0 1 12 20Zm6.32-3.1L7.1 5.68A8 8 0 0 1 18.32 16.9Z";

export const PLATFORM_PRESETS: Record<PlatformKey, PlatformPreset> = {
    vr: {
        key: "vr",
        label: "VR Headset (Discord VR)",
        shortLabel: "VR Headset",
        description: "Shows the VR headset status icon.",
        iconPath: ICON_VR,
        iconViewBox: "0 4 24 16",
        properties: {
            browser: "Discord VR",
            device: "VR-Headset",
        },
    },
    ios: {
        key: "ios",
        label: "Mobile — iOS",
        shortLabel: "iOS",
        description: "Shows the mobile status icon (Discord iOS).",
        iconPath: ICON_MOBILE,
        iconViewBox: "0 0 24 24",
        properties: {
            os: "iOS",
            browser: "Discord iOS",
            device: "iPhone16,2",
        },
    },
    android: {
        key: "android",
        label: "Mobile — Android",
        shortLabel: "Android",
        description: "Shows the mobile status icon (Discord Android).",
        iconPath: ICON_MOBILE,
        iconViewBox: "0 0 24 24",
        properties: {
            os: "Android",
            browser: "Discord Android",
            device: "Pixel 8",
        },
    },
    xbox: {
        key: "xbox",
        label: "Console — Xbox Series X",
        shortLabel: "Xbox",
        description: "Spoofs an Xbox console session.",
        iconPath: ICON_CONSOLE,
        iconViewBox: "0 0 24 24",
        properties: {
            browser: "Discord Embedded",
            device: "Xbox Series X",
        },
    },
    playstation: {
        key: "playstation",
        label: "Console — PlayStation 5",
        shortLabel: "PlayStation",
        description: "Spoofs a PlayStation 5 console session.",
        iconPath: ICON_CONSOLE,
        iconViewBox: "0 0 24 24",
        properties: {
            browser: "Discord Embedded",
            device: "PlayStation 5",
        },
    },
    web: {
        key: "web",
        label: "Web Browser",
        shortLabel: "Web",
        description: "Spoofs Discord Web.",
        iconPath: ICON_WEB,
        iconViewBox: "0 0 24 24",
        properties: {
            browser: "Discord Web",
            device: "",
        },
    },
    desktop: {
        key: "desktop",
        label: "Desktop Client",
        shortLabel: "Desktop",
        description: "Spoofs the desktop client.",
        iconPath: ICON_DESKTOP,
        iconViewBox: "0 0 24 24",
        properties: {
            browser: "Discord Client",
            device: "",
        },
    },
    off: {
        key: "off",
        label: "Off (Real Client)",
        shortLabel: "Off",
        description: "Uses your real Discord client identity.",
        iconPath: ICON_OFF,
        iconViewBox: "0 0 24 24",
        properties: null,
    },
};

export const PLATFORM_KEYS: readonly PlatformKey[] = [
    "vr",
    "ios",
    "android",
    "xbox",
    "playstation",
    "web",
    "desktop",
    "off",
];
