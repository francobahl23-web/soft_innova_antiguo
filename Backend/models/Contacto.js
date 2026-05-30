'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Contacto extends Model {
        static associate({ Profesional,Paciente, ProfesionalContacto, PacienteContacto }) {
            this.belongsToMany(Profesional, {through:ProfesionalContacto, foreignKey: 'contacto_id', as: 'profesional_contactos' });
            this.belongsToMany(Paciente, {through:PacienteContacto, foreignKey: 'contacto_id', as: 'paciente_contactos' });
        }
    }

    Contacto.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        tipo: {
            type: DataTypes.ENUM('email', 'telefono', 'url'),
            allowNull: false
        },
        valor: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'contacto',
        modelName: 'Contacto',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    return Contacto;
};
