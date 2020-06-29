function validarRegistro(user,pass){
    if(user.length<6||pass.length<6){
       return false;
    }
    return true;
}

function validarLogin(user,pass){
    if(user.length<6||pass.length<6){
        return false;
    }
    return true;
}

//Exportar el archivo
module.exports={
    validarRegistro,
    validarLogin
};