import { executeApi } from "./api-client.js";

export function showApiDetails(api, spec) {
    const view = document.getElementById("view");
    view.innerHTML = "";

    const container = document.createElement("div");
    container.className = "api-detail";

    const header = document.createElement("div");
    header.className = "api-header";

    const method = document.createElement("span");
    method.className = "method";
    method.dataset.method = api.method;
    method.textContent = api.method.toUpperCase();

    const path = document.createElement("span");
    path.className = "api-path";
    path.textContent = api.path;

    header.appendChild(method);
    header.appendChild(path);
    container.appendChild(header);

    const title = document.createElement("h1");
    title.textContent = api.operation.summary || "API Details";
    container.appendChild(title);

    if (api.operation.description) {
        const description = document.createElement("p");
        description.className = "api-description";
        description.textContent = api.operation.description;
        container.appendChild(description);
    }

    const contentLayout = document.createElement("div");
    contentLayout.className = "api-content-layout";

    const mainContent = document.createElement("div");
    mainContent.className = "api-main-content";

    const sideContent = document.createElement("div");
    sideContent.className = "api-side-content";

    createActionButtons(
        mainContent,
        api,
        spec
    );

    createParameters(
        mainContent,
        api.operation.parameters
    );

    createRequestBody(
        mainContent,
        api.operation.requestBody,
        spec
    );

    createResponseBody(
        mainContent,
        api,
        spec
    );

    createExampleValue(
        sideContent,
        api.operation.requestBody,
        spec
    );

    createResponses(
        sideContent,
        api.operation.responses
    );

    contentLayout.appendChild(mainContent);
    contentLayout.appendChild(sideContent);

    container.appendChild(contentLayout);
    view.appendChild(container);
}

function createActionButtons(container, api, spec) {
    const section = document.createElement("div");
    section.className = "api-actions";

    const executeButton = document.createElement("button");
    executeButton.className = "btn";
    executeButton.textContent = "Execute";
    executeButton.disabled = false;

    section.appendChild(executeButton);
    container.appendChild(section);

    executeButton.addEventListener("click", async function () {
        await executeRequest(
            api,
            spec
        );
    });
}

