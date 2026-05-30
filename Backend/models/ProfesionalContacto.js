'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProfesionalContacto extends Model {
        static associate({ Profesional, Contacto }) {
            this.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' });
            this.belongsTo(Contacto, { foreignKey: 'contacto_id', as: 'contacto' });
        }
    }

    ProfesionalContacto.init({
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
        contacto_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Contacto',
                key: 'id'
            }
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'profesional_contacto',
        modelName: 'ProfesionalContacto'
    });

    return ProfesionalContacto;
};
