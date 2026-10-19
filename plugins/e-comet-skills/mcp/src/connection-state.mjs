// The one extension session this process holds through a broker, and what the extension announced in it.
export class ConnectionState {
    #extensionReadyWaiters = new Set();
    #closed = false;
    #now;

    extensionSession = null;
    extensionReady = false;
    extensionBrowserJobReady = false;
    extensionOzonPromotionReady = false;
    extensionOzonPromotionPackageReady = false;
    extensionOzonAnalyticsReady = false;
    extensionDiagnosticSnapshotReady = false;
    extensionLastConnectedAtMs = null;
    extensionLastDisconnectedAtMs = null;
    extensionVersion = undefined;
    browserContext = { state: 'unknown' };

    constructor({ now = Date.now } = {}) {
        this.#now = now;
    }

    now() {
        return this.#now();
    }

    // Returns the session this one replaced, for the caller to close.
    connectExtension(session, options) {
        const previous = this.extensionSession;
        if (previous !== session) this.browserContext = { state: 'unknown' };
        this.extensionSession = session;
        this.extensionReady = true;
        this.extensionBrowserJobReady = options.browserJobSupported === true;
        this.extensionOzonPromotionReady = options.ozonSellerPromotionReportSupported === true;
        this.extensionOzonPromotionPackageReady = options.ozonSellerPromotionReportsSupported === true;
        this.extensionOzonAnalyticsReady = options.ozonSellerAnalyticsReportSupported === true;
        this.extensionDiagnosticSnapshotReady = options.diagnosticSnapshotSupported === true;
        this.extensionVersion = options.version;
        this.extensionLastConnectedAtMs = this.#now();
        for (const waiter of [...this.#extensionReadyWaiters]) waiter(true);
        return previous && previous !== session ? previous : null;
    }

    disconnectExtension(session) {
        if (this.extensionSession !== session) return false;
        this.extensionSession = null;
        this.extensionReady = false;
        this.extensionBrowserJobReady = false;
        this.extensionOzonPromotionReady = false;
        this.extensionOzonPromotionPackageReady = false;
        this.extensionOzonAnalyticsReady = false;
        this.extensionDiagnosticSnapshotReady = false;
        this.extensionLastDisconnectedAtMs = this.#now();
        this.browserContext = { state: 'unknown' };
        return true;
    }

    updateBrowserContext(session, context) {
        if (session !== this.extensionSession) return false;
        const previous = this.browserContext;
        if (previous.state === 'known' && previous.wbTabConnected === context.wbTabConnected && previous.sellerTabConnected === context.sellerTabConnected) return false;
        this.browserContext = { state: 'known', ...context, changedAt: new Date(this.#now()).toISOString() };
        return true;
    }

    waitForExtensionReady(timeoutMs) {
        if (this.#closed) return Promise.resolve(false);
        if (this.extensionReady) return Promise.resolve(true);
        return new Promise((resolve) => {
            const waiter = (ready) => {
                clearTimeout(waiter.timer);
                this.#extensionReadyWaiters.delete(waiter);
                resolve(ready);
            };
            waiter.timer = setTimeout(() => waiter(false), timeoutMs);
            this.#extensionReadyWaiters.add(waiter);
        });
    }

    close() {
        if (this.#closed) return;
        this.#closed = true;
        for (const waiter of [...this.#extensionReadyWaiters]) waiter(false);
    }
}
