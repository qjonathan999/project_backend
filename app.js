const express=require("express");
const app=express();
const mongoose=require("mongoose");
const URI="mongodb+srv://jonamaster:sprog999.@dbsprogra-ns0kt.gcp.mongodb.net/test?retryWrites=true&w=majority";
const hs=require("express-handlebars");
const session=require("express-session");
const bcrypt=require("bcrypt");
//Importar validaciones.js
const validaciones=require("./validaciones");
//Importar
const rutasHola=require("./ruta_hola");

app.engine("handlebars",hs());
app.set("view engine","handlebars");
//Para recibir la informacion del formulario(Importante)
app.use(express.urlencoded());
//Para 
app.use(express.json());
//Inicializar la sesion
app.use(session({secret:"lorempipsum999"}));

//Funcion asincronica para Conectar a la Base de Datos
async function Conectar(){
    try{
        await mongoose.connect(URI,{
            useNewUrlParser:true,
            useUnifiedTopology:true
            });
            console.log("Conectado a MongoDB");
    }catch(e){
        console.log("No se pudo conectar a MongoDB");
    }
}

app.get("/",function(req,res){
    res.redirect("/recetas");
});

Conectar();

//Estructura del esquema en la BD de las recetas
const recetaEsquema= new mongoose.Schema({
    nombre:String,
    ingredientes:String,
    instrucciones:String,
    creador:{
        type: mongoose.Schema.Types.ObjectId, //Asociacion con el objectID de la coleccion usuarios
        ref: "usuarios"
    }

});
//Definicion del Model de recetas para interactuar con la BD: Model-->Schema-->BD Mongo
const receta=mongoose.model("recetas",recetaEsquema);

//Estructura del esquema en la BD de usuarios
const usuarioEsquema=new mongoose.Schema({
    email:String,
    password:String
});

//Definicion del Model de usuarios para interactuar con la BD
const usuario=mongoose.model("usuarios",usuarioEsquema);

async function inicializarUsuarios(){
    let usuarios=await usuario.find();
    if (usuarios.length==0){
        await usuario.create({
            email:"host@gmail.com",
            password:"host12345"
        });
    }
};

inicializarUsuarios();

//Muestra el formulario para agregar nueva receta
app.get("/agregar", function(req,res){
    res.render("formulario");
});

//Recibe el formulario con la nueva recta
app.post("/agregar", async function(req,res){
    await receta.create({
        nombre:req.body.nombre,
        ingredientes:req.body.ingredientes,
        instrucciones:req.body.instrucciones
    });
    res.redirect("/recetas");
});

//Borrar receta
app.get("/borrar/:id", async function(req,res){
    await receta.findByIdAndRemove(req.params.id);
    res.redirect("/recetas");
});

//Editar receta => Mostrar formulario
app.get("/editar/:id", async function(req,res) {
    let rece= await receta.findById(req.params.id).lean(); //lean() para mostrar informacion en el handlebars
    res.render("formulario",{datos:rece}); //datos es lo que se muestra en el form de handlebars
});

//Guardar la edición de datos
app.post("/editar/:id",async function (req,res){
    await receta.findByIdAndUpdate(req.params.id,{
        nombre:req.body.nombre,
        ingredientes:req.body.ingredientes,
        instrucciones:req.body.instrucciones
    });
    res.redirect("/recetas");
});

//Obtener Recetas por API con una funcion asincronica o promise
app.get("/api/recetas",async function(req,res){
    const listado_recetas=await receta.find();
    res.send(listado_recetas);

})

//Obtener Recetascon una funcion asincronica o promise
app.get("/recetas",async function(req,res){
    const listado_recetas=await receta.find().lean();
    res.render("listado",{listado:listado_recetas});
});


app.listen(8888,function(){
    console.log("Servidor arriba!");
});


//API
app.get("/api/recetas", async function(req,res){
    const recetas= await receta.findById(req.params.id).populate("creador");
    res.send(recetas);
});

app.get("/api/recetas/:id", async function(req,res){
    //Busqueda por id de receta y los datos de su creador
    const una_receta= await receta.findById(req.params.id).populate("creador");
    //una_receta.creador= await usuario.findById(una_receta.creador);
    res.send(una_receta);
});

app.post("/api/recetas", async function(req,res){
    let nueva_receta= await receta.create({
        nombre:req.body.nombre,
        ingredientes:req.body.ingredientes,
        instrucciones:req.body.instrucciones,
        creador:req.body.usuario_id
    });
    res.status(201).send(nueva_receta);
});

app.delete("/api/recetas/:id", async function(req,res){
    await receta.findByIdAndRemove(req.params.id);
    res.status(204).send();
});

app.put("/api/recetas/:id", async function(req,res){
    let receta_actualizada= await receta.findByIdAndUpdate(req.params.id,{
        nombre:req.body.nombre,
        ingredientes:req.body.ingredientes,
        instrucciones:req.body.instrucciones
    });
    res.send(receta_actualizada);
});


//SESIONES
app.get("/contar",function(req,res){
    
    if(!req.session.contador){
        req.session.contador=0;
    }
    req.session.contador+=1;
    res.send("El contador tiene: "+req.session.contador);
});

//LOGIN
app.get("/signin",function(req,res){
    res.render("login");
});

app.post("/signin",async function(req,res){
    //Validaciones
    if(req.body.email.length<4||req.body.pass<4){
        res.render("signup");
        return;
    }

    //Busco si el usuario existe en la BD
    const user= await usuario.findOne({email:req.body.email});
    if(!user){
        res.send("Usuario/password invalido");
        return;
    }
    const pass_form=req.body.pass;
    const pass_bd=user.password;
    
    //Verifico las pass
    if(bcrypt.compareSync(pass_form,pass_bd)){
        //Usuario y pass correcto
        console.log("logeado");
        req.session.usuario_ok=true;
        req.session.email=req.body.email;
        req.session.user_id=user._id;
        res.redirect("/segura");
    }
    else{
        res.send("Usuario/Password incorrecto");
    }
});

app.get("/segura",function(req,res){
    //Verificamos si está logeado
    if(! req.session.usuario_ok){
        res.redirect("/signin");
        return;
    }
    res.send("Ingresaste a la seccion de admin");
});

//Cerrar sesion
app.get("/logout",function(req,res){
    req.session.destroy();
    res.redirect("/signin");

});

//Registrar usuario
app.get("/signup",function(req,res){
    res.render("signup");
});

app.post("/signup",async function(req,res){
    //Validaciones.js
    const valido=validaciones.validarRegistro(req.body.email,req.body.pass);
    if(!valido){
        res.render("signup");
        return;
    }

    const existe= await usuario.findOne({email:req.body.email});
    if(existe){
        res.send("Usuario ya existe");    
    }
    else{
        //Encriptar pass
        const password_encriptado=await bcrypt.hash(req.body.pass,10);
        const nuevo_usuario=await usuario.create({
            email:req.body.email,
            password:password_encriptado
        });
        console.log("Usuario creado OK");
        res.redirect("/signin");
        /*
        req.session.usuario_ok=true;
        req.session.email=req.body.email;
        req.session.user_id=nuevo_usuario._id;
        res.redirect("/segura");
         */
    }   
});

app.use("/hola",rutasHola);