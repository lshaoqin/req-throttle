export interface RequestTracker {
    maxRequestCount: number;
    windowSeconds: number;
    add: (num: number) => void;
    leftover: () => number;
};

export const requestTracker = (maxRequestCount: number, windowSeconds: number): RequestTracker => {
    let requestCount = 0;
    return {
        maxRequestCount: maxRequestCount,
        windowSeconds: windowSeconds,
        add: (num: number) => {
            requestCount += num;
            setTimeout(() => {
                requestCount -= num;
            }, windowSeconds * 1000);
        },
        leftover: () => maxRequestCount - requestCount
    }
}