'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Usuario extends Model {
        static associate({ Profesional, Permiso, UsuarioPermiso }) {
            this.hasOne(Profesional, { foreignKey: 'usuario_id', as: 'profesional' });
            this.belongsToMany(Permiso, {
                through: UsuarioPermiso,
                foreignKey: 'usuario_id',
                as: 'permisos'
            });
        }
    }

    Usuario.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING(50)
        },
        password: {
            type: DataTypes.STRING(200)
        },
        sucursal: {
            type: DataTypes.STRING(20)
        },
        nombre: {
            type: DataTypes.STRING(50)
        },
        telefono: {
            type: DataTypes.STRING(20)
        },
        mail: {
            type: DataTypes.STRING(100)
        },
        rol: {
            type: DataTypes.STRING(50)
        },
        creado: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'usuario',
        modelName: 'Usuario'
    });

    return Usuario;
};
