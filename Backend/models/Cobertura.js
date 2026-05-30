'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Cobertura extends Model {
        static associate({ Profesional, Paciente, PacienteCobertura, ProfesionalCobertura, Turno }) { 
            this.belongsToMany(Profesional, {through:ProfesionalCobertura, foreignKey: 'cobertura_id', as: 'profesional_cobertura' })
            this.belongsToMany(Paciente, {through:PacienteCobertura, foreignKey: 'cobertura_id', as: 'paciente_cobertura' })
            this.hasMany(Turno, { foreignKey: 'cobertura_id', as: 'turnos' })
        }
    }

    Cobertura.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nombre: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        numero: {
            type: DataTypes.STRING(255),
            defaultValue:null
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'cobertura',
        modelName: 'Cobertura',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    return Cobertura;
};
