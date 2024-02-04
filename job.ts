import { RequestTracker } from './requestTracker'; // Import the RequestTracker type from the appropriate module

export interface Job {
    fn: (arg?: any) => Promise<any>;
    arg?: any;
    niceness: number;
    addedTime: Date;
    expectedCalls: number;
    tracker: RequestTracker;
}