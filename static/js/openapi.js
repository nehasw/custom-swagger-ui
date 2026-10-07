import { CONFIG } from "./config.js";

export async function loadOpenApi() {

    const url =
        CONFIG.baseUrl +
        CONFIG.specPath;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Failed to load OpenAPI: " +
            response.status
        );
    }

    const data = await response.json();

    return data;
	
}