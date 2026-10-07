import { loadOpenApi } from "./openapi.js";
import { showApis } from "./navigation.js";
import { showApiDetails } from "./api-details.js";

async function init() {
    try {
        const apiData = await loadOpenApi();

        console.log("OpenAPI loaded:", apiData);

        showApis(apiData, function (api) {
            console.log("Selected API:", api);
            showApiDetails(api, apiData);
        });

        const themeToggle = document.getElementById("theme-toggle");

        document.documentElement.dataset.theme = "light";

        themeToggle.addEventListener("click", function () {
            const currentTheme =
                document.documentElement.dataset.theme;

            document.documentElement.dataset.theme =
                currentTheme === "dark" ? "light" : "dark";
        });
    } catch (error) {
        console.error(
            "Failed to initialize API Portal:",
            error
        );
    }
}

init();