function getSchemaFromReference(reference, schemas) {

    if (!reference || !schemas) {
        return null;
    }

    const schemaName = reference.split("/").pop();

    return schemas[schemaName];
}


function createExampleFromSchema(schema, schemas) {

    if (!schema) {
        return {};
    }

    // If schema refers to another schema
	
    if (schema.$ref) {

        const referencedSchema = getSchemaFromReference(
            schema.$ref,
            schemas
        );

        return createExampleFromSchema(
            referencedSchema,
            schemas
        );
    }

    // Object
    if (schema.type === "object" && schema.properties) {

        const example = {};

        for (const propertyName in schema.properties) {

            const property = schema.properties[propertyName];

            example[propertyName] = createExampleFromSchema(
                property,
                schemas
            );
        }

        return example;
    }

    if (schema.type === "string") {
        return "string";
    }

    if (schema.type === "integer") {
        return 0;
    }

    if (schema.type === "number") {
        return 0;
    }

    if (schema.type === "boolean") {
        return false;
    }

    if (schema.type === "array") {

        if (schema.items) {

            return [
                createExampleFromSchema(
                    schema.items,
                    schemas
                )
            ];
        }

        return [];
    }

    return {};
}


function createResponseHtml(responses, schemas) {

    if (!responses) {
        return "";
    }

    let responseHtml = `
        <div class="response-section">
            <h3>Responses</h3>
    `;

    for (const statusCode in responses) {

        const response = responses[statusCode];

        responseHtml += `
            <div class="response-item">

                <h4>${statusCode}</h4>

                <p>
                    ${response.description ||
                    "No description available"}
                </p>
        `;

        if (response.content) {

            const contentType =
                Object.keys(response.content)[0];

            const responseSchema =
                response.content[contentType].schema;

            const example = createExampleFromSchema(
                responseSchema,
                schemas
            );

            responseHtml += `
                <p>
                    Content-Type: ${contentType}
                </p>

                <pre>
${JSON.stringify(example, null, 4)}
                </pre>
            `;
        }

        responseHtml += `
            </div>
        `;
    }

    responseHtml += `
        </div>
    `;

    return responseHtml;
}


function createParametersHtml(parameters) {

    if (!parameters || parameters.length === 0) {
        return "";
    }

    let html = `
        <div class="request-section">
            <h4>Parameters</h4>
    `;

    parameters.forEach(parameter => {

        const schema = parameter.schema || {};

        let type = schema.type || "text";

        if (schema.$ref) {
            type = schema.$ref.split("/").pop();
        }

        html += `
            <div class="parameter-row">

                <label>
                    ${parameter.name}

                    ${
                        parameter.required
                            ? '<span class="required">*</span>'
                            : ''
                    }
                </label>

                <input
                    type="text"
                    class="parameter-input"
                    data-parameter-name="${parameter.name}"
                    data-parameter-in="${parameter.in}"
                    data-parameter-required="${parameter.required}"
                    placeholder="${type}"
                />

                <small>
                    Type: ${type}
                    | In: ${parameter.in}
                </small>

            </div>
        `;
    });

    html += `
        </div>
    `;

    return html;
}


/*
 * JWT AUTHORIZATION
 */

let jwtToken = "";

const tokenInput =
    document.getElementById("jwt-token");

const authorizeButton =
    document.getElementById("authorize-btn");

const clearButton =
    document.getElementById("clear-token-btn");

const authStatus =
    document.getElementById("auth-status");


authorizeButton.addEventListener(
    "click",
    function () {

        const token = tokenInput.value.trim();

        if (!token) {

            authStatus.textContent =
                "Please enter JWT token.";

            return;
        }

        jwtToken = token;

        authStatus.textContent =
            "JWT token authorized.";
    }
);


clearButton.addEventListener(
    "click",
    function () {

        jwtToken = "";

        tokenInput.value = "";

        authStatus.textContent =
            "JWT token cleared.";
    }
);


/*
 * EXECUTE API
 */

