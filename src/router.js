class Router {
    constructor() {
        this.routes = {};
        this.middlewares = [];
    }

    // Add a middleware to the router
    use(middleware) {
        this.middlewares.push(middleware);
    }
    // Register routes for various HTTP methods
    get(path, handler, schema = null, middlewares = []) {
        this.register('GET', path, handler, schema, middlewares);
    }

    post(path, handler, schema = null, middlewares = []) {
        this.register('POST', path, handler, schema, middlewares);
    }

    put(path, handler, schema = null, middlewares = []) {
        this.register('PUT', path, handler, schema, middlewares);
    }

    delete(path, handler, schema = null, middlewares = []) {
        this.register('DELETE', path, handler, schema, middlewares);
    }

    patch(path, handler, schema = null, middlewares = []) {
        this.register('PATCH', path, handler, schema, middlewares);
    }

    options(path, handler, schema = null, middlewares = []) {
        this.register('OPTIONS', path, handler, schema, middlewares);
    }

    // Internal method to register routes
    register(method, path, handler, schema = null, middlewares = []) {
        path = this.normalizePath(path);

        if (!this.routes[method]) {
            this.routes[method] = [];
        }

        // Save handler, schema, and middlewares for the route
        this.routes[method].push({ path, handler, schema, middlewares });
    }

    // Match the route based on the method and URL
    async match(method, url) {
        if (!this.routes[method]) return null;
        url = this.normalizePath(url);
        for (const route of this.routes[method]) {
            const { path, handler, schema, middlewares } = route;
            const pathRegex = this.pathToRegex(path);
            const match = url.match(pathRegex);

            if (match) {
                const params = this.extractParams(path, url);
                return { handler, schema, params, middlewares };
            }
        }

        return null; // Return null if no route is matched (404)
    }

    // Convert path with parameters to a regex pattern
    pathToRegex(path) {
        const regexPath = path.replace(/:\w+/g, '([^/]+)');
        return new RegExp(`^${regexPath}$`);
    }

    // Extract route parameters from URL
    extractParams(path, url) {
        const paramNames = (path.match(/:\w+/g) || []).map(param => param.slice(1));
        const paramValues = url.match(this.pathToRegex(path)).slice(1);

        return paramNames.reduce((params, name, index) => {
            params[name] = paramValues[index];
            return params;
        }, {});
    }

    // Normalize path by removing trailing slash
    normalizePath(path) {
        return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
    }
}

module.exports = { Router };
