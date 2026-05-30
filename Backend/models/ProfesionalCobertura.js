'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProfesionalCobertura extends Model {
        static associate({ Profesional, Cobertura }) {
            this.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' });
            this.belongsTo(Cobertura, { foreignKey: 'cobertura_id', as: 'cobertura' });
        }
    }

    ProfesionalCobertura.init({
        profesional_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Profesional',
                key: 'id'
            }
        },
        cobertura_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Cobertura',
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
        tableName: 'profesional_cobertura',
        modelName: 'ProfesionalCobertura'
    });

    return ProfesionalCobertura;
};
