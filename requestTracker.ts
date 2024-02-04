export interface RequestTracker {
    maxRequestCount: number;
    windowSeconds: number;
    add: (num: number) => void;
    leftover: () => number;
};

export const requestTracker = (maxRequestCount: number, windowSeconds: number): RequestTracker => {
    let requestCount = 0;
    let lock = false;
    return {
        maxRequestCount: maxRequestCount,
        windowSeconds: windowSeconds,
        add(num: number) {
            if (lock) {
                // Try again after a while
                setTimeout(() => {
                    this.add(num);
                }, 1000);
                return;
            }
            lock = true;
            requestCount += num;
            setTimeout(() => {
                requestCount -= num;
            }, windowSeconds * 1000);
            lock = false;
        },
        leftover: () => maxRequestCount - requestCount,
    }
}