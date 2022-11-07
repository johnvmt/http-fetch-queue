import JobsQueue from "jobs-queue";
import fetchContent from "./fetchContent/fetchContent.js";

class HttpFetchQueue extends JobsQueue {
    constructor(options = {}) {
        super();

        this._options = options;

        HttpFetchQueue.validateJobConfig(this._options);
    }

    enqueue(url, fetchOptions, contentOptions, jobConfig = {}) {
        const mergedJobConfig = {
            ...this._options,
            ...jobConfig
        };

        HttpFetchQueue.validateJobConfig(mergedJobConfig);

        let attempt = 0;

        return super.enqueue({
            ...mergedJobConfig,
            start: () => {
                attempt++;

                this.emit('fetch:attempt', {
                    attempt: attempt,
                    url: url,
                    fetchOptions: fetchOptions,
                    contentOptions: contentOptions,
                    jobConfig: jobConfig
                });

                return fetchContent(url, fetchOptions, contentOptions).then(response => {
                    this.emit('fetch:success', {
                        attempt: attempt,
                        url: url,
                        fetchOptions: fetchOptions,
                        contentOptions: contentOptions,
                        jobConfig: jobConfig,
                        response: response
                    });
                    return response;
                });
            },
            startFilter: () => {
                return typeof mergedJobConfig.maxConcurrents === "number"
                    ? this.running.size < mergedJobConfig.maxConcurrents // limit max concurrents
                    : true;
            },
            retryFilter: (error) => {
                this.emit('fetch:error', {
                    attempt: attempt,
                    url: url,
                    fetchOptions: fetchOptions,
                    contentOptions: contentOptions,
                    jobConfig: jobConfig,
                    error: error
                });

                return typeof mergedJobConfig.maxAttempts === "number"
                    ? attempt < mergedJobConfig.maxAttempts // limit max concurrents
                    : false;
            }
        });
    }

    static validateJobConfig(jobConfig) {
        if(typeof jobConfig.maxConcurrents === "number" && jobConfig.maxConcurrents < 1)
            throw new Error("Invalid maxConcurrents option");

        if(typeof jobConfig.maxAttempts === "number" && jobConfig.maxAttempts < 1)
            throw new Error("Invalid maxAttempts option");
    }
}

export default HttpFetchQueue;
