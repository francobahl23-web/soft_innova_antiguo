'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Clinica extends Model {
        static associate({Profesional, ProfesionalClinica, SecretariaClinica, Turno }) {
            this.belongsToMany(Profesional, {through:ProfesionalClinica, foreignKey: 'clinica_id', as: 'profesional_clinicas' });
            this.hasMany(SecretariaClinica, { foreignKey: 'clinica_id', as: 'secretaria_clinicas' });
            this.hasMany(Turno, { foreignKey: 'clinica_id', as: 'turnos' });
        }
    }

    Clinica.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nombre: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        domicilio: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'clinica',
        modelName: 'Clinica'
    });

    return Clinica;
};
