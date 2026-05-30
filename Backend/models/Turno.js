'use strict';
const { Model, DataTypes } = require('sequelize');
const { publishEvent } = require('../2-services/Event');

module.exports = (sequelize) => {
    class Turno extends Model {
        static associate({ Profesional, Paciente, Cobertura, Practicas, Clinica, Historial, Usuario, HistorialCambio }) {
            this.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' });
            this.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
            this.belongsTo(Cobertura, { foreignKey: 'cobertura_id', as: 'cobertura' });
            this.belongsTo(Practicas, { foreignKey: 'practica_id', as: 'practica' });
            this.belongsTo(Clinica, { foreignKey: 'clinica_id', as: 'clinica' });
            this.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
            this.hasMany(Historial, { foreignKey: 'turno_id', as: 'historial' });
            this.hasMany(HistorialCambio, { foreignKey: 'turno_id', as: 'historial_cambios' });
        }

    } 

    Turno.init({
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
        paciente_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Paciente',
                key: 'id'
            }
        },
        cobertura_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Cobertura',
                key: 'id'
            }
        },
        practica_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Practicas',
                key: 'id'
            }
        },
        clinica_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Clinica',
                key: 'id'
            }
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Usuario',
                key: 'id'
            }
        },
        fecha_hora: {
            type: DataTypes.DATE,
            allowNull: false
        },
        duracion: {
            type: DataTypes.INTEGER,
            defaultValue: 30
        },
        nota: {
            type: DataTypes.TEXT
        },
        estado: {
            type: DataTypes.ENUM('Reservado', 'Esperando', 'En consulta', 'Atendido', 'Ausente', 'Cancelado'),
            allowNull: false,
            defaultValue: 'Reservado'
        },
        tipo: {
            type: DataTypes.ENUM('turno', 'sobreturno'),
            allowNull: false,
            defaultValue: 'turno'
        }
    }, {
        sequelize, 
        tableName: 'turno',
        modelName: 'Turno',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    return Turno;
};
