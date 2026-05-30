'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Actividad extends Model {
        static associate({ Usuario }) {
            this.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
        }
    }

    Actividad.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        usuario_id: DataTypes.INTEGER,
        descripcion: DataTypes.TEXT,
        fecha: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Actividad',
        timestamps: false,
        tableName: 'actividad'
    });

    return Actividad;
};
