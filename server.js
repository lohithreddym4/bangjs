const Bang = require("./src/framework");

const app = new Bang();

app.get("/health", (req,res)=>{
    res.end("ok");
});

app.get("/user/:id", (req,res)=>{
    res.end("user");
});

app.listen(3000, ()=>{
    console.log("server running");
});