function createRequestEditor(api, spec) {
    const requestBody = api.operation.requestBody;

    if (!requestBody) {
        return;
    }

    const section = document.querySelector(
        ".api-section.request-body"
    );

    if (!section) {
        return;
    }

    if (section.querySelector(".request-editor")) {
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.className = "request-editor";
    textarea.rows = 5;

    const content = requestBody.content || {};
    const contentType = Object.keys(content)[0];

    if (!contentType) {
        return;
    }

    const schema = content[contentType].schema;

    if (!schema) {
        return;
    }

    const actualSchema = resolveSchema(
        schema,
        spec
    );

    textarea.value = JSON.stringify(
        createExampleFromSchema(actualSchema),
        null,
        2
    );

    section.appendChild(textarea);
}

function createParameters(container, parameters) {
    if (!parameters || parameters.length === 0) {
        return;
    }

    const section = document.createElement("div");
    section.className = "api-section";

    const title = document.createElement("h2");
    title.textContent = "Parameters";
    section.appendChild(title);

    for (const parameter of parameters) {
        const row = document.createElement("div");
        row.className = "parameter-row";

        const name = document.createElement("strong");
        name.textContent = parameter.name;

        const location = document.createElement("span");
        location.textContent = parameter.in;

        row.appendChild(name);
        row.appendChild(location);
        section.appendChild(row);
    }

    container.appendChild(section);
}

function createRequestBody(container, requestBody, spec) {
    if (!requestBody) {
        return;
    }

    const section = document.createElement("div");
    section.className = "api-section request-body";

    const title = document.createElement("h2");
    title.textContent = "Request Body";
    section.appendChild(title);

    if (requestBody.required) {
        const required = document.createElement("span");
        required.className = "required";
        required.textContent = "Required";
        section.appendChild(required);
    }

    const content = requestBody.content || {};
    const contentType = Object.keys(content)[0];

    if (!contentType) {
        container.appendChild(section);
        return;
    }

    const type = document.createElement("p");
    type.textContent = "Content-Type: " + contentType;
    section.appendChild(type);

    const schema = content[contentType].schema;

    if (schema) {
        const actualSchema = resolveSchema(
            schema,
            spec
        );

        createSchemaView(
            section,
            actualSchema
        );

        const textarea = document.createElement("textarea");
        textarea.className = "request-editor";
        textarea.rows = 10;

        textarea.value = JSON.stringify(
            createExampleFromSchema(actualSchema),
            null,
            2
        );

        section.appendChild(textarea);
    }

    container.appendChild(section);
}

function createResponseBody(container, api, spec) {
    const section = document.createElement("div");
    section.className = "api-section response-section";

    const title = document.createElement("h2");
    title.textContent = "Response Body";
    section.appendChild(title);

    const textarea = document.createElement("textarea");
    textarea.className = "response-editor";
    textarea.rows = 5;

    const responses = api.operation.responses || {};

    const successStatus =
        Object.keys(responses).find(status =>
            status.startsWith("2")
        );

    const response =
        responses[successStatus] ||
        responses[Object.keys(responses)[0]];

    let responseExample = {};

    if (response && response.content) {
        const contentType =
            Object.keys(response.content)[0];

        const content =
            response.content[contentType];

        if (content && content.schema) {
            const schema = resolveSchema(
                content.schema,
                spec
            );

            responseExample =
                createResponseExample(
                    schema,
                    spec
                );
        }
    }

    textarea.value = JSON.stringify(
        responseExample,
        null,
        2
    );

    section.appendChild(textarea);
    container.appendChild(section);
}

function createResponseExample(schema, spec) {
    if (!schema) {
        return {};
    }

    if (schema.$ref) {
        schema = resolveSchema(
            schema,
            spec
        );
    }

    if (schema.example !== undefined) {
        return schema.example;
    }

    if (schema.type === "object") {
        const example = {};

        for (const propertyName in schema.properties || {}) {
            const property =
                schema.properties[propertyName];

            example[propertyName] =
                createResponseExample(
                    property,
                    spec
                );
        }

        return example;
    }

    if (schema.type === "array") {
        return [];
    }

    if (
        schema.type === "integer"||
        schema.type === "number" ||
        schema.type === "string" ||
        schema.type === "boolean"
    ) 
    {
        return null;
    }

    return {};
}

function createExampleValue(container, requestBody, spec) {
    if (!requestBody) {
        return;
    }

    const content = requestBody.content || {};
    const contentType = Object.keys(content)[0];

    if (!contentType) {
        return;
    }

    const schema = content[contentType].schema;

    if (!schema) {
        return;
    }

    const actualSchema = resolveSchema(
        schema,
        spec
    );

    const example = createExampleFromSchema(
        actualSchema
    );

    const section = document.createElement("div");
    section.className = "api-section example-section";

    const title = document.createElement("h2");
    title.textContent = "Example Value";
    section.appendChild(title);

    const body = document.createElement("pre");
    body.textContent = JSON.stringify(
        example,
        null,
        2
    );

    section.appendChild(body);
    container.appendChild(section);
}

function createResponses(container, responses) {
    if (!responses) {
        return;
    }

    const section = document.createElement("div");
    section.className = "api-section";

    const title = document.createElement("h2");
    title.textContent = "Responses";
    section.appendChild(title);

    for (const status in responses) {
        const response = responses[status];

        const row = document.createElement("div");
        row.className = "response-row";

        const code = document.createElement("strong");
        code.textContent = status;

        const description = document.createElement("span");
        description.textContent =
            response.description || "";

        row.appendChild(code);
        row.appendChild(description);

        section.appendChild(row);
    }

    container.appendChild(section);
}

function createExampleFromSchema(schema) {
    const example = {};

    if (!schema || !schema.properties) {
        return example;
    }

    for (const propertyName in schema.properties) {
        const property =
            schema.properties[propertyName];

        if (property.example !== undefined) {
            example[propertyName] =
                property.example;
        } else if (
            property.type === "integer" ||
            property.type === "number"
        ) {
            example[propertyName] = 1;
        } else if (property.type === "boolean") {
            example[propertyName] = true;
        } else {
            example[propertyName] = "string";
        }
    }

    return example;
}

async function executeRequest(api, spec) {
    const requestEditor =
        document.querySelector(".request-editor");

    let requestBody = null;

    if (requestEditor) {
        try {
            requestBody = JSON.parse(requestEditor.value);
        } catch (error) {
            showResponse({
                status: 400,
                body: {
                    error: "Invalid JSON request body"
                }
            });
            return;
        }
    }

    try {
        const result = await executeApi(
            api,
            requestBody
        );

        if (
            api.path === "/users/auth/login" &&
            result.body?.token
        ) {
            localStorage.setItem(
                "apiPortal.jwt",
                result.body.token
            );

            updateAuthButton(
                result.body.token
            );
        }

        showResponse(result);

    } catch (error) {
        showResponse({
            status: error.status || 500,
            body: error.body || {
                error: error.message || "Request failed"
            }
        });
    }
}


function updateAuthButton(token) {
    const authButton =
        document.getElementById("auth-btn");

    const authLabel =
        document.getElementById("auth-label");

    if (!authButton || !authLabel) {
        return;
    }

    authButton.dataset.state = "authorized";

    const shortToken =
        token.length > 24
            ? token.substring(0, 24) + "..."
            : token;

    authLabel.textContent =
        " " + shortToken;

    authButton.title = token;
}

function createErrorResponse(error) {
    const mainContent =
        document.querySelector(
            ".api-main-content"
        );

    let section =
        document.querySelector(
            ".response-section"
        );

    if (!section) {
        section = document.createElement("div");
        section.className =
            "api-section response-section";

        const title =
            document.createElement("h2");

        title.textContent = "Response Body";

        section.appendChild(title);

        const textarea =
            document.createElement("textarea");

        textarea.className =
            "response-editor";

        textarea.rows = 15;

        section.appendChild(textarea);

        mainContent.appendChild(section);
    }

    const textarea =
        section.querySelector(
            ".response-editor"
        );

    textarea.value = JSON.stringify(
        error,
        null,
        2
    );
}

function showResponse(result) {
    const textarea =
        document.querySelector(".response-editor");

    if (!textarea) {
        return;
    }

    textarea.value =
        typeof result.body === "string"
            ? result.body
            : JSON.stringify(
                result.body,
                null,
                2
            );
}

function resolveSchema(schema, spec) {
    if (!schema || !schema.$ref) {
        return schema;
    }

    if (!spec || !spec.components || !spec.components.schemas) {
        return schema;
    }

    const parts = schema.$ref.split("/");
    const schemaName = parts[parts.length - 1];

    return (
        spec.components.schemas[schemaName] ||
        schema
    );
}

function createSchemaView(section, schema) {
    const schemaTitle =
        document.createElement("h3");

    schemaTitle.textContent = "Schema";
    section.appendChild(schemaTitle);

    if (!schema || !schema.properties) {
        return;
    }

    const schemaBox =
        document.createElement("div");

    schemaBox.className = "schema-box";

    for (
        const propertyName in schema.properties
    ) {
        const property =
            schema.properties[propertyName];

        const row =
            document.createElement("div");

        row.className = "schema-row";

        const name =
            document.createElement("strong");

        name.textContent = propertyName;

        const type =
            document.createElement("span");

        type.textContent =
            property.type || "object";

        row.appendChild(name);
        row.appendChild(type);

        schemaBox.appendChild(row);
    }

    section.appendChild(schemaBox);
}