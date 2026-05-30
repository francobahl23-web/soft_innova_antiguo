'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Horario extends Model {
        static associate({ Profesional }) {
            this.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' });
        }
    }

    Horario.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        profesional_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Profesional',
                key: 'id'
            }
        },
        dia: {
            type: DataTypes.ENUM('lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'),
            allowNull: false
        },
        hora_inicio: {
            type: DataTypes.TIME,
            allowNull: false
        },
        hora_fin: {
            type: DataTypes.TIME,
            allowNull: false
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'horario',
        modelName: 'Horario',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    return Horario;
};
