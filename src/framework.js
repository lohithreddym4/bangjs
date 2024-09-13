const http = require('http');
const { Router } = require('./router');
const { handleValidation } = require('./validation');
const { handleResponse } = require('./response');
const { bodyParser } = require('./bodyParser');
const { logger } = require('./logger');
const { errorHandler } = require('./errorHandler');


class MyFramework {
    constructor() {
        this.router = new Router();
        this.middlewares = [logger,bodyParser]; // Default middlewares
    }

    use(middleware) {
        this.middlewares.push(middleware);
    }

    useRoute(basePath, router) {
        // Normalize basePath
        basePath = this.normalizePath(basePath);

        // Handle route registration for router
        for (const [method, routes] of Object.entries(router.routes)) {
            for (const route of routes) {
                const { path, handler, schema } = route;

                // Concatenate basePath with route path
                const fullPath = `${basePath}${path}`;
                this.router.register(method, fullPath, handler, schema);
            }
        }
    }

    get(path, handler, schema = null) {
        this.router.register('GET', path, handler, schema);
    }

    post(path, handler, schema = null) {
        this.router.register('POST', path, handler, schema);
    }

    put(path, handler, schema = null) {
        this.router.register('PUT', path, handler, schema);
    }

    patch(path, handler, schema = null) {
        this.router.register('PATCH', path, handler, schema);
    }

    delete(path, handler, schema = null) {
        this.router.register('DELETE', path, handler, schema);
    }

    options(path, handler, schema = null) {
        this.router.register('OPTIONS', path, handler, schema);
    }

    head(path, handler, schema = null) {
        this.router.register('HEAD', path, handler, schema);
    }

    async listen(port, callback) {
        const server = http.createServer(async (req, res) => {
            await this.runMiddlewares(req, res);
            try {
                await this.handleRequest(req, res);
            } catch (err) {
                errorHandler(err, req, res); // Use error handling middleware
            }
        });

        server.listen(port, callback);
    }


    async runMiddlewares(req, res) {
        for (let middleware of this.middlewares) {
            await new Promise(
                (resolve, reject) => {
                middleware(req, res, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        );
        }
    }

    async handleRequest(req, res) {
        const route = this.router.match(req.method, req.url);
        if (route) {
            const { handler, schema, params } = route;
            req.params = params;
            if (schema) {
                const validationErrors = handleValidation(schema, req.body);
                if (validationErrors.length > 0) {
                    return handleResponse(res, 400, { errors: validationErrors });
                }
            }
            await handler(req, res, (statusCode = 200, data = {}, cookies = []) => {
                handleResponse(res, statusCode, data, cookies);
            });
        } else {
            handleResponse(res, 404, { error: 'Route not found' });
        }
    }

    normalizePath(path) {
        // Remove trailing slash
        return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
    }
}

module.exports = MyFramework;
