'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class AuditoriaCambios extends Model {}

    AuditoriaCambios.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Usuario',
                key: 'id'
            }
        },
        tabla_afectada: DataTypes.STRING(255),
        campo_afectado: DataTypes.STRING(255),
        valor_anterior: DataTypes.TEXT,
        nuevo_valor: DataTypes.TEXT,
        fecha: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'AuditoriaCambios',
        timestamps: false,
        tableName: 'auditoria_cambios'
    });

    return AuditoriaCambios;
};
