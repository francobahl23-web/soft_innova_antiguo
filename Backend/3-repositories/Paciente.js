// repositories/repository-pacientes.js

const { Paciente, PacienteContacto, PacienteCobertura,Contacto, Cobertura, Turno, Historial } = require('../models');
const sequelize = require('../models').sequelize;
const { Op, where, fn, col } = require('sequelize');

const create = async (pacienteData) => {
    try {
        // Extrayendo contactos y coberturas del payload, si existen
        const { contactos, coberturas, ...datosPaciente } = pacienteData;

        // Crear el paciente
        const paciente = await Paciente.create(datosPaciente, );

        // Procesar contactos si existen en el payload
        if (contactos && contactos.length) {
            for (let contacto of contactos) {
                const [contactoCreado, created] = await Contacto.findOrCreate({
                    where: { tipo: contacto.tipo, valor: contacto.valor },
                    defaults: contacto
                });
                await PacienteContacto.create({
                    paciente_id: paciente.id,
                    contacto_id: contactoCreado.id
                });
            }
        }

        // Procesar coberturas si existen en el payload
        if (coberturas && coberturas.length) {
            for (let cobertura of coberturas) {
                const [coberturaCreada, created] = await Cobertura.findOrCreate({
                    where: { nombre: cobertura.nombre },
                    defaults: cobertura
                });
                await PacienteCobertura.create({
                    paciente_id: paciente.id,
                    cobertura_id: coberturaCreada.id,
                    nro_cobertura: cobertura.numero
                });
            }
        }

        // Confirmar transacción
        return await getById(paciente.id);
    } catch (error) {
        // Revertir transacción en caso de error
        console.error('Error al crear paciente con detalles:', error);
        throw new Error('Error al crear paciente en la base de datos');
    }
};

const update = async (pacienteId, pacienteData) => {
    try {
        const { contactos, coberturas, turnos, historial, ...paciente } = pacienteData;
        
        // Obtener el estado actual del paciente antes de la actualización
        const pacienteAnterior = await Paciente.findByPk(pacienteId, {
            include: ['contactos', 'coberturas']
        });

        // Actualizar datos básicos del paciente
        await Paciente.update(paciente, { where: { id: pacienteId }});

        // Procesar contactos si existen en el payload
        if (contactos && contactos.length) {
            await PacienteContacto.destroy({ where: { paciente_id: pacienteId } });
            for (let contacto of contactos) {
                const [contactoCreado, created] = await Contacto.findOrCreate({
                    where: { tipo: contacto.tipo, valor: contacto.valor },
                    defaults: contacto
                });
                await PacienteContacto.create({
                    paciente_id: pacienteId,
                    contacto_id: contactoCreado.id
                });
            }
        }
 
        // Buscar o crear nuevas coberturas y actualizar relaciones
        await PacienteCobertura.destroy({ where: { paciente_id: pacienteId } });
        for (let cobertura of coberturas) {
            let [coberturaRecord, created] = await Cobertura.findOrCreate({
                where: { nombre: cobertura.nombre },
                defaults: { nombre: cobertura.nombre, numero: cobertura.numero }
            });

            let coberturaId = coberturaRecord.id;

            await PacienteCobertura.create({
                paciente_id: pacienteId,
                cobertura_id: coberturaId,
                nro_cobertura: cobertura.nro_cobertura,
                detalle: cobertura.detalle
            });
        }



        // Obtener el nuevo estado del paciente después de la actualización
        const pacienteActualizado = await Paciente.findByPk(pacienteId, {
            include: ['contactos', 'coberturas', 'turnos', 'historial']
        });
        // Comprobar cambios en cobertura, nombre, apellido y teléfono
        let cambios = {};
        if (pacienteAnterior.coberturas[0]?.nombre !== pacienteActualizado.coberturas[0]?.nombre ||
            pacienteAnterior.coberturas[0]?.numero !== pacienteActualizado.coberturas[0]?.numero ||
            pacienteAnterior.nombre !== pacienteActualizado.nombre ||
            pacienteAnterior.apellido !== pacienteActualizado.apellido ||
            pacienteAnterior.contactos[0]?.valor !== pacienteActualizado.contactos[0]?.valor) {
            
            const telefono = contactos?.find(contacto => contacto.tipo === 'telefono');
            cambios = {
                cobertura: `${pacienteActualizado.coberturas[0]?.nombre} ${pacienteActualizado.coberturas[0]?.numero ? '- ' + pacienteActualizado.coberturas[0]?.numero : ''}`,
                telefono:  telefono ? telefono.valor : '',
                nombre: `${pacienteActualizado.apellido}, ${pacienteActualizado.nombre}`,
                idPaciente: pacienteActualizado.id
            };
        } 

        return { pacienteActualizado, cambios };
    } catch (error) {
        console.error(error);
        throw new Error('Error al actualizar paciente en la base de datos');
    }
};


