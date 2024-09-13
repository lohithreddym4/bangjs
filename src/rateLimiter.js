function rateLimiter(limit = 100, windowMs = 60000) {
    let requests = {};

    return (req, res, next) => {
        const now = Date.now();
        const ip = req.connection.remoteAddress;
        requests[ip] = requests[ip] || [];
        requests[ip] = requests[ip].filter(ts => now - ts < windowMs);
        if (requests[ip].length >= limit) {
            return handleResponse(res, 429, { error: 'Too many requests' });
        }

        requests[ip].push(now);
        next();
    };
}

module.exports = { rateLimiter };
