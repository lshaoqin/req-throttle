import { Job } from "./job";
import { PlatformManager } from "./platformManager";
import { RequestTracker } from "./requestTracker";

interface Worker {
    name: string;
    doJob: (job: Job) => void;
    manager: WorkerManager;
}

interface WorkerManager {
    workers: Worker[];
    add: (worker: Worker) => void;
    assign: () => void;
    platformManager: {[platformName: string]: PlatformManager};
}

const worker = (name: string, manager: WorkerManager) : Worker => {
    function track(tracker: RequestTracker, fn: (arg?: any) => Promise<any>, arg?: any) {
        /*

        Update the corresponding tracker every time a request to the platform is made.
        This can be done by having fn take in the tracker as an argument and updating it
        within the function evry time a request is made.
        Alternatively, the tracker can be updated by the router functions which make the requests.

        Here, we simulate that the function fn is making only one request to the platform.

        */
        fn(arg);
        tracker.add(1);
    }
    return {
        name: name,
        async doJob(job: Job) {
            console.log("Job started for worker one");
            track(job.tracker, job.fn, job.arg);
            console.log("Job finished for worker one");
            manager.add(this); // Add the worker back to the pool
            manager.assign(); // Ask for a new job!
        },
        manager: manager,
    }
}

export const workerManager = (platformManagers: {[platformName: string]: PlatformManager}) : WorkerManager => {
    const workers: Worker[] = [];
    return {
        workers: workers,
        add: (worker: Worker) => {
            workers.push(worker);
        },
        assign: () => {
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
                return;
            }

            const job = platformManager.pop();

            if (job == null) {
                console.log("An error may have occurred..")
                return;
            }
            // Assign the job to the worker
            const worker = workers.shift();
            if (worker) {
                worker.doJob(job);
            }
        },
        platformManager: platformManagers,
    }
}
