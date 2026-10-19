// Why no broker answers, decided from what this process observed: the platform, the registration, the user-level hosts
// policy, the extension_install probe, the broker entries and failure records, and the last connect attempt (spec §5.8).
// Each cause carries the one step the seller can take (spec §8), so the agent never has to guess one.
import { existsSync, readFileSync } from 'node:fs';

import { BRIDGE_CODES } from './bridge-codes.mjs';
import { isNativeCapableVersion } from './browser-extension-install.mjs';
import { ToolExecutionError } from './tool-errors.mjs';

export { BRIDGE_CODES };

// English agent texts condensed from spec §8 "Seller-facing action". Russian UI labels are quoted as the browser shows
// them; {browser} is filled with the browser the cause names, or "the browser". Each fits 400 characters filled in.
export const BRIDGE_ACTIONS = Object.freeze({
    // The store link does not fit beside the puzzle-button hint in 400 characters, so the store is named instead.
    BRIDGE_NO_BROWSER: 'Ask the user to open {browser} with the e-Comet extension (install it from the Chrome Web Store if missing), ' +
        'click the e-Comet icon (under the Extensions puzzle button if it is not pinned), accept the permission under ' +
        '«Требуется действие» if shown, and repeat the request. If it still fails, apply the update on app.e-comet.io or ' +
        'restart the browser; then report it.',
    // Accepted residual "Chrome disables the extension until the permission is accepted": docs/local-agent-architecture.md#accepted-residuals.
    BRIDGE_PERMISSION_REQUIRED: 'e-Comet stays off in {browser} until the user accepts its new permission. Ask the user to press ' +
        '«Требуется действие» right of the address bar (or the ⋮ menu) → «Расширение "e-Comet" отключено» → «Разрешить», then ' +
        'repeat the request. Turning e-Comet on at chrome://extensions, edge://extensions or browser://extensions asks for the same permission.',
    // Accepted residual "An extension update not yet applied when the plugin arrives": docs/local-agent-architecture.md#accepted-residuals.
    BRIDGE_EXTENSION_OUTDATED: 'The e-Comet extension in the browser is too old for this plugin. Ask the user to apply the extension ' +
        'update offered on app.e-comet.io or restart the browser, press «Разрешить» when the browser asks for the new permission ' +
        'under «Требуется действие», and repeat the request. Report it to e-Comet if the version stays old.',
    BRIDGE_EXTENSION_DISABLED: 'The e-Comet extension is turned off in the browser. Ask the user to turn e-Comet on in the ' +
        'extensions page (chrome://extensions, edge://extensions or browser://extensions) and repeat the request.',
    BRIDGE_USER_HOSTS_DISABLED: 'An administrator policy (NativeMessagingUserLevelHosts) stops {browser} on this computer from ' +
        'starting apps installed per user, so it cannot start e-Comet. This is not an e-Comet or user fault: whoever manages the ' +
        'computer can allow it.',
    BRIDGE_BROKER_UNRESPONSIVE: "The browser started e-Comet's local connector, but it does not answer. Ask the user to restart " +
        'the browser and repeat the request; report it to e-Comet if it repeats.',
    // A registration failure (disk, permissions) and a broker failure record both land here, so the text names no owner:
    // the step and system code in the bug report tell support which one it was.
    BRIDGE_BROKER_FAILED: "e-Comet's local connector could not be set up or failed to start on this computer. No step for the user " +
        'is known: offer to report it to e-Comet so support can see why.',
    // Every broker_refusal code and the client's own size check land here; details.refusalCode names which one.
    BRIDGE_FRAME_TOO_LARGE: 'The local e-Comet bridge refused a message for the extension (details.refusalCode). This is an ' +
        'e-Comet defect; report it to e-Comet.',
    BRIDGE_MACOS_FOLDER_ACCESS: 'macOS did not let the agent app register e-Comet with the browser. Ask the user to open System ' +
        'Settings → Privacy & Security → Files & Folders, allow the browser for the app that runs the agent, and repeat the request.',
    BRIDGE_UNAVAILABLE_IN_WSL: 'The agent runs inside WSL and cannot reach the browser on Windows. Ask the user to run the agent on ' +
        'Windows; in Codex Desktop, turn off running the agent in WSL.',
    BRIDGE_UNSUPPORTED_PLATFORM: 'The agent runs on Linux, where e-Comet cannot reach a browser. Ask the user to use the agent on ' +
        'Windows or macOS.',
});

// Failures with no supported user step, and setups the user cannot change in place: repeating the request cannot help.
const FINAL_CODES = new Set(['BRIDGE_BROKER_FAILED', 'BRIDGE_UNAVAILABLE_IN_WSL', 'BRIDGE_UNSUPPORTED_PLATFORM', 'BRIDGE_FRAME_TOO_LARGE']);
const BROWSER_NAMES = Object.freeze({ chrome: 'Google Chrome', edge: 'Microsoft Edge', brave: 'Brave', yandex: 'Yandex Browser', opera: 'Opera' });

/**
 * The tool error for a cause. A code that is no closed cause becomes BRIDGE_NO_BROWSER, which claims nothing more than
 * that no broker answered; a browser outside the probe's list is not named.
 * @param {{ code?: unknown, browser?: unknown }} cause
 */
export function bridgeCauseError({ code, browser } = {}) {
    const known = BRIDGE_CODES.includes(/** @type {string} */ (code)) ? /** @type {keyof typeof BRIDGE_ACTIONS} */ (code) : 'BRIDGE_NO_BROWSER';
    const name = Object.hasOwn(BROWSER_NAMES, /** @type {string} */ (browser)) ? BROWSER_NAMES[/** @type {keyof typeof BROWSER_NAMES} */ (browser)] : 'the browser';
    return new ToolExecutionError(known, BRIDGE_ACTIONS[known].replace('{browser}', name), 'local', !FINAL_CODES.has(known));
}

