import { RequestTracker } from './requestTracker'; // Import the RequestTracker type from the appropriate module

export interface Job {
    doJob: () => void;
    niceness: number;
    addedTime: Date;
    expectedCalls: number;
    tracker: RequestTracker;
    promise: Promise<any>;
}

export const job = (fn: (arg?: any) => Promise<any>, niceness: number = 0, expectedCalls: number = 1, tracker: RequestTracker, arg?: any) : Job => {
    let resolveFn: (value?: any) => void;
    const promise = new Promise<any>((resolve, reject) => {
        resolveFn = resolve;
    });
    
    async function runAndTrack() {
        /*

        Update the corresponding tracker every time a request to the platform is made.
        This can be done by having fn take in the tracker as an argument and calling
        tracker.add(x) every time a request is made.
        Alternatively, the tracker can be updated by the router functions which make the requests.

        Here, we simulate that the function fn is making (expectedCalls) requests.

        */
        tracker.add(expectedCalls);
        const res = await fn(arg);
        return res;
    }
    return {
        doJob: async () => {
            const res = await runAndTrack();
            resolveFn(res);
        },
        niceness: niceness,
        addedTime: new Date(),
        expectedCalls: expectedCalls,
        tracker: tracker,
        promise: promise,
    }
}