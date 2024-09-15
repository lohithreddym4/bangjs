function createSendRes(res) {
    let responseSent = false;

    return function sendRes(statusCodeOrData, dataOrCookies, cookies) {
        if (responseSent) {
            throw new Error("Response has already been sent for this request.");
        }

        if (typeof statusCodeOrData === 'number') {
            // statusCodeOrData is status code
            const statusCode = statusCodeOrData;
            const responseData = typeof dataOrCookies === 'object' ? dataOrCookies : {};
            const responseCookies = typeof dataOrCookies === 'object' ? cookies : dataOrCookies;

            res.statusCode = statusCode;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseData));
            responseSent = true;
        } else {
            // statusCodeOrData is data
            const responseData = statusCodeOrData;
            const statusCode = typeof dataOrCookies === 'number' ? dataOrCookies : 200;
            const responseCookies = typeof dataOrCookies === 'object' ? cookies : dataOrCookies;

            res.statusCode = statusCode;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseData));
            responseSent = true;
        }
    };
}

module.exports = { createSendRes };