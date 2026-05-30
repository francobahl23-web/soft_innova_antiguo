'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class PacienteCobertura extends Model {
        static associate({ Paciente, Cobertura }) {
            this.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
            this.belongsTo(Cobertura, { foreignKey: 'cobertura_id', as: 'cobertura' });
        }
    }

    PacienteCobertura.init({
        paciente_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Paciente',
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
        nro_cobertura: {
            type: DataTypes.STRING(255)
        },
        detalle: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'paciente_cobertura',
        modelName: 'PacienteCobertura'
    });

    return PacienteCobertura;
};
