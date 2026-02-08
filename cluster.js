"use strict";

const cluster = require("cluster");
const os = require("os");

const WORKERS = 10;


if(cluster.isPrimary){

    console.log(`Primary ${process.pid} running`);
    console.log(`Starting ${WORKERS} workers...\n`);

    for(let i=0;i<WORKERS;i++){
        cluster.fork();
    }


    // 🔥 Auto-respawn dead workers
    cluster.on("exit",(worker)=>{

        console.log(`Worker ${worker.process.pid} died. Respawning...`);

        cluster.fork();
    });

}
else{

    // Worker runs your server
    require("./server");

    console.log(`Worker ${process.pid} started`);
}
