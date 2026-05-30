'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env =  process.env.NODE_ENV?  process.env.NODE_ENV: 'development';
const config = require(__basedir + '/config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}
fs
    .readdirSync(__dirname)
    .filter(file => { //Leemos los archivos del directorio (modelos de nuestra bd)
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => { // inicializamos cada modelo 
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });
//Inicializamos las relaciones entre los modelos
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});


db.sequelize = sequelize;
//Exportamos un objeto con le que podemos acceder a cualquier modelo definido en esta carpeta.
module.exports = db;
/*
Ejemplo en archivos de repositories.
 */