// Accepted residual "Agents inside WSL lose live data": docs/local-agent-architecture.md#accepted-residuals.
// Accepted residual "An agent on a plain Linux desktop loses live data": docs/local-agent-architecture.md#accepted-residuals.
/**
 * Registration covers Windows and macOS only. WSL is read from /proc, never from environment variables, which Codex
 * filters out of a server's environment.
 */
export function detectPlatformCause({ platform = process.platform, readFile = (path) => readFileSync(path, 'utf8'), exists = existsSync } = {}) {
    if (platform === 'win32' || platform === 'darwin') return null;
    if (platform !== 'linux') return 'BRIDGE_UNSUPPORTED_PLATFORM';
    let version = '';
    try {
        version = String(readFile('/proc/version'));
    } catch {
        // No /proc/version: only the interop marker can still tell WSL.
    }
    return /microsoft/i.test(version) || exists('/proc/sys/fs/binfmt_misc/WSLInterop') ? 'BRIDGE_UNAVAILABLE_IN_WSL' : 'BRIDGE_UNSUPPORTED_PLATFORM';
}

const RANKS = ['ready', 'permission', 'outdated', 'disabled', 'unknown'];
const rankOf = (profile) => {
    if (profile.state === 'enabled') return isNativeCapableVersion(profile.version) ? 'ready' : profile.version ? 'outdated' : 'unknown';
    if (profile.state === 'disabled') return profile.permissionsIncrease && profile.disableReasons?.length === 1 ? 'permission' : 'disabled';
    return 'unknown';
};
const installsOf = (probe) => (Array.isArray(probe?.facts?.browsers) ? probe.facts.browsers : []);
const recency = (profile) => profile.lastUsedDaysAgo ?? Infinity;
// The most recently used profile where the extension is enabled, otherwise the most recently used one with an install.
const judgedProfile = (profiles) => {
    const byRecency = [...profiles].sort((a, b) => recency(a) - recency(b));
    return byRecency.find((profile) => profile.state === 'enabled') ?? byRecency[0];
};
const nativeReady = (probe) => installsOf(probe).some(({ profiles }) => profiles.some((profile) => rankOf(profile) === 'ready'));

/**
 * The first matching cause of spec §5.8. `failureRecords` are the client's, already cut at this process's last good
 * session; the cut at the newest live entry and the manifest write is repeated here against the facts passed in.
 * @returns {{ code: string, browser?: string }}
 */
export function chooseBridgeCause({ platformCause, registration, policy, probe, entries = [], failureRecords = [], lastConnect }) {
    if (platformCause) return { code: platformCause };
    if (registration?.state === 'denied') return { code: 'BRIDGE_MACOS_FOLDER_ACCESS' };
    const settledAt = Math.max(-Infinity, registration?.manifestWrittenAtMs ?? -Infinity, ...entries.map((entry) => entry.startedAt));
    if (registration?.state === 'failed' || (nativeReady(probe) && failureRecords.some((record) => record.at > settledAt))) {
        return { code: 'BRIDGE_BROKER_FAILED' };
    }
    if (entries.length > 0 && lastConnect?.reason === 'unresponsive') return { code: 'BRIDGE_BROKER_UNRESPONSIVE' };

    const browsers = installsOf(probe);
    const judged = browsers.flatMap(({ browser, profiles }) => (profiles.length > 0 ? [{ browser, rank: rankOf(judgedProfile(profiles)) }] : []))
        .sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
    const best = judged[0];
    const named = (code, browser = best?.browser) => (browser ? { code, browser } : { code });
    if (best?.rank === 'ready') {
        const allowed = judged.find(({ rank, browser }) => rank === 'ready' && policy?.find((item) => item.browser === browser)?.allowed !== false);
        return allowed ? named('BRIDGE_NO_BROWSER', allowed.browser) : named('BRIDGE_USER_HOSTS_DISABLED');
    }
    if (best?.rank === 'permission') return named('BRIDGE_PERMISSION_REQUIRED');
    // OUTDATED and DISABLED speak for every install, so they need a probe that read every profile it found.
    const profiles = browsers.flatMap((browser) => browser.profiles);
    const complete = probe?.state === 'passed';
    if (best?.rank === 'outdated' && complete && !profiles.some((profile) => isNativeCapableVersion(profile.version) || rankOf(profile) === 'unknown')) {
        return named('BRIDGE_EXTENSION_OUTDATED');
    }
    if (best?.rank === 'disabled' && complete && profiles.every((profile) => rankOf(profile) === 'disabled')) return named('BRIDGE_EXTENSION_DISABLED');
    return named('BRIDGE_NO_BROWSER');
}

const WAIT_WINDOW_MS = 30_000;

// Accepted residual "Broker restarts with the extension": docs/local-agent-architecture.md#accepted-residuals.
/**
 * Whether a broker is about to appear (spec §5.7): an install is enabled on a native-capable build, and the manifest was
 * written or this process's session ended less than 30 s ago (a first registration, an extension update, a browser
 * restart).
 */
export function shouldWaitForBroker({ probe, registration, lastSessionEndAtMs, now }) {
    const recent = (at) => Number.isFinite(at) && now - at < WAIT_WINDOW_MS;
    return nativeReady(probe) && (recent(registration?.manifestWrittenAtMs) || recent(lastSessionEndAtMs));
}
