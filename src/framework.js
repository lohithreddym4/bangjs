"use strict";

const http = require("http");
const BangRouter = require("./router");

class BangFramework {

    constructor() {

        this.router = new BangRouter();

        // fixed array → stable shape
        this.middlewares = [];

        // bind once → no closure per request
        this._handle = this._handle.bind(this);
    }




    get(path, handler){
        this.router.register("GET", path, handler);
    }

    post(path, handler){
        this.router.register("POST", path, handler);
    }

    put(path, handler){
        this.router.register("PUT", path, handler);
    }

    delete(path, handler){
        this.router.register("DELETE", path, handler);
    }

    patch(path, handler){
        this.router.register("PATCH", path, handler);
    }



    use(fn){
        this.middlewares.push(fn);
    }



    listen(port, cb){

        const server = http.createServer(this._handle);

        // disable Nagle → lower latency
        server.on("connection", socket=>{
            socket.setNoDelay(true);
        });

        server.listen(port, cb);
    }



    _handle(req, res){

        const params = Object.create(null);

        // FAST pathname extraction
        const url = req.url;
        let pathEnd = url.indexOf("?");

        const path =
            pathEnd === -1
                ? url
                : url.slice(0, pathEnd);


        // ---- middleware runner (sync-first) ----

        const mws = this.middlewares;

        let idx = 0;

        const next = (err)=>{

            if(err) return this._fail(res,500);

            if(idx === mws.length){
                return dispatch();
            }

            const mw = mws[idx++];

            try{

                // middleware decides sync vs async
                if(mw.length === 3){
                    mw(req,res,next);
                }
                else{
                    mw(req,res);
                    next();
                }

            }catch{
                this._fail(res,500);
            }
        };



        const dispatch = ()=>{

            let handler;

            try{
                handler = this.router.match(
                    req.method,
                    path,
                    params
                );
            }
            catch{
                return this._fail(res,500);
            }

            if(!handler){
                return this._fail(res,404);
            }

            req.params = params;

            try{

                const result = handler(req,res);

                // promise-aware without forcing async
                if(result && result.then){
                    result.catch(()=>this._fail(res,500));
                }

            }catch{
                this._fail(res,500);
            }
        };


        next();
    }



    _fail(res,code){

        if(res.headersSent) return;

        res.statusCode = code;
        res.end();
    }
}

module.exports = BangFramework;
