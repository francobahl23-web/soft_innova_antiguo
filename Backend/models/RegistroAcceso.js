'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class RegistroAcceso extends Model {
        static associate({ Usuario }) {
            this.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
        }
    }

    RegistroAcceso.init({
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
        fecha_hora: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        timestamps: false,
        tableName: 'registro_acceso',
        modelName: 'RegistroAcceso'
    });

    return RegistroAcceso;
};
