'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Bloqueo extends Model {
        static associate({ Profesional }) {
            this.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' });
        }
    
    } 
    Bloqueo.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        fecha_hora_desde: {
            type: DataTypes.DATE,
            allowNull: false
        },
        fecha_hora_hasta: {
            type: DataTypes.DATE,
            allowNull: false
        },
        motivo: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        profesional_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Profesional',
                key: 'id'
            }
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'bloqueo',
        modelName: 'Bloqueo', 
    });

    return Bloqueo;
};