async function executeApi(
    method,
    path,
    contentType,
    requestBody,
    responseContainer,
    parameterInputs
) {

    try {

        let finalPath = path;

        const queryParams = new URLSearchParams();


        /*
         * Process parameters
         */

        parameterInputs.forEach(input => {

            const name =
                input.dataset.parameterName;

            const location =
                input.dataset.parameterIn;

            const value =
                input.value.trim();


            if (!value) {
                return;
            }


            /*
             * Path parameter
             */

            if (location === "path") {

                finalPath = finalPath.replace(
                    `{${name}}`,
                    encodeURIComponent(value)
                );
            }


            /*
             * Query parameter
             */

            if (location === "query") {

                queryParams.append(
                    name,
                    value
                );
            }
        });


        /*
         * Add query parameters
         */

        if (queryParams.toString()) {

            finalPath +=
                "?" + queryParams.toString();
        }


        /*
         * Build URL
         */

        const url =
            finalPath.startsWith("/CISWSWebApp")
                ? finalPath
                : "/CISWSWebApp" + finalPath;


        /*
         * Request options
         */

        const options = {

            method: method.toUpperCase(),

            headers: {}

        };


        /*
         * JWT
         */

        if (jwtToken) {

            options.headers["Authorization"] =
                "Bearer " + jwtToken;
        }


        /*
         * Request body
         */

        if (
            requestBody &&
            method.toUpperCase() !== "GET"
        ) {

            options.headers["Content-Type"] =
                contentType ||
                "application/json";

            options.body = requestBody;
        }


        /*
         * Execute API
         */

        const response =
            await fetch(url, options);


        const responseText =
            await response.text();


        let formattedResponse =
            responseText;


        try {

            const json =
                JSON.parse(responseText);

            formattedResponse =
                JSON.stringify(
                    json,
                    null,
                    4
                );

        }
        catch (e) {

            // Not JSON
        }


        /*
         * Display response
         */

        responseContainer.innerHTML = `

            <div class="execute-response">

                <h4>
                    Response
                </h4>

                <p>

                    <strong>Status:</strong>

                    ${response.status}
                    ${response.statusText}

                </p>

                <h4>
                    Response Body
                </h4>

                <pre>
${formattedResponse}
                </pre>

            </div>

        `;
    }

    catch (error) {

        responseContainer.innerHTML = `

            <div class="execute-response">

                <h4>
                    Error
                </h4>

                <pre>
${error.message}
                </pre>

            </div>

        `;
    }
}

function createSchemaHtml(schema, schemas, name = "object") {

    if (!schema) {
        return "";
    }

    if (schema.$ref) {

        const referencedSchema =
            getSchemaFromReference(
                schema.$ref,
                schemas
            );

        const schemaName =
            schema.$ref.split("/").pop();

        return createSchemaHtml(
            referencedSchema,
            schemas,
            schemaName
        );
    }

    let html = `
        <div class="schema-box">

            <div class="schema-header">

                <span class="schema-name">
                    ${name}
                </span>

                <span class="schema-object-type">
                    ${schema.type || "object"}
                </span>

            </div>
    `;

    if (schema.properties) {

        for (const propertyName in schema.properties) {

            const property =
                schema.properties[propertyName];

            let propertyType =
                property.type || "object";

            let propertyFormat =
                property.format || "";

            if (property.$ref) {

                propertyType =
                    property.$ref
                        .split("/")
                        .pop();
            }

            html += `
                <div class="schema-property">

                    <span class="schema-property-name">
                        ${propertyName}
                    </span>

                    <span class="schema-property-type">
                        ${propertyType}
                    </span>

                    ${
                        propertyFormat
                            ? `
                                <span class="schema-format">
                                    ${propertyFormat}
                                </span>
                            `
                            : ""
                    }

                </div>
            `;
        }
    }

    html += `
        </div>
    `;

    return html;
}

