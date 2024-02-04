import { Job } from "./job";
import { priorityQueue } from "./priorityQueue";
import { RequestTracker, requestTracker } from "./requestTracker";

export interface PlatformManager {
    platform: string;
    requestTracker: RequestTracker;
    add: (job: Job) => void;
    poll: () => Promise<Job | null>;
    pop: () => Promise<Job | null>;
}

export const platformManager = (platform: string, maxRequests: number, timeWindow: number): PlatformManager => {
    const pq = priorityQueue<Job>();
    const rt = requestTracker(maxRequests, timeWindow);
    let lock = false;

    return {
        platform: platform,
        requestTracker: rt,
        add(job: Job) {
            if (lock) {
                // Try again after a while
                setTimeout(() => {
                    this.add(job);
                }, 1000);
                return;
            }
            lock = true;
            pq.insert(job, job.niceness);
            lock = false;
        },
        poll() {
            return new Promise((resolve, reject) => {
                const tryPoll = () => {
                    if (lock) {
                        // Try again after a while
                        setTimeout(tryPoll, 1000);
                    } else {
                        lock = true;
                        const job = pq.peek();
                        lock = false;
                        if (job == null || job.expectedCalls > rt.leftover()) { 
                            // If the highest priority job has more expected calls than the leftover requests, wait until there are enough requests
                            resolve(null);
                        } else {
                            lock = false;
                            resolve(job);
                        }
                    }
                };
                tryPoll();
            });
        },
        pop() {
            return new Promise((resolve, reject) => {
                const tryPop = () => {
                    if (lock) {
                        // Try again after a while
                        setTimeout(tryPop, 1000);
                    } else {
                        lock = true;
                        const job = pq.pop();
                        lock = false;
                        resolve(job);
                    }
                };
                tryPop();
            });
        },
    }
}