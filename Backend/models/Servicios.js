'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Servicios extends Model {
        static associate({ Practicas }) {
            this.hasMany(Practicas, { foreignKey: 'servicio_id', as: 'practicas' });
        }
    }

    Servicios.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nombre: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        codigo: {
            type: DataTypes.STRING(50),
            allowNull: false
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'servicios',
        modelName: 'Servicios'
    });

    return Servicios;
};
