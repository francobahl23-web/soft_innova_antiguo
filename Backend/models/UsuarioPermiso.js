'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class UsuarioPermiso extends Model {}

    UsuarioPermiso.init({
        usuario_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Usuario',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        permiso_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Permiso',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'usuario_permiso',
        modelName: 'UsuarioPermiso'
    });

    return UsuarioPermiso;
};
