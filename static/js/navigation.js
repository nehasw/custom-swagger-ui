export function showApis(spec, onApiClick) {
	
    const nav = document.getElementById("nav");
    nav.innerHTML = "";

    const groups = {};
    const paths = spec.paths || {};

    for (const path in paths) {
        const methods = paths[path];

        for (const method in methods) {
			
            const operation = methods[method];

            if (!operation) {
                continue;
            }

            let groupName = "OTHER";

            if (
                operation.tags &&
                operation.tags.length > 0
            ) {
                groupName = operation.tags[0];
            } else {
                const parts = path.split("/");

                if (parts.length > 1) {
                    groupName = parts[1];
                }
            }

            groupName = groupName.toUpperCase();

            if (!groups[groupName]) {
                groups[groupName] = [];
            }

            groups[groupName].push({
                path: path,
                method: method,
                operation: operation
            });
        }
    }

    for (const groupName in groups) {
        createGroup(
            nav,
            groupName,
            groups[groupName],
            onApiClick
        );
    }
}

function createGroup(
    nav,
    groupName,
    apis,
    onApiClick
) 

	{
	
    const group = document.createElement("div");
    group.className = "nav-group";

    const title = document.createElement("div");
    title.className = "nav-group-title";
    title.textContent = groupName;

    group.appendChild(title);

    for (const api of apis) {
        const button = document.createElement("button");
        button.className = "nav-item";

        const method = document.createElement("span");
        method.className = "method";
        method.dataset.method = api.method;
        method.textContent = api.method.toUpperCase();

        const path = document.createElement("span");
        path.className = "nav-item-label";
        path.textContent = api.path;

        button.appendChild(method);
        button.appendChild(path);

        button.addEventListener("click", function () {
            onApiClick(api);
        });

        group.appendChild(button);
    }

    nav.appendChild(group);
}