import { Job } from "./job";
import { PlatformManager } from "./platformManager";
import { RequestTracker } from "./requestTracker";

interface Worker {
    name: string;
    doJob: (job: Job) => void;
    findJob: () => void;
    manager: WorkerManager;
}

export interface WorkerManager {
    workers: Worker[];
    add: (worker: Worker) => void;
    assign: () => void;
    platformManager: {[platformName: string]: PlatformManager};
    check: () => void;
}

export const worker = (name: string, manager: WorkerManager) : Worker => {
    return {
        name: name,
        async doJob(job: Job) {
            console.log(`Job started for ${name}`);
            await job.doJob();
            console.log(`Job finished for ${name}`);
            this.findJob();
        },
        async findJob() {
            manager.add(this); // Add the worker back to the pool
            manager.assign(); // Ask for a new job
        },
        manager: manager,
    }
}

export const workerManager = (platformManagers: {[platformName: string]: PlatformManager}) : WorkerManager => {
    const workers: Worker[] = [];
    let lock = false;

    return {
        workers: workers,
        add(worker: Worker) {
            if (lock) {
                // Try again after a while
                setTimeout(() => {
                    this.add(worker);
                }, 1000);
            }
            lock = true;
            workers.push(worker);
            lock = false;
        },
        assign() {
            if (lock) {
                // Try again after a while
                setTimeout(() => {
                    this.assign();
                }, 1000);
            }

            lock = true;
            // Get the highest priority job 
            let score = Infinity;
            let dateAdded = new Date();
            let platformManager: PlatformManager | null = null;

            for (const pm of Object.values(platformManagers)) {
                const j = pm.poll();
                if (j != null && j.niceness < score) {
                    score = j.niceness;
                    dateAdded = j.addedTime;
                    platformManager = pm;
                }
                if (j?.niceness == score && j.addedTime < dateAdded) { // If two jobs have the same niceness, the one added first is chosen
                    dateAdded = j.addedTime;
                    platformManager = pm;
                }
            }

            if (platformManager == null) {
                console.log("No valid job to assign at the moment.")
                lock = false;
                return;
            }

            const job = platformManager.pop();

            if (job == null) {
                console.log("An error may have occurred..")
                lock = false;
                return;
            }
            // Assign the job to the worker
            const worker = workers.shift();
            if (worker) {
                worker.doJob(job);
            }
            lock = false;
        },
        check() { 
        // Check for new jobs every 10 seconds because assign() wouldn't be called if all workers are idle
        // Another potential way is to check every time a platform allows more requests, 
        // but that would increase coupling and require many more calls of check().
            setTimeout(() => {
                this.assign();
                this.check();
            }, 10000);
        },
        platformManager: platformManagers,

    }
}
