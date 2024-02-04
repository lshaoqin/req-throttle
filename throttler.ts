import { PlatformManager, platformManager } from './platformManager'; 
import { job } from './job'; 
import { workerManager, worker } from './workerManager';

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
    const j = job(fn, niceness, expectedCalls, pm.requestTracker, arg)
    const promise = j.promise;
    pm.add(j);
    wm.assign(); // See if there are any workers available to do the job.

    return promise;
}

const platformManagers: {[platformName: string]: PlatformManager} = {};
const wm = workerManager(platformManagers);

const w1 = worker("worker1", wm);
const w2 = worker("worker2", wm);
const w3 = worker("worker3", wm);
const w4 = worker("worker4", wm);
wm.add(w1);
wm.add(w2);
wm.add(w3);
wm.add(w4);
wm.check();


// Tests
const connection: Connection = {
    platform: "platform1",
    connection: "connection1",
    niceness: 0,
    rateLimit: { requestCount: 5, windowSeconds: 10 }
};

const connection2: Connection = {
    platform: "platform2",
    connection: "connection2",
    niceness: 0,
    rateLimit: { requestCount: 5, windowSeconds: 10 }
};

const connection3: Connection = {
    platform: "platform3",
    connection: "connection3",
    niceness: 1,
    rateLimit: { requestCount: 5, windowSeconds: 10 }
};

throttle(connection, async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Hello, world1!");
}, null, 1);

throttle(connection, async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Hello, world2!");
}, null, 1);

throttle(connection2, async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Hello, world3!");
}, null, 3);

throttle(connection2, async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Hello, world4!");
}, null, 3); // Cannot complete the whole activity without exceeding the rate limit, so it will be queued.

throttle(connection3, async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Hello, world5!");
}, null, 1);

throttle(connection3, async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Hello, world6!");
}, null, 1); // Exceeds the worker capacity, so it will be queued.

