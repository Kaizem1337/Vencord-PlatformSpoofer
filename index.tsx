/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Kaizem
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { SettingsStore } from "@api/Settings";
import definePlugin from "@utils/types";
import { Menu } from "@webpack/common";

import {
    configureGatewayHooks,
    forceIdentify,
    getGatewayConnectionStore,
    handleConnectionOpen,
    installExperimentInterceptor,
    isSocketPatched,
    patchGatewaySocket,
    removeExperimentInterceptor,
    scheduleForceIdentify,
    unpatchGatewaySocket,
} from "./gateway";
import { PLATFORM_KEYS, PLATFORM_PRESETS } from "./platforms";
import { getSelectedPlatform, settings, switchPlatform } from "./settings";
import { SettingsPanel } from "./SettingsPanel";
import { checkUpdates } from "./updater";

const PLATFORM_SETTING_PATH = "plugins.PlatformSpoofer.platform";

function onPlatformSettingChange() {
    scheduleForceIdentify(true);
}

export default definePlugin({
    name: "PlatformSpoofer",
    description: "Spoof your Discord client platform status (VR headset, mobile, console, web, desktop).",
    searchTerms: ["vr", "headset", "platform", "spoof", "mobile", "console", "status"],
    tags: ["Appearance", "Customisation", "Utility"],
    authors: [{ name: "Kaizem", id: 805318397658398742n }],
    requiresRestart: false,

    settings,
    settingsAboutComponent: SettingsPanel,

    flux: {
        CONNECTION_OPEN(event) {
            handleConnectionOpen(event);
        },
    },

    toolboxActions() {
        const current = getSelectedPlatform();

        return (
            <>
                <Menu.MenuItem
                    id="platform-spoofer-select"
                    label={`Platform: ${PLATFORM_PRESETS[current].shortLabel}`}
                >
                    {PLATFORM_KEYS.map(key => {
                        const preset = PLATFORM_PRESETS[key];
                        return (
                            <Menu.MenuRadioItem
                                key={key}
                                group="platform-spoofer-platform"
                                id={`platform-spoofer-opt-${key}`}
                                label={preset.label}
                                checked={current === key}
                                action={() => switchPlatform(key)}
                            />
                        );
                    })}
                </Menu.MenuItem>
                <Menu.MenuItem
                    id="platform-spoofer-reconnect"
                    label="Reconnect & Re-Identify"
                    action={() => forceIdentify({ showFeedback: true })}
                />
                <Menu.MenuItem
                    id="platform-spoofer-update"
                    label="Check for Updates"
                    action={() => checkUpdates(false)}
                />
            </>
        );
    },

    start() {
        configureGatewayHooks(
            () => getSelectedPlatform(),
            () => Boolean(settings.store.showToasts),
            () => Boolean(settings.store.preserveExperiments)
        );

        installExperimentInterceptor();
        SettingsStore.addChangeListener(PLATFORM_SETTING_PATH, onPlatformSettingChange);

        const patched = patchGatewaySocket();
        if (patched && getGatewayConnectionStore()?.isConnected() && getSelectedPlatform() !== "off") {
            forceIdentify({ showFeedback: false });
        }

        if (settings.store.autoCheckUpdates) {
            setTimeout(() => checkUpdates(true), 5000);
        }
    },

    stop() {
        SettingsStore.removeChangeListener(PLATFORM_SETTING_PATH, onPlatformSettingChange);
        const wasSpoofing = getSelectedPlatform() !== "off" && isSocketPatched();
        unpatchGatewaySocket();
        removeExperimentInterceptor();

        if (wasSpoofing && getGatewayConnectionStore()?.isConnected()) {
            forceIdentify({ showFeedback: false, skipPatch: true });
        }
    },
});
