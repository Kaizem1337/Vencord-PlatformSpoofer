/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Kaizem
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByProps } from "@webpack";
import { showToast } from "@webpack/common";

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

let patchedSocket: GatewaySocketLike | null = null;
let originalSend: GatewaySocketLike["send"] | null = null;
let lastAppliedPlatform: PlatformKey | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let getPlatformFn: () => PlatformKey = () => "vr";
let shouldShowToastsFn: () => boolean = () => true;

export function configureGatewayHooks(
    getPlatform: () => PlatformKey,
    shouldShowToasts: () => boolean
) {
    getPlatformFn = getPlatform;
    shouldShowToastsFn = shouldShowToasts;
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

export function handleConnectionOpen() {
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
