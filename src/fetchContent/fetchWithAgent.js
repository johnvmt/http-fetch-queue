import https from "https";
import fetch from "node-fetch";

// https agent that accepts self-signed ssl certificates
const httpsFetchAgent = new https.Agent({
    rejectUnauthorized: false
});

// return object with https agent, if url protocol is https
const agentOptionsFromURL = (url) => {
    const parsedURL = new URL(url);

    if(parsedURL.protocol === "https:")
        return {agent: httpsFetchAgent};
    return {};
}

export default (url, options = {}) => {
    const agentOptions = options.agent === undefined
        ? {}
        : agentOptionsFromURL(url);

    return fetch(url, {
        ...options,
        ...agentOptions
    });
}
