'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Profesional extends Model {
        static associate({ Usuario,Contacto, Cobertura, Clinica, ProfesionalContacto, ProfesionalCobertura, ProfesionalClinica, ProfesionalPractica, Turno, Bloqueo, Horario }) {
            this.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
            this.belongsToMany(Contacto, {through:ProfesionalContacto, foreignKey: 'profesional_id', as: 'contactos' });
            this.belongsToMany(Cobertura, {through:ProfesionalCobertura, foreignKey: 'profesional_id', as: 'coberturas' });
            this.hasMany(ProfesionalPractica, {foreignKey: 'profesional_id',as:'practicas' });
            this.belongsToMany(Clinica, {through:ProfesionalClinica, foreignKey: 'profesional_id', as: 'clinicas' });
            this.hasMany(Turno, { foreignKey: 'profesional_id', as: 'turnos' });
            this.hasMany(Bloqueo, { foreignKey: 'profesional_id', as: 'bloqueos' });
            this.hasMany(Horario, { foreignKey: 'profesional_id', as: 'horarios' });
        }
    }

    Profesional.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        dni: {
            type: DataTypes.STRING(20),
            unique: true
        },
        nombre: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        apellido: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        genero: {
            type: DataTypes.ENUM('M', 'F', 'O'),
            allowNull: false
        },
        fecha_nacimiento: {
            type: DataTypes.DATE,
            allowNull: false
        },
        prefijo: {
            type: DataTypes.STRING(10)
        },
        descripcion: {
            type: DataTypes.TEXT
        },
        imagen: {
            type: DataTypes.STRING(255)
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Usuario',
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
        tableName: 'profesional',
        modelName: 'Profesional',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    return Profesional;
};
