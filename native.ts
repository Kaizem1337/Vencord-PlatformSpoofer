/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Kaizem
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent } from "electron";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";

const GITHUB_REPO = "Kaizem1337/Vencord-PlatformSpoofer";
const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const ALLOWED_DOWNLOAD_PREFIX = `https://github.com/${GITHUB_REPO}/releases/download/`;

const DISCORD_DESKTOP_FILES = [
    "patcher.js",
    "preload.js",
    "renderer.js",
    "renderer.css",
] as const;

const VESKTOP_FILES = [
    "vencordDesktopMain.js",
    "vencordDesktopPreload.js",
    "vencordDesktopRenderer.js",
    "vencordDesktopRenderer.css",
] as const;

interface GithubReleaseAsset {
    name: string;
    browser_download_url: string;
}

interface GithubReleaseResponse {
    tag_name?: string;
    name?: string;
    html_url?: string;
    assets?: GithubReleaseAsset[];
}

export interface UpdateCheckResult {
    ok: boolean;
    hasUpdate?: boolean;
    currentVersion?: string;
    latestVersion?: string;
    releaseUrl?: string;
    canAutoInstall?: boolean;
    error?: string;
}

export interface UpdateInstallResult {
    ok: boolean;
    latestVersion?: string;
    error?: string;
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

function getInstalledBundleFiles(): string[] {
    const hasDesktop = existsSync(join(__dirname, "patcher.js"));
    const hasVesktop = existsSync(join(__dirname, "vencordDesktopMain.js"));
    const files: string[] = [];

    if (hasDesktop) files.push(...DISCORD_DESKTOP_FILES);
    if (hasVesktop) files.push(...VESKTOP_FILES);
    if (!files.length) files.push(...DISCORD_DESKTOP_FILES);

    return files;
}

function isGitCheckout(): boolean {
    return existsSync(join(__dirname, "..", ".git"));
}

async function fetchLatestRelease(currentVersion: string): Promise<GithubReleaseResponse> {
    const res = await fetch(LATEST_RELEASE_API, {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": `Vencord-PlatformSpoofer/${normalizeVersion(currentVersion)}`,
        },
    });

    if (!res.ok) {
        throw new Error(`GitHub API returned ${res.status}`);
    }

    return (await res.json()) as GithubReleaseResponse;
}

export async function checkForUpdate(
    _: IpcMainInvokeEvent,
    currentVersion: string
): Promise<UpdateCheckResult> {
    try {
        const release = await fetchLatestRelease(currentVersion);
        const latestVersion = normalizeVersion(release.tag_name ?? "");
        const current = normalizeVersion(currentVersion);

        if (!latestVersion) {
            return { ok: false, error: "Latest release has no version tag." };
        }

        const assets = release.assets ?? [];
        const assetNames = new Set(assets.map(a => a.name));
        const requiredFiles = getInstalledBundleFiles();
        const hasAllAssets = requiredFiles.every(name => assetNames.has(name));

        return {
            ok: true,
            hasUpdate: isNewerVersion(latestVersion, current),
            currentVersion: current,
            latestVersion,
            releaseUrl: release.html_url ?? `https://github.com/${GITHUB_REPO}/releases/latest`,
            canAutoInstall: !isGitCheckout() && hasAllAssets,
        };
    } catch (err: any) {
        return { ok: false, error: err?.message ?? String(err) };
    }
}

export async function installUpdate(
    _: IpcMainInvokeEvent,
    currentVersion: string
): Promise<UpdateInstallResult> {
    try {
        if (isGitCheckout()) {
            return { ok: false, error: "Auto-update is disabled for source git builds. Pull and rebuild instead." };
        }

        const release = await fetchLatestRelease(currentVersion);
        const latestVersion = normalizeVersion(release.tag_name ?? "");
        const assets = release.assets ?? [];
        const assetMap = new Map(assets.map(a => [a.name, a.browser_download_url]));
        const requiredFiles = getInstalledBundleFiles();

        // Download and verify all files in memory before writing to disk
        const downloaded: Array<{ path: string; data: Buffer; }> = [];
        for (const fileName of requiredFiles) {
            const url = assetMap.get(fileName);
            if (!url || !url.startsWith(ALLOWED_DOWNLOAD_PREFIX)) {
                return { ok: false, error: `Release is missing required asset: ${fileName}` };
            }

            const res = await fetch(url, {
                headers: { "User-Agent": `Vencord-PlatformSpoofer/${normalizeVersion(currentVersion)}` },
            });
            if (!res.ok) {
                return { ok: false, error: `Failed to download ${fileName} (HTTP ${res.status})` };
            }

            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.byteLength === 0) {
                return { ok: false, error: `Downloaded empty asset: ${fileName}` };
            }

            downloaded.push({ path: join(__dirname, fileName), data: buf });
        }

        await Promise.all(downloaded.map(f => writeFile(f.path, f.data)));

        return { ok: true, latestVersion };
    } catch (err: any) {
        return { ok: false, error: err?.message ?? String(err) };
    }
}
