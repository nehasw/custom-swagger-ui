import { getToken, setToken } from "./auth.js";
import { CONFIG } from "./config.js";

export async function executeApi(api, requestBody) {
    const contextPath = location.pathname.replace(/\/[^/]*$/, "");

    // const url =
    //     location.origin +
    //     contextPath +
    //     api.path;

    const url =
        CONFIG.baseUrl +
        api.path;   

    const options = {
        method: api.method.toUpperCase(),
        headers: {
            "Content-Type": "application/json"
        }
    };

    const token = getToken();

    if (token) {
        options.headers.Authorization = "Bearer " + token;
    }

    if (
        requestBody && api.method.toLowerCase() !== "get"
    ) {
        options.body =
            JSON.stringify(requestBody);
    }

    const startTime = performance.now();

    const response = await fetch(
        url,
        options
    );

    const endTime = performance.now();

    const responseText =
        await response.text();

    let responseBody;

    try {
        responseBody =
            JSON.parse(responseText);
    } catch {
        responseBody =
            responseText;
    }

    if (
        api.path === "/users/auth/login" &&
        responseBody &&
        responseBody.token
    ) {
        setToken(responseBody.token);
    }

    return {
        status: response.status,
        statusText: response.statusText,
        time: Math.round(endTime - startTime),
        body: responseBody
    };
}