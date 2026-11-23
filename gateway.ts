/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Kaizem
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByProps } from "@webpack";
import { FluxDispatcher, showToast } from "@webpack/common";

import { PLATFORM_PRESETS, PlatformKey } from "./platforms";

const OPCODE_IDENTIFY = 2;
const RECONNECT_DEBOUNCE_MS = 250;

interface GatewaySocketLike {
    send: (op: number, data: any, ...rest: any[]) => any;
    close?: () => void;
    connect?: () => void;
    sessionId: string | null;
    seq: number;
    connectionState?: string;
    webSocket?: WebSocket | null;
}

interface GatewayConnectionStoreLike {
    getSocket: () => GatewaySocketLike | null | undefined;
    isConnected: () => boolean;
}

interface CachedExperiments {
    experiments?: any[];
    guildExperiments?: any[];
    guild_experiments?: any[];
    apexExperiments?: any;
    apex_experiments?: any;
}

let patchedSocket: GatewaySocketLike | null = null;
let originalSend: GatewaySocketLike["send"] | null = null;
let lastAppliedPlatform: PlatformKey | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let cachedDesktopExperiments: CachedExperiments | null = null;
let interceptorInstalled = false;

let getPlatformFn: () => PlatformKey = () => "vr";
let shouldShowToastsFn: () => boolean = () => true;
let shouldPreserveExperimentsFn: () => boolean = () => true;

export function configureGatewayHooks(
    getPlatform: () => PlatformKey,
    shouldShowToasts: () => boolean,
    shouldPreserveExperiments: () => boolean
) {
    getPlatformFn = getPlatform;
    shouldShowToastsFn = shouldShowToasts;
    shouldPreserveExperimentsFn = shouldPreserveExperiments;
}

export function getGatewayConnectionStore(): GatewayConnectionStoreLike | null {
    return (findByProps("getSocket", "isConnected") as GatewayConnectionStoreLike | undefined) ?? null;
}

export function getGatewaySocket(): GatewaySocketLike | null {
    return getGatewayConnectionStore()?.getSocket() ?? null;
}

export function isSocketPatched(): boolean {
    const socket = getGatewaySocket();
    return Boolean(socket && socket === patchedSocket && originalSend);
}

function notify(text: string, variant: "success" | "critical" | "default" = "default") {
    if (!shouldShowToastsFn()) return;
    try {
        showToast({ text, variant });
    } catch { }
}

function isSpoofedSession(): boolean {
    return lastAppliedPlatform !== null && lastAppliedPlatform !== "off" && lastAppliedPlatform !== "desktop";
}

function cacheExperimentsFromEvent(event: any) {
    if (!event || typeof event !== "object") return;
    if (
        event.experiments === undefined &&
        event.guildExperiments === undefined &&
        event.guild_experiments === undefined &&
        event.apexExperiments === undefined &&
        event.apex_experiments === undefined
    ) {
        return;
    }

    cachedDesktopExperiments = {
        experiments: Array.isArray(event.experiments) ? [...event.experiments] : event.experiments,
        guildExperiments: Array.isArray(event.guildExperiments) ? [...event.guildExperiments] : event.guildExperiments,
        guild_experiments: Array.isArray(event.guild_experiments) ? [...event.guild_experiments] : event.guild_experiments,
        apexExperiments: event.apexExperiments,
        apex_experiments: event.apex_experiments,
    };
}

function applyCachedExperimentsToEvent(event: any) {
    if (!cachedDesktopExperiments || !event || typeof event !== "object") return;

    if (cachedDesktopExperiments.experiments !== undefined) {
        event.experiments = cachedDesktopExperiments.experiments;
    }
    if (cachedDesktopExperiments.guildExperiments !== undefined) {
        event.guildExperiments = cachedDesktopExperiments.guildExperiments;
    }
    if (cachedDesktopExperiments.guild_experiments !== undefined) {
        event.guild_experiments = cachedDesktopExperiments.guild_experiments;
    }
    if (cachedDesktopExperiments.apexExperiments !== undefined) {
        event.apexExperiments = cachedDesktopExperiments.apexExperiments;
    }
    if (cachedDesktopExperiments.apex_experiments !== undefined) {
        event.apex_experiments = cachedDesktopExperiments.apex_experiments;
    }
}

