/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Kaizem
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { relaunch } from "@utils/native";
import type { PluginNative } from "@utils/types";
import { showToast } from "@webpack/common";

export const PLUGIN_VERSION = "1.1.0";
export const RELEASES_URL = "https://github.com/Kaizem1337/Vencord-PlatformSpoofer/releases/latest";

const LATEST_RELEASE_API = "https://api.github.com/repos/Kaizem1337/Vencord-PlatformSpoofer/releases/latest";

const Native = (
    typeof VencordNative !== "undefined"
        ? VencordNative?.pluginHelpers?.PlatformSpoofer
        : undefined
) as PluginNative<typeof import("./native")> | undefined;

export interface UpdateState {
    checking: boolean;
    installing: boolean;
    installed: boolean;
    hasUpdate: boolean;
    latestVersion: string | null;
    releaseUrl: string;
    canAutoInstall: boolean;
    error: string | null;
}

let state: UpdateState = {
    checking: false,
    installing: false,
    installed: false,
    hasUpdate: false,
    latestVersion: null,
    releaseUrl: RELEASES_URL,
    canAutoInstall: false,
    error: null,
};

const listeners = new Set<() => void>();

function setState(patch: Partial<UpdateState>) {
    state = { ...state, ...patch };
    listeners.forEach(fn => fn());
}

export function getUpdateState(): UpdateState {
    return state;
}

export function subscribeUpdateState(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function normalizeVersion(raw: string): string {
    return raw.trim().replace(/^v/i, "");
}

function isNewerVersion(latest: string, current: string): boolean {
    const a = normalizeVersion(latest).split(".").map(n => Number.parseInt(n, 10) || 0);
    const b = normalizeVersion(current).split(".").map(n => Number.parseInt(n, 10) || 0);
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;
        if (av > bv) return true;
        if (av < bv) return false;
    }
    return false;
}

export function openReleasePage(url = state.releaseUrl) {
    if (typeof VencordNative !== "undefined" && VencordNative?.native?.openExternal) {
        VencordNative.native.openExternal(url);
    } else {
        window.open(url, "_blank", "noopener,noreferrer");
    }
}

export async function checkUpdates(silent = false): Promise<UpdateState> {
    if (state.checking) return state;

    setState({ checking: true, error: null });

    try {
        if (Native?.checkForUpdate) {
            const res = await Native.checkForUpdate(PLUGIN_VERSION);
            if (!res.ok) {
                throw new Error(res.error ?? "Update check failed");
            }

            setState({
                checking: false,
                hasUpdate: Boolean(res.hasUpdate),
                latestVersion: res.latestVersion ?? PLUGIN_VERSION,
                releaseUrl: res.releaseUrl ?? RELEASES_URL,
                canAutoInstall: Boolean(res.canAutoInstall),
                error: null,
            });
        } else {
            const res = await fetch(LATEST_RELEASE_API, {
                headers: { Accept: "application/vnd.github+json" },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const latest = normalizeVersion(data.tag_name ?? "");
            setState({
                checking: false,
                hasUpdate: Boolean(latest && isNewerVersion(latest, PLUGIN_VERSION)),
                latestVersion: latest || PLUGIN_VERSION,
                releaseUrl: data.html_url ?? RELEASES_URL,
                canAutoInstall: false,
                error: null,
            });
        }

        if (state.hasUpdate && state.latestVersion) {
            if (silent) {
                showNotification({
                    title: "PlatformSpoofer Update Available",
                    body: `v${state.latestVersion} is available (installed: v${PLUGIN_VERSION}). Click to open release or update in plugin settings.`,
                    permanent: false,
                    noPersist: true,
                    onClick: () => openReleasePage(state.releaseUrl),
                });
            } else {
                showToast({
                    text: `PlatformSpoofer v${state.latestVersion} is available!`,
                    variant: "success",
                });
            }
        } else if (!silent) {
            showToast({
                text: `PlatformSpoofer v${PLUGIN_VERSION} is up to date.`,
                variant: "default",
            });
        }
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        setState({ checking: false, error: msg });
        if (!silent) {
            showToast({ text: `Update check failed: ${msg}`, variant: "critical" });
        }
    }

    return state;
}

export async function installUpdateNow(): Promise<boolean> {
    if (state.installing) return false;
    if (!Native?.installUpdate) {
        openReleasePage(state.releaseUrl);
        return false;
    }

    setState({ installing: true, error: null });

    try {
        const res = await Native.installUpdate(PLUGIN_VERSION);
        if (!res.ok) {
            throw new Error(res.error ?? "Install failed");
        }

        setState({
            installing: false,
            installed: true,
            hasUpdate: false,
            error: null,
        });

        showToast({
            text: `Updated to v${res.latestVersion ?? state.latestVersion}! Relaunch Discord to apply.`,
            variant: "success",
        });

        return true;
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        setState({ installing: false, error: msg });
        showToast({ text: `Update failed: ${msg}`, variant: "critical" });
        return false;
    }
}

export function relaunchDiscord() {
    relaunch();
}
