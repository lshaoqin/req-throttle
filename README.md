# req-throttle
A basic request throttler in TypeScript to schedule API requests with the constraints of limited workers and API rate limits.

## Design
- [`throttle()`](https://github.com/lshaoqin/req-throttle/blob/main/throttler.ts) method takes in an activity and converts it into a Job. The Job is assigned to a PlatformManager based on which platform it makes requests to.
- [`Jobs`](https://github.com/lshaoqin/req-throttle/blob/main/job.ts) contain a promise which will be resolved once they are carried out. They are managed by PlatformManagers.
- [`PlatformManager`](https://github.com/lshaoqin/req-throttle/blob/main/platformManager.ts) hands jobs over to the WorkerManager based on their priority. Each PlatformManager has a RequestTracker which helps to track if a job would go past a rate limit.
- [`RequestTrackers`](https://github.com/lshaoqin/req-throttle/blob/main/requestTracker.ts) track the available quota for API calls. The quota is updated whenever a request is made, and a timer is set to automatically update when the time window passes.
- [`WorkerManager`](https://github.com/lshaoqin/req-throttle/blob/main/workerManager.ts) handles finding the most important job from all PlatformManagers, and will assign these jobs to workers whenever possible.
