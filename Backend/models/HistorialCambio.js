'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class HistorialCambio extends Model {
        static associate({ Turno, Usuario }) {
            this.belongsTo(Turno, { foreignKey: 'turno_id', as: 'turno' });
            this.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
        }
    }

    HistorialCambio.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        turno_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Turno',
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
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        campo_modificado: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nuevo_valor: {
            type: DataTypes.STRING,
            allowNull: false
        },
        valor_anterior: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'historial_cambio',
        modelName: 'HistorialCambio'
    });

    return HistorialCambio;
};
