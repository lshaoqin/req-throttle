import { Job } from "./job";
import { priorityQueue } from "./priorityQueue";
import { RequestTracker, requestTracker } from "./requestTracker";

export interface PlatformManager {
    platform: string;
    requestTracker: RequestTracker;
    add: (job: Job) => void;
    poll: () => Job | null;
    pop: () => Job | null;
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
            }
            lock = true;
            pq.insert(job, job.niceness);
            lock = false;
        },
        poll() {
            if (lock) {
                // Try again after a while
                setTimeout(() => {
                    return this.poll();
                }, 1000);
            }
            lock = true;
            const job = pq.peek();
            if (job == null || job.expectedCalls > rt.leftover()) { 
                // If the highest priority job has more expected calls than the leftover requests, wait until there are enough requests
                return null;
            }
            lock = false;
            return job;
        },
        pop() {
            if (lock) {
                // Try again after a while
                setTimeout(() => {
                    return this.pop();
                }, 1000);
            }
            lock = true;
            const job = pq.pop();   
            lock = false;
            return job;
        }
    }
}