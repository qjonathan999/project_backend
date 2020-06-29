const express=require("express");
const app=express.Router();

//http://localhost:8888/hola
app.get("/",function(req,res){
    res.send("HOLA");
});

//http://localhost:8888/hola/dos
app.get("/dos",function(req,res){
    res.send("DOS");
});

module.exports=app;