const reactivate = async (pacienteId) => {
    try {
        await PacienteContacto.update({active:true},{ where: { paciente_id: pacienteId } });
        await Turno.update({active:true},{ where: { paciente_id: pacienteId } });
        await Historial.update({active:true},{ where: { paciente_id: pacienteId } });
        await Paciente.update({active:true},{ where: { id: pacienteId } });
    } catch (error) {
        throw new Error('Error al eliminar paciente de la base de datos');
    }
};
 
const remove = async (pacienteId) => {
    try {
        await PacienteContacto.update({active:false},{ where: { paciente_id: pacienteId } });
        await PacienteCobertura.update({active:false},{ where: { paciente_id: pacienteId } });
        await Turno.update({active:false},{ where: { paciente_id: pacienteId } });
        await Historial.update({active:false},{ where: { paciente_id: pacienteId } });
        await Paciente.update({active:false},{ where: { id: pacienteId } });
    } catch (error) {
        throw new Error('Error al eliminar paciente de la base de datos');
    }
};
 

const getAll = async (page, pageSize) => {
    try {
        const pacientes = await Paciente.findAll({
            where:{ active: true },
            include: [
                { model: Contacto,required:false, as: 'contactos' },
                { model: Cobertura,required:false, as: 'coberturas' },
                { model: Historial,required:false, as: 'historial' }
            ]
        });

        return pacientes
    } catch (error) {
        throw error;
    }
};

const getById = async (id) => {
    try {
        const paciente = await Paciente.findByPk(id, {
            include: [
                { model: Contacto, as: 'contactos' },
                { model: Cobertura, as: 'coberturas' },
                { 
                    model: Turno, as: 'turnos',
                    include: ['profesional', 'paciente', 'cobertura', 'practica', 'clinica', 'usuario', 'historial']
                },
                { model: Historial, as: 'historial' }
            ]
        });
        return paciente;
    } catch (error) {
        throw error;
    }
};

const getByDNI = async (dni) => {
    try {
        const paciente = await Paciente.findOne({
            where:{ 
                dni: dni,
                active: true
            },
            include: [
                { model: Contacto, as: 'contactos' },
                { model: Cobertura, as: 'coberturas' },
                { model: Turno, as: 'turnos' },
                { model: Historial, as: 'historial' }
            ]
        });
        return paciente;
    } catch (error) {
        throw error;
    }
};

const search = async ( filtros ) => {
    try {
        const whereClause = {
            active: true
        };

        let { searchValue, page, pageSize  } = filtros
        if (searchValue) {
            const lowerSearchValues = searchValue.toLowerCase().split(' ');

            const searchConditions = lowerSearchValues.map(value => ({
                [Op.or]: [
                    where(fn('LOWER', col('Paciente.dni')), { [Op.like]: `%${value}%` }),
                    where(fn('LOWER', col('Paciente.nombre')), { [Op.like]: `%${value}%` }),
                    where(fn('LOWER', col('Paciente.apellido')), { [Op.like]: `%${value}%` }),
                ],
            }));

            const searchCondition = {
                [Op.and]: searchConditions
            };

            Object.assign(whereClause, searchCondition);
        }

        let queryOptions = {
            where: whereClause
        }

        let totalPacientes = await Paciente.count(queryOptions)

        queryOptions.include = [
            { model: Contacto,required:false, as: 'contactos' },
            { model: Cobertura,required:false, as: 'coberturas' },
            { model: Turno,required:false, as: 'turnos' },
            { model: Historial,required:false, as: 'historial' }
        ]
        queryOptions.limit = pageSize
        queryOptions.offset = page * pageSize

        let pacientes = await Paciente.findAll(queryOptions);

        return {
            totalPages: pageSize ? Math.ceil(totalPacientes / pageSize) : totalPacientes,
            pacientes: pacientes
        }
    } catch (error) {
        throw error;
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    getByDNI,
    reactivate,
    search
};
