const http = require('http');
const { Router } = require('./router');
const { handleValidation } = require('./validation');
const { handleResponse } = require('./response');
const { bodyParser } = require('./bodyParser');
const { logger } = require('./logger');
const { errorHandler } = require('./errorHandler');
const { createSendRes } = require('./sendResponse');

class MyFramework {
    constructor() {
        this.router = new Router();
        this.middlewares = [bodyParser]; // Default global middlewares
        this.routeDictionary = {}; // Dictionary to hold routers and their routes
    }

    // For adding global middlewares
    use(middleware) {
        this.middlewares.push(middleware);
    }

    // For adding route-specific middlewares
    useRoute(basePath, router) {
        basePath = this.normalizePath(basePath);
        this.routeDictionary[basePath] = router;

        // No need to add routes to the main router here; routes are managed separately.
    }

    get(path, handler, schema = null, middlewares = []) {
        this.router.register('GET', path, handler, schema, middlewares);
    }

    post(path, handler, schema = null, middlewares = []) {
        this.router.register('POST', path, handler, schema, middlewares);
    }

    put(path, handler, schema = null, middlewares = []) {
        this.router.register('PUT', path, handler, schema, middlewares);
    }

    patch(path, handler, schema = null, middlewares = []) {
        this.router.register('PATCH', path, handler, schema, middlewares);
    }

    delete(path, handler, schema = null, middlewares = []) {
        this.router.register('DELETE', path, handler, schema, middlewares);
    }

    options(path, handler, schema = null, middlewares = []) {
        this.router.register('OPTIONS', path, handler, schema, middlewares);
    }

    head(path, handler, schema = null, middlewares = []) {
        this.router.register('HEAD', path, handler, schema, middlewares);
    }

    async listen(port, callback) {
        const server = http.createServer(async (req, res) => {
            try {
                if (!res.writableEnded) {
                    await this.handleRequest(req, res); // Handle request if no middleware sent the response
                }
            } catch (err) {
                errorHandler(err, req, res); // Handle errors
            }
        });

        server.listen(port, callback);
    }

    // Runs both global and route-specific middlewares
    async runMiddlewares(req, res, middlewares = []) {
        for (const middleware of middlewares) {
            await new Promise((resolve, reject) => {
                middleware(req, res, (err) => {
                    if (err) {
                        reject(err);
                    } else if (res.writableEnded) {
                        // Stop running middlewares if response is finished
                        resolve();
                    } else {
                        resolve();
                    }
                });
            });
        }
    }

    async handleRequest(req, res) {
        try {
            // Run global middlewares
            await this.runMiddlewares(req, res, this.middlewares);
            if (res.writableEnded) return; // Stop if response is already sent

            // Extract the full path from the URL
            let basePath = this.normalizePath(new URL(req.url, `http://${req.headers.host}`).pathname);

            let route = null;
            let router = null;


            // Iteratively check paths by removing segments until a route is found
            while (basePath && !router) {
                router = this.routeDictionary[basePath]; // Check if a router exists for the current basePath

                // Try to match a route within the current router or the default router
                if (router) {
                    route = await router.match(req.method, req.url.slice(basePath.length));
                    if (route) break; // If a matching route is found, break the loop
                }

                // Remove the last path segment and continue checking
                const lastSlashIndex = basePath.lastIndexOf('/');
                basePath = lastSlashIndex !== -1 ? basePath.slice(0, lastSlashIndex) : '';
            }

            // If no matching router was found, use the default global router
            if (!route) {
                route = await this.router.match(req.method, req.url);
            }

            // If router-specific middlewares are found, run them
            if (router) {
                await this.runMiddlewares(req, res, router.middlewares);
                if (res.writableEnded) return; // Stop if the response is already sent
            }

            if (route) {
                const { handler, schema, params, middlewares } = route;
                req.params = params;

                // Run route-specific middlewares
                await this.runMiddlewares(req, res, middlewares);

                if (!res.headersSent) {
                    // Validate schema if provided
                    if (schema) {
                        const validationErrors = handleValidation(schema, req.body);
                        if (validationErrors.length > 0) {
                            return handleResponse(res, 400, { errors: validationErrors });
                        }
                    }

                    // Create sendRes function for the request
                    const sendRes = createSendRes(res);

                    // Execute the route handler
                    await handler(req, res, sendRes);
                }
            } else {
                // Handle 404 - Route not found
                handleResponse(res, 404, { error: 'Route not found' });
            }
        } catch (err) {
            // Handle any errors
            errorHandler(err, req, res);
        }
    }


    normalizePath(path) {
        // Remove trailing slash
        return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
    }
}

module.exports = MyFramework;
