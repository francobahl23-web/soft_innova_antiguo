'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Permiso extends Model {
        static associate({ Usuario, UsuarioPermiso }) {
            this.belongsToMany(Usuario, {
                through: UsuarioPermiso,
                foreignKey: 'permiso_id',
                as: 'usuarios'
            });
        }
    }

    Permiso.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        permiso: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'permiso',
        modelName: 'Permiso'
    });

    return Permiso;
};
