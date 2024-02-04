import { PlatformManager, platformManager } from './platformManager'; 
import { Job } from './job'; 
import { workerManager } from './workerManager';

interface RateLimit {
    requestCount: number;    // Number of requests allowed per rolling window.
    windowSeconds: number;   // Time window defined in seconds.
};

interface Connection {
    platform: string;      // A unique platform identifier.
    connection: string;    // A unique connection identifier.
    niceness: number;      // Associated workflow priority, 0 is the highest priority.
    rateLimit: RateLimit;  // The rate-limit for the connection.
};

const platformManagers: {[platformName: string]: PlatformManager} = {};
const wm = workerManager(platformManagers);

export function throttle<T, U> (
    connection: Connection,
    fn: (arg?: T) => Promise<U>,
    arg?: T,
    expectedCalls: number = 1
) : Promise<U> {
    const platform = connection.platform;
    const niceness = connection.niceness;
    const requestCount = connection.rateLimit.requestCount;
    const windowSeconds = connection.rateLimit.windowSeconds;

    if (!platformManagers[platform]) {
        platformManagers[platform] = platformManager(platform, requestCount, windowSeconds);
    }

    const pm = platformManagers[platform];
    const job : Job = { fn, arg, niceness, expectedCalls, tracker: pm.requestTracker, addedTime: new Date()};
    pm.add(job);
    wm.assign(); // See if there are any workers available to do the job.

    return fn(arg);
}
  