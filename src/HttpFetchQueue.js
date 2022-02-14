import JobsQueue from "jobs-queue";
import fetchContent from "./fetchContent/fetchContent.js";

class HttpFetchQueue extends JobsQueue {
    constructor(options = {}) {
        super();

        this._options = options;

        HttpFetchQueue.validateJobOptions(this._options);
    }

    enqueue(url, fetchOptions, contentOptions, jobOptions = {}) {
        const mergedJobOptions = {
            ...this._options,
            ...jobOptions
        };

        HttpFetchQueue.validateJobOptions(mergedJobOptions);

        let attempt = 0;

        return super.enqueue({
            start: () => {
                attempt++;

                this.emit('fetch:attempt', {
                    attempt: attempt,
                    url: url,
                    fetchOptions: fetchOptions,
                    contentOptions: contentOptions,
                    jobOptions: jobOptions
                });

                return fetchContent(url, fetchOptions, contentOptions).then(response => {
                    this.emit('fetch:success', {
                        attempt: attempt,
                        url: url,
                        fetchOptions: fetchOptions,
                        contentOptions: contentOptions,
                        jobOptions: jobOptions,
                        response: response
                    });
                    return response;
                });
            },
            startFilter: () => {
                return typeof mergedJobOptions.maxConcurrents === "number"
                    ? this.running.size < mergedJobOptions.maxConcurrents // limit max concurrents
                    : true;
            },
            retryFilter: (error) => {
                this.emit('fetch:error', {
                    attempt: attempt,
                    url: url,
                    fetchOptions: fetchOptions,
                    contentOptions: contentOptions,
                    jobOptions: jobOptions,
                    error: error
                });

                return typeof mergedJobOptions.maxAttempts === "number"
                    ? attempt < mergedJobOptions.maxAttempts // limit max concurrents
                    : false;
            }
        });
    }

    static validateJobOptions(jobOptions) {
        if(typeof jobOptions.maxConcurrents === "number" && jobOptions.maxConcurrents < 1)
            throw new Error("Invalid maxConcurrents option");

        if(typeof jobOptions.maxAttempts === "number" && jobOptions.maxAttempts < 1)
            throw new Error("Invalid maxAttempts option");
    }
}

export default HttpFetchQueue;
