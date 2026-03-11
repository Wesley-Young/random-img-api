export function logInfo(message: string): void {
    console.log(`[info] ${message}`);
}

export function logWarn(message: string, error?: unknown): void {
    console.warn(`[warn] ${message}`, error);
}

export function logError(message: string, error?: unknown): void {
    console.error(`[error] ${message}`, error);
}
