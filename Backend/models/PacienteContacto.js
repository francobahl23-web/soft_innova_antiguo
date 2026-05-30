'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class PacienteContacto extends Model {
        static associate({ Paciente, Contacto }) {
            this.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
            this.belongsTo(Contacto, { foreignKey: 'contacto_id', as: 'contacto' });
        }
    }

    PacienteContacto.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        paciente_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Paciente',
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
        tableName: 'paciente_contacto',
        modelName: 'PacienteContacto'
    });

    return PacienteContacto;
};
