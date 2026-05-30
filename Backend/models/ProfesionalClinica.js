'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProfesionalClinica extends Model {
        static associate({ Profesional, Clinica }) {
            this.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' });
            this.belongsTo(Clinica, { foreignKey: 'clinica_id', as: 'clinica' });
        }
    }

    ProfesionalClinica.init({
        profesional_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Profesional',
                key: 'id'
            }
        },
        clinica_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Clinica',
                key: 'id'
            }
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'profesional_clinica',
        modelName: 'ProfesionalClinica'
    });

    return ProfesionalClinica;
};
