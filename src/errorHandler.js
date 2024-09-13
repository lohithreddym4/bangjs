const { handleResponse } = require('./response');

function errorHandler(err, req, res) {
    console.error(err.stack);
    handleResponse(res, 500, { error: 'Internal Server Error', message: err.message });
}

module.exports = { errorHandler };
