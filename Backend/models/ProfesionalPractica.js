'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProfesionalPractica extends Model {
        static associate({ Profesional, Practicas }) {
            this.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' });
            this.belongsTo(Practicas, { foreignKey: 'practica_id', as: 'practica' });
        }
    }

    ProfesionalPractica.init({
        profesional_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Profesional',
                key: 'id'
            }
        },
        practica_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Practicas',
                key: 'id'
            }
        },
        duracion: {
            type: DataTypes.INTEGER, 
            defaultValue:60
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'profesional_practica',
        modelName: 'ProfesionalPractica'
    });

    return ProfesionalPractica;
};
