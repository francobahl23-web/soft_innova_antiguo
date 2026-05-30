'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class SecretariaClinica extends Model {
        static associate({ Usuario, Clinica }) {
            this.belongsTo(Usuario, { foreignKey: 'secretaria_id', as: 'secretaria' });
            this.belongsTo(Clinica, { foreignKey: 'clinica_id', as: 'clinica' });
        }
    }

    SecretariaClinica.init({
        secretaria_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Usuario',
                key: 'id'
            }
        },
        clinica_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Clinica',
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
        tableName: 'secretaria_clinica',
        modelName: 'SecretariaClinica'
    });

    return SecretariaClinica;
};
