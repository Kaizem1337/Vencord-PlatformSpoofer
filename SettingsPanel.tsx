/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Kaizem
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { classes } from "@utils/misc";
import { SessionsStore, useStateFromStores } from "@webpack/common";

import { forceIdentify } from "./gateway";
import { PLATFORM_KEYS, PLATFORM_PRESETS, PlatformKey } from "./platforms";
import { settings, switchPlatform } from "./settings";

interface SessionInfo {
    sessionId: string;
    status: string;
    active: boolean;
    clientInfo?: {
        os?: string;
        client?: string;
    };
}

function PlatformIcon({ platform, size = 18, className }: { platform: PlatformKey; size?: number; className?: string; }) {
    const preset = PLATFORM_PRESETS[platform] ?? PLATFORM_PRESETS.vr;
    return (
        <svg
            width={size}
            height={size}
            viewBox={preset.iconViewBox}
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d={preset.iconPath} />
        </svg>
    );
}

function statusDotClass(status: string): string {
    switch (status) {
        case "idle":
            return "vc-ps-dot vc-ps-dot-idle";
        case "dnd":
            return "vc-ps-dot vc-ps-dot-dnd";
        case "invisible":
        case "offline":
            return "vc-ps-dot vc-ps-dot-offline";
        default:
            return "vc-ps-dot";
    }
}

export function SettingsPanel() {
    const { platform } = settings.use(["platform"]);
    const currentKey: PlatformKey = platform && platform in PLATFORM_PRESETS ? (platform as PlatformKey) : "vr";
    const currentPreset = PLATFORM_PRESETS[currentKey];

    const sessions = useStateFromStores([SessionsStore], () => {
        const raw = SessionsStore?.getSessions?.();
        if (!raw || typeof raw !== "object") return [] as SessionInfo[];
        return Object.values(raw) as SessionInfo[];
    });

    return (
        <div className="vc-ps-panel">
            <Card>
                <Flex flexDirection="column" gap="10px">
                    <div className="vc-ps-header">
                        <div className="vc-ps-badge">
                            <PlatformIcon
                                platform={currentKey}
                                size={18}
                                className={classes("vc-ps-badge-icon", currentKey === "off" && "vc-ps-off")}
                            />
                            <span>
                                {currentKey === "off"
                                    ? "Spoofing Disabled"
                                    : `Active: ${currentPreset.shortLabel}`}
                            </span>
                        </div>

                        <Button
                            size="small"
                            variant="secondary"
                            onClick={() => forceIdentify({ showFeedback: true })}
                        >
                            Reconnect
                        </Button>
                    </div>

                    <Paragraph className="vc-ps-note">
                        {currentPreset.description}
                    </Paragraph>

                    <div className="vc-ps-grid">
                        {PLATFORM_KEYS.map(key => {
                            const preset = PLATFORM_PRESETS[key];
                            const active = currentKey === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={classes("vc-ps-tile", active && "vc-ps-tile-active")}
                                    onClick={() => switchPlatform(key)}
                                >
                                    <PlatformIcon
                                        platform={key}
                                        size={16}
                                        className="vc-ps-tile-icon"
                                    />
                                    <span>{preset.shortLabel}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div>
                        <Heading tag="h5" style={{ marginBottom: "6px" }}>
                            Active Sessions
                        </Heading>
                        <div className="vc-ps-sessions">
                            {sessions.length > 0 ? (
                                sessions.map(session => {
                                    const client = session.clientInfo?.client ?? "unknown";
                                    const os = session.clientInfo?.os ?? "unknown";
                                    return (
                                        <span key={session.sessionId} className="vc-ps-session-chip">
                                            <span className={statusDotClass(session.status)} />
                                            <span>{client} / {os}</span>
                                            <span>({session.status})</span>
                                        </span>
                                    );
                                })
                            ) : (
                                <Paragraph className="vc-ps-note">No active sessions.</Paragraph>
                            )}
                        </div>
                    </div>
                </Flex>
            </Card>
        </div>
    );
}