fetch("/CISWSWebApp/v3/api-docs")

    .then(response => response.json())

    .then(data => {

        const apiList =
            document.getElementById("api-list");

        const paths =
            data.paths;

        const schemas =
            data.components &&
            data.components.schemas
                ? data.components.schemas
                : {};


        /*
         * API LOOP
         */

        for (const path in paths) {

            const methods = paths[path];


            for (const method in methods) {

                const api = methods[method];

                const parametersHtml =
                    createParametersHtml(
                        api.parameters
                    );


                const card =
                    document.createElement("div");

                card.className =
                    "api-card";


                const header =
                    document.createElement("div");

                header.className =
                    "api-header";


                header.innerHTML = `

                    <span class="method">
                        ${method.toUpperCase()}
                    </span>

                    <span class="path">
                        ${path}
                    </span>

                    <span class="summary">
                        ${api.summary || ""}
                    </span>

                `;


                const details =
                    document.createElement("div");

                details.className =
                    "api-details";


                /*
                 * REQUEST BODY
                 */

                let requestBodyHtml = "";

                let contentType = "";

                let requestExample = {};


                if (api.requestBody) {

                    const content =
                        api.requestBody.content;


                    if (content) {

                        contentType =
                            Object.keys(content)[0];


                        const requestSchema =
                            content[contentType].schema;


                        requestExample =
                            createExampleFromSchema(
                                requestSchema,
                                schemas
                            );
							
							const schemaName =
							    requestSchema.$ref
							        ? requestSchema.$ref.split("/").pop()
							        : "object";

							const schemaHtml =
							    createSchemaHtml(
							        requestSchema,
							        schemas,
							        schemaName
							    );

								requestBodyHtml = `
								    <div class="request-section">

								        <h3>
								            Request Body
								        </h3>

								        <p>
								            Content-Type:
								            ${contentType}
								        </p>

								        <h4>
								            Example Value
								        </h4>

								        <textarea
								            class="request-editor"
								        >${JSON.stringify(
								            requestExample,
								            null,
								            4
								        )}</textarea>

								        <h4>
								            Schema
								        </h4>

								        ${schemaHtml}

								    </div>
								`;
						
                    }
                }


                /*
                 * RESPONSE DOCUMENTATION
                 */

                const responseHtml =
                    createResponseHtml(
                        api.responses,
                        schemas
                    );


                /*
                 * EXECUTE SECTION
                 */

                const executeHtml = `

                    <div class="execute-section">

                        <button class="try-button">
                            Try It Out
                        </button>

                        <button class="execute-button">
                            Execute
                        </button>

                        <div class="execute-response-container"></div>

                    </div>

                `;


                /*
                 * API DETAILS
                 */

                details.innerHTML = `

                    <h3>
                        ${api.summary || "API Details"}
                    </h3>

                    <p>
                        ${api.description ||
                        "No description available"}
                    </p>

                    ${parametersHtml}

                    ${requestBodyHtml}

                    ${executeHtml}

                    ${responseHtml}

                `;


                /*
                 * TRY IT OUT BUTTON
                 */

                const tryButton = details.querySelector(".try-button");
                const executeButton = details.querySelector(".execute-button");

                const requestEditor = details.querySelector(".request-editor");

                const responseContainer = details.querySelector(".execute-response-container");
				
                tryButton.addEventListener("click",
                    function () {

                        if (requestEditor) {

                            requestEditor.removeAttribute(
                                "readonly"
                            );
                        }

                    }
                );


                /*
                 * EXECUTE BUTTON
                 */

                executeButton.addEventListener(
                    "click",
                    function () {

                        let requestBody = null;


                        if (requestEditor) {

                            requestBody =
                                requestEditor.value;
                        }


                        const parameterInputs =
                            details.querySelectorAll(
                                ".parameter-input"
                            );


                        executeApi(
                            method,
                            path,
                            contentType,
                            requestBody,
                            responseContainer,
                            parameterInputs
                        );

                    }
                );


                /*
                 * OPEN / CLOSE API DETAILS
                 */

                header.addEventListener(
                    "click",
                    function () {

                        if (
                            details.style.display ===
                            "block"
                        ) {

                            details.style.display =
                                "none";

                        }
                        else {

                            details.style.display =
                                "block";
                        }

                    }
                );


                card.appendChild(header);

                card.appendChild(details);

                apiList.appendChild(card);

            }
        }

    })

    .catch(error => {

        console.error(
            "Error loading API documentation:",
            error
        );

    });