function experimentInterceptor(event: any) {
    if (event?.type !== "CONNECTION_OPEN") return false;

    if (!isSpoofedSession()) {
        cacheExperimentsFromEvent(event);
    } else if (shouldPreserveExperimentsFn()) {
        applyCachedExperimentsToEvent(event);
    }

    return false;
}

export function installExperimentInterceptor() {
    if (interceptorInstalled || !FluxDispatcher?.addInterceptor) return;
    FluxDispatcher.addInterceptor(experimentInterceptor);
    interceptorInstalled = true;
}

export function removeExperimentInterceptor() {
    if (!interceptorInstalled) return;
    const interceptors = FluxDispatcher?._interceptors;
    if (Array.isArray(interceptors)) {
        const idx = interceptors.indexOf(experimentInterceptor);
        if (idx !== -1) interceptors.splice(idx, 1);
    }
    interceptorInstalled = false;
}

export function patchGatewaySocket(): boolean {
    const socket = getGatewaySocket();
    if (!socket || typeof socket.send !== "function") return false;
    if (socket === patchedSocket && originalSend) return true;

    if (patchedSocket && patchedSocket !== socket) {
        unpatchGatewaySocket();
    }

    const orig = socket.send;
    originalSend = orig;
    patchedSocket = socket;

    socket.send = function patchedGatewaySend(op: number, data: any, ...rest: any[]) {
        if (op === OPCODE_IDENTIFY && data && typeof data === "object" && data.properties) {
            const platform = getPlatformFn();
            const preset = PLATFORM_PRESETS[platform];

            if (preset?.properties) {
                const spoofedData = {
                    ...data,
                    properties: {
                        ...data.properties,
                        ...preset.properties,
                    },
                };
                lastAppliedPlatform = platform;
                return orig.call(this, op, spoofedData, ...rest);
            }

            lastAppliedPlatform = "off";
        }

        return orig.call(this, op, data, ...rest);
    };

    return true;
}

export function unpatchGatewaySocket() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (patchedSocket && originalSend) {
        patchedSocket.send = originalSend;
    }

    patchedSocket = null;
    originalSend = null;
}

export function forceIdentify(options?: { showFeedback?: boolean; skipPatch?: boolean; }) {
    const showFeedback = options?.showFeedback ?? false;
    const skipPatch = options?.skipPatch ?? false;

    const socket = getGatewaySocket();
    if (!socket) {
        if (showFeedback) notify("PlatformSpoofer: Gateway socket not found.", "critical");
        return false;
    }

    if (!skipPatch && socket !== patchedSocket) {
        patchGatewaySocket();
    }

    socket.sessionId = null;
    socket.seq = 0;

    const ws = socket.webSocket;
    if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
        ws.close(1000, "PlatformSpoofer re-identify");
    } else if (!ws && typeof socket.close === "function" && typeof socket.connect === "function") {
        socket.close();
        setTimeout(() => socket.connect?.(), 500);
    }

    if (showFeedback) {
        const platform = skipPatch ? "off" : getPlatformFn();
        const preset = PLATFORM_PRESETS[platform];
        notify(
            platform === "off"
                ? "PlatformSpoofer: Restoring real client..."
                : `PlatformSpoofer: Switched to ${preset.shortLabel}`,
            "success"
        );
    }

    return true;
}

export function scheduleForceIdentify(showFeedback = true) {
    if (reconnectTimer) clearTimeout(reconnectTimer);

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        forceIdentify({ showFeedback });
    }, RECONNECT_DEBOUNCE_MS);
}

export function handleConnectionOpen(event?: any) {
    // Capture genuine desktop experiments from the initial CONNECTION_OPEN before start() re-identifies
    if (!isSpoofedSession()) {
        cacheExperimentsFromEvent(event);
    }

    const desired = getPlatformFn();

    if (!isSocketPatched()) {
        if (patchGatewaySocket() && desired !== "off" && lastAppliedPlatform !== desired) {
            scheduleForceIdentify(false);
        }
        return;
    }

    if (lastAppliedPlatform !== null && lastAppliedPlatform !== desired) {
        scheduleForceIdentify(false);
    }
}
