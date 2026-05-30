const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
class Paciente extends Model {
    static associate({ Contacto,PacienteContacto,Cobertura, PacienteCobertura, Turno, Historial }) {
        this.belongsToMany(Contacto, {through:PacienteContacto, foreignKey: 'paciente_id', as: 'contactos' });
        this.belongsToMany(Cobertura, {through:PacienteCobertura, foreignKey: 'paciente_id', as: 'coberturas' });
        this.hasMany(Turno, { foreignKey: 'paciente_id', as: 'turnos' });
        this.hasMany(Historial, { foreignKey: 'paciente_id', as: 'historial' });
    }
}

Paciente.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    dni: {
        type: DataTypes.STRING(20),
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
    },
    fecha_nacimiento: {
        type: DataTypes.DATE,
    },
    pais: {
        type: DataTypes.STRING(255)
    },
    ocupacion: {
        type: DataTypes.STRING(255)
    },
    direccion: {
        type: DataTypes.TEXT
    },
    notas: {
        type: DataTypes.TEXT
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    sequelize,
    timestamps: false,
    tableName: 'paciente',
    modelName: 'Paciente',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
});
return Paciente;
}
