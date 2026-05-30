const express = require('express');
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
/* 

Con el mismo mecanismo usado en el index de models.
Obtenemos los archivos declarados en routes para enlazar los endpoints en app.js.
Mantener formatos de ejemplo en routes->Usuario.js

*/

function eRoutes() {
    const router = express.Router();
    fs
        .readdirSync(__dirname)
        .filter(file => {
            return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
        })
        .forEach(file => {
            require(path.join(__dirname, file))(router);
        });

    return router;
}


module.exports = eRoutes;
