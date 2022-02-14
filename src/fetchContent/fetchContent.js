import fetch from "./fetchWithAgent.js";
import AbortController from "abort-controller";

/**
 * Content from response to save in cache
 * @param response
 * @param format
 * @returns {Promise<string|*>}
 */
const getContentFromResponse = async (response, format) => {
    if(format === "base64") {
        const responseArrayBuffer = await response.arrayBuffer();
        return Buffer.from(responseArrayBuffer).toString('base64');
    }
    else
        return await response.text();
}

/**
 * Useful metadata from fetch response to save in cache
 * @param response
 * @returns {{etag: *}}
 */
const infoFromResponse = (response) => {
    return {
        etag: response.headers.get('etag')
    }
}

/**
 * @param url
 * @param fetchOptions
 * @param contentOptions
 * @returns {Promise<{etag: *, content: (string|*)}|{etag: *}>}
 */
const fetchContent = async (url, fetchOptions, contentOptions = {}) => {
    const {etag, timeout, format, contentFromResponse = getContentFromResponse} = contentOptions;
    const controller = new AbortController();
    const { signal } = controller;

    // abort on timeout
    let requestTimeout;
    if(typeof timeout === "number") {
        requestTimeout = setTimeout(() => {
            controller.abort();
        }, timeout);
    }

    try {
        const response = await fetch(url, {
            signal,
            cache: "no-store",
            ...fetchOptions
        });

        const responseInfo = infoFromResponse(response);

        if(etag !== undefined && responseInfo.etag === etag) { // etags match, abort
            controller.abort();
            return responseInfo;
        }
        else { // new content
            const responseContent = await contentFromResponse(response, format);
            return {
                ...responseInfo,
                content: responseContent
            };
        }
    }
    catch(error) {
        throw error;
    }
    finally {
        clearTimeout(requestTimeout);
    }
}

export {
  fetchContent as default,
  fetchContent
}
