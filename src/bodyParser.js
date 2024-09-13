const formidable = require('formidable');
const { handleResponse } = require('./response');


function bodyParser(req, res, next) {
    if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) {
                return handleResponse(res, 400, { error: 'Form parsing error' });
            }
            req.fields = fields;
            req.files = files;
            next(); 
        });
    } 
    else {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                req.body = body ? JSON.parse(body) : {};
            } catch (error) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
            next()
        });
    }
}


module.exports = { bodyParser };

