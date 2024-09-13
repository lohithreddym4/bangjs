class Router {
    constructor() {
        this.routes = {};
    }

    // Method for registering GET routes
    get(path, handler, schema = null) {
        this.register('GET', path, handler, schema);
    }

    post(path, handler, schema = null) {
        this.register('POST', path, handler, schema);
    }

    put(path, handler, schema = null) {
        this.register('PUT', path, handler, schema);
    }

    delete(path, handler, schema = null) {
        this.register('DELETE', path, handler, schema);
    }

    patch(path, handler, schema = null) {
        this.register('PATCH', path, handler, schema);
    }

    options(path, handler, schema = null) {
        this.register('OPTIONS', path, handler, schema);
    }

    // Internal method to register routes
    register(method, path, handler, schema = null) {
        // Normalize path
        path = this.normalizePath(path);

        if (!this.routes[method]) {
            this.routes[method] = [];
        }
        this.routes[method].push({ path, handler, schema });
    }

    match(method, url) {

        if (!this.routes[method]) return null;

        // Normalize URL
        url = this.normalizePath(url);

        for (const route of this.routes[method]) {
            const { path, handler, schema } = route;

            // Convert path to regex
            const pathRegex = this.pathToRegex(path);
            const match = url.match(pathRegex);

            if (match) {
                const params = this.extractParams(path, url);
                return { handler, schema, params };
            }
        }

        return null;
    }

    pathToRegex(path) {
        // Convert path like '/data/:id' to regex
        const regexPath = path.replace(/:\w+/g, '([^/]+)');
        return new RegExp(`^${regexPath}$`);
    }

    extractParams(path, url) {
        const paramNames = (path.match(/:\w+/g) || []).map(param => param.slice(1));
        const paramValues = url.match(this.pathToRegex(path)).slice(1);

        return paramNames.reduce((params, name, index) => {
            params[name] = paramValues[index];
            return params;
        }, {});
    }

    normalizePath(path) {
        // Remove trailing slash
        return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
    }
}

module.exports = { Router };
