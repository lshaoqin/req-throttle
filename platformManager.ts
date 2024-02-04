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

    return {
        platform: platform,
        requestTracker: rt,
        add: (job: Job) => {
            pq.insert(job, job.niceness);
        },
        poll: () => {
            const job = pq.peek();
            if (job == null || job.expectedCalls > rt.leftover()) {
                return null;
            }
            return job;
        },
        pop: () => {
            const job = pq.pop();
            return job;
        }
    }
}