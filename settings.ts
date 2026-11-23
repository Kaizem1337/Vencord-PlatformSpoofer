/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Kaizem
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { scheduleForceIdentify } from "./gateway";
import { PLATFORM_KEYS, PLATFORM_PRESETS, PlatformKey } from "./platforms";

export const settings = definePluginSettings({
    platform: {
        type: OptionType.SELECT,
        displayName: "Spoofed Platform",
        description: "Client platform sent on Gateway IDENTIFY.",
        restartNeeded: false,
        options: PLATFORM_KEYS.map(key => ({
            label: PLATFORM_PRESETS[key].label,
            value: key,
            default: key === "vr",
        })),
        onChange: () => scheduleForceIdentify(true),
    },
    showToasts: {
        type: OptionType.BOOLEAN,
        displayName: "Show Notifications",
        description: "Show a toast when switching platforms.",
        default: true,
        restartNeeded: false,
    },
});

export function getSelectedPlatform(): PlatformKey {
    const val = settings.store.platform as PlatformKey | undefined;
    return val && val in PLATFORM_PRESETS ? val : "vr";
}

export function switchPlatform(platform: PlatformKey) {
    if (settings.store.platform === platform) {
        scheduleForceIdentify(true);
        return;
    }
    settings.store.platform = platform;
    scheduleForceIdentify(true);
}
