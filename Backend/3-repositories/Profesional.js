const { sequelize, Profesional,Permiso, Usuario,UsuarioPermiso, Contacto, Cobertura, Clinica, Practicas, ProfesionalContacto, ProfesionalCobertura, ProfesionalClinica, ProfesionalPractica, Turno, Bloqueo, Horario } = require('../models');
const { Op } = require('sequelize');
const {permisosProfesional}= require('../constants/authConstant');
const bcrypt = require('bcryptjs');
const { publishEvent } = require('../2-services/Event');

const holidays = [
    {
        mes: 0,
        anio: 2026,
        1: "año-nuevo",
    },
    {
        mes: 1,
        anio: 2026,
        "16,17": "carnaval",
    },
    {
        mes: 2,
        anio: 2026,
        23: "Puente turístico no laborable",
        24: "memoria-verdad-justicia",
    },
    {
        mes: 3,
        anio: 2026,
        2: "Día del Veterano y de los Caídos en la Guerra de Malvinas",
        3: "Viernes Santo",
    },
    {
        mes: 4,
        anio: 2026,
        1: "trabajador",
        25: "revolucion-mayo",
    },
    {
        mes: 5,
        anio: 2026,
        15: "martin-guemes",
        20: "Paso a la Inmortalidad del General Manuel Belgrano",
    },
    {
        mes: 6,
        anio: 2026,
        9: "independencia",
        10: "Puente turístico no laborable",
    },
    {
        mes: 7,
        anio: 2026,
        17: "Paso a la Inmortalidad del Gral. José de San Martín",
    },
    {
        mes: 9,
        anio: 2026,
        12: "Día del Respeto a la Diversidad Cultural",
    },
    {
        mes: 10,
        anio: 2026,
        23: "soberania-nacional",
    },
    {
        mes: 11,
        anio: 2026,
        7: "Puente turístico no laborable",
        8: "inmaculada-maria",
        25: "navidad",
    },
]

const timeToMinutes = (time) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

async function createUserPermissions(userId, permissions) {
    console.log(permissions);
    
    for (const permiso of permissions) {
        const perm = await Permiso.findOne({ where: { permiso } });
        if (perm) {
            await UsuarioPermiso.create({ usuario_id: userId, permiso_id: perm.id });
        }
    }
};

const createProfesional = async (profesionalData) => {
    try {
        const profesional = await Profesional.create(profesionalData);

        if (profesionalData.usuario) {
            console.log('entro 1');
            
            const usuario = await Usuario.create(profesionalData.usuario);
            await createUserPermissions(usuario.id,permisosProfesional);
            await profesional.setUsuario(usuario);
        }else{
            console.log('entro 2');
            const defaultUser = await Usuario.findOrCreate({
                where: { username: profesionalData.dni },
                defaults: {
                    username: profesionalData.dni,
                    password: await bcrypt.hash(profesionalData.dni, 10),
                    nombre: profesionalData.nombre,
                    rol: 'profesional'
                }
            });
            await createUserPermissions(defaultUser[0].id,permisosProfesional);
            await profesional.setUsuario(defaultUser[0]);
        }
        if (profesionalData.horarios) {
            console.log('entro 3');
            await Horario.destroy({
                where: { profesional_id :profesional.id}
            });
            for (const horario of profesionalData.horarios) {
                horario.profesional_id = profesional.id;
                await Horario.create(horario);
            }
        }
        if (profesionalData.contactos) {
            console.log('entro 4');
            for (const contacto of profesionalData.contactos) {
                const [existingContacto] = await Contacto.findOrCreate({
                    where: { tipo: contacto.tipo, valor: contacto.valor },
                    defaults: contacto
                });
                await ProfesionalContacto.findOrCreate({
                    where: { profesional_id: profesional.id, contacto_id: existingContacto.id },
                    defaults: { profesional_id: profesional.id, contacto_id: existingContacto.id }
                });
            }
        }

        if (profesionalData.practicas) {
            console.log('entro 5');
            for (const practica of profesionalData.practicas) {
                const [existingPractica] = await Practicas.findOrCreate({
                    where: { nombre: practica.nombre },
                    defaults: practica
                });
                await ProfesionalPractica.findOrCreate({
                    where: { profesional_id: profesional.id, practica_id: existingPractica.id },
                    defaults: { profesional_id: profesional.id, practica_id: existingPractica.id, duracion: timeToMinutes(practica.duracion_moda) }
                });
            }
        }
        if (profesionalData.coberturas) {
            console.log('entro 6');
            for (const cobertura of profesionalData.coberturas) {
                const [existingCobertura] = await Cobertura.findOrCreate({
                    where: { nombre: cobertura.nombre },
                    defaults: cobertura
                });
                await ProfesionalCobertura.findOrCreate({
                    where: { profesional_id: profesional.id, cobertura_id: existingCobertura.id },
                    defaults: { profesional_id: profesional.id, cobertura_id: existingCobertura.id }
                });
            }
        }

        if (profesionalData.clinicas) {
            console.log('entro 7');
            for (const clinica of profesionalData.clinicas) {
                const [existingClinica] = await Clinica.findOrCreate({
                    where: { nombre: clinica.nombre },
                    defaults: clinica
                });
                await ProfesionalClinica.findOrCreate({
                    where: { profesional_id: profesional.id, clinica_id: existingClinica.id },
                    defaults: { profesional_id: profesional.id, clinica_id: existingClinica.id }
                });
            }
        }

        
        return profesional;
    } catch (error) {
        console.log(error);
        throw new Error('Error al crear profesional en la base de datos');
    }
};

const updateProfesional = async (profesionalId, profesionalData) => {
    
    try {
        const profesional = await Profesional.findByPk(profesionalId);

        if (!profesional) {
            throw new Error('Profesional no encontrado');
        }

        // Actualizar los datos del profesional
        await profesional.update(profesionalData);
        // Actualizar contactos
        await ProfesionalContacto.destroy({
            where: { profesional_id: profesional.id }
        });
        if (profesionalData.contactos) {
            for (const contacto of profesionalData.contactos) {
                const [existingContacto] = await Contacto.findOrCreate({
                    where: { tipo: contacto.tipo, valor: contacto.valor },
                    defaults: contacto
                });
                await ProfesionalContacto.create({
                    profesional_id: profesional.id,
                    contacto_id: existingContacto.id
                });
            }
        }

        // Actualizar coberturas
        await ProfesionalCobertura.destroy({
            where: { profesional_id: profesional.id }
        });
        if (profesionalData.coberturas) {
            for (const cobertura of profesionalData.coberturas) {
                const [existingCobertura] = await Cobertura.findOrCreate({
                    where: { nombre: cobertura.nombre },
                    defaults: cobertura
                });
                await ProfesionalCobertura.create({
                    profesional_id: profesional.id,
                    cobertura_id: existingCobertura.id
                });
            }
        }

        // Actualizar clínicas
        await ProfesionalClinica.destroy({
            where: { profesional_id: profesional.id }
        });
        if (profesionalData.clinicas) {
            for (const clinica of profesionalData.clinicas) {
                const [existingClinica] = await Clinica.findOrCreate({
                    where: { nombre: clinica.nombre },
                    defaults: clinica
                });
                await ProfesionalClinica.create({
                    profesional_id: profesional.id,
                    clinica_id: existingClinica.id
                });
            }
        }

        // Actualizar prácticas
        await ProfesionalPractica.destroy({
            where: { profesional_id: profesional.id }
        });
        if (profesionalData.practicas) {
            for (const practica of profesionalData.practicas) {
                const [existingPractica] = await Practicas.findOrCreate({
                    where: { nombre: practica.nombre },
                    defaults: practica
                });
                await ProfesionalPractica.create({
                    profesional_id: profesional.id,
                    practica_id: existingPractica.id,
                    duracion: timeToMinutes(practica.duracion_moda)
                });
            }
        }

        // Actualizar los horarios del profesional
        await Horario.destroy({
            where: { profesional_id: profesional.id }
        });

        if (profesionalData.horarios) {
            for (const horario of profesionalData.horarios) {
                horario.profesional_id = profesional.id;
                await Horario.create(horario);
            }
        }

        
        return await Profesional.findByPk(profesionalId, {
            include: ['usuario', 'contactos', 'coberturas', 'clinicas', 'practicas', 'turnos', 'bloqueos', 'horarios']
        });
    } catch (error) {
        
        console.error(error);
        throw new Error('Error al actualizar profesional en la base de datos');
    }
}

const getAllProfesionales = async () => {
    try {
        const result = await Profesional.findAll({
            include: [
                { model: Usuario, as: 'usuario', required: false },
                { model: Contacto, as: 'contactos', required: false },
                { model: Cobertura, as: 'coberturas', required: false },
                { model: Horario, as: 'horarios', required: false },
                { model: Clinica, as: 'clinicas', required: false },
                { model: ProfesionalPractica, as: 'practicas', include:{ model: Practicas, as: 'practica' }, required: false},
            ]
        });
        return result;
    } catch (error) {
        console.log(error);
        throw new Error('Error al obtener profesionales de la base de datos');
    }
};

const getProfesionalById = async (profesionalId) => {
    try {
        const result = await Profesional.findByPk(profesionalId, {
            include: [
                { model: Usuario, as: 'usuario' },
                { model: Bloqueo, as: 'bloqueos' },
                { model: Horario, as: 'horarios' },
                { model: Contacto, as: 'contactos' },
                { model: Cobertura, as: 'coberturas' },
                { model: Clinica, as: 'clinicas' },
                { model: ProfesionalPractica, as: 'practicas', include:{ model: Practicas, as: 'practica' }},
            ]
        });
        return result;
    } catch (error) {
        console.log(error)
        throw new Error('Error al obtener profesional por ID de la base de datos');
    }
};

const deleteProfesional = async (profesionalId) => {
    
    try {
        const result = await Profesional.destroy({
            where: { id: profesionalId }
        });
        
        return result;
    } catch (error) {
        
        throw new Error('Error al eliminar profesional de la base de datos');
    }
};

const search = async ( filtros ) => {
    try {
        const whereClause = {};

        let { searchValue, ...actualFiltros  } = filtros
        if (searchValue) {
            const searchCondition = {
                [Op.or]: [
                    { dni: { [Op.like]: `%${searchValue}%` } },
                    { nombre: { [Op.like]: `%${searchValue}%` } },
                    { apellido: { [Op.like]: `%${searchValue}%` } },
                ],
            };

            Object.assign(whereClause, searchCondition);
        }

        for(let key of Object.keys(actualFiltros))
        {
            if(filtros[key] !== null)   
                whereClause[key] = filtros[key];
        }

        const queryOptions = {
            where: whereClause,
            include: [
                { model: Usuario, as: 'usuario' },
                { model: Turno, as: 'turnos' },
                { model: Bloqueo, as: 'bloqueos' },
                { model: Horario, as: 'horarios' },
                { model: Contacto, as: 'contactos' },
                { model: Cobertura, as: 'coberturas' },
                { model: Clinica, as: 'clinicas' },
                { model: ProfesionalPractica, as: 'practicas', include:{ model: Practicas, as: 'practica' }},
            ],
            limit: filtros.pageSize,
            offset: (filtros.page - 1) * filtros.pageSize,
        };
        return await Profesional.findAll(queryOptions);
    } catch (error) {
        throw error;
    }
};

const createBloqueo = async (bloqueo) => {
    
    try {
        const profesional = await Profesional.findByPk(bloqueo.profesional_id, { include: ['horarios']});

        if (!profesional) {
            throw new Error('Profesional no encontrado');
        }
        
        /*
        
        // Verificar que el bloqueo esté dentro del horario del profesional
        const diaInicio = bloqueo.fecha_hora_desde.getDay();
        const diaFin = bloqueo.fecha_hora_hasta.getDay();
        const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

        const horariosInicio = profesional.horarios.filter(h => h.dia === diasSemana[diaInicio]);
        const horariosFin = profesional.horarios.filter(h => h.dia === diasSemana[diaFin]);

        if (!horariosInicio.some(h => timeToMinutes(h.hora_inicio) <= timeToMinutes(bloqueo.fecha_hora_desde.toTimeString().split(' ')[0]) && timeToMinutes(h.hora_fin) >= timeToMinutes(bloqueo.fecha_hora_desde.toTimeString().split(' ')[0])) ||
            !horariosFin.some(h => timeToMinutes(h.hora_inicio) <= timeToMinutes(bloqueo.fecha_hora_hasta.toTimeString().split(' ')[0]) && timeToMinutes(h.hora_fin) >= timeToMinutes(bloqueo.fecha_hora_hasta.toTimeString().split(' ')[0]))) {
            throw new Error('El bloqueo debe estar dentro del horario del profesional');
        }
        */

        // Verificar solapamiento con otros turnos o bloqueos
        const fechaInicio = new Date(bloqueo.fecha_hora_desde);
        const fechaFin = new Date(bloqueo.fecha_hora_hasta);

        const solapamientos = await Bloqueo.findAll({
            where: {
                profesional_id: bloqueo.profesional_id,
                [Op.or]: [
                    {
                        fecha_hora_desde: {
                            [Op.between]: [fechaInicio, fechaFin]
                        }
                    },
                    {
                        fecha_hora_hasta: {
                            [Op.between]: [fechaInicio, fechaFin]
                        }
                    },
                    {
                        [Op.and]: [
                            {
                                fecha_hora_desde: {
                                    [Op.lte]: fechaInicio
                                }
                            },
                            {
                                fecha_hora_hasta: {
                                    [Op.gte]: fechaFin
                                }
                            }
                        ]
                    }
                ],
                id: {
                    [Op.ne]: bloqueo.id
                }
            }
        });

        const solapamientosTurnos = await Turno.findAll({
            where: {
                profesional_id: bloqueo.profesional_id,
                estado: {
                    [Op.ne]: 'Cancelado'
                },
                [Op.or]: [
                    {
                        fecha_hora: {
                            [Op.between]: [fechaInicio, fechaFin]
                        }
                    },
                    {
                        [Op.and]: [
                            {
                                fecha_hora: {
                                    [Op.lte]: fechaInicio
                                }
                            },
                            {
                                fecha_hora: {
                                    [Op.gte]: fechaInicio
                                }
                            }
                        ]
                    },
                    {
                        [Op.and]: [
                            {
                                fecha_hora: {
                                    [Op.lte]: fechaFin
                                }
                            },
                            {
                                fecha_hora: {
                                    [Op.gte]: fechaFin
                                }
                            }
                        ]
                    }
                ]
            }
        });

        // Realizar la verificación de solapamiento mediante JavaScript
        const isOverlapping = (start1, end1, start2, end2) => {
            return (start1 < end2 && start2 < end1);
        };

        for (const turno of solapamientosTurnos) {
            const turnoInicio = new Date(turno.fecha_hora);
            const turnoFin = new Date(turno.fecha_hora);
            turnoFin.setMinutes(turnoInicio.getMinutes() + turno.duracion);

            if (isOverlapping(fechaInicio, fechaFin, turnoInicio, turnoFin)) {
                throw new Error('El bloqueo se solapa con otro turno existente');
            }
        }

        if (solapamientos.length > 0) {
            throw new Error('El bloqueo se solapa con otro bloqueo existente');
        }

        const bloqueodb = await Bloqueo.create(bloqueo);
        
        await afterCreate(bloqueodb);
        return bloqueodb;
    } catch (error) {
        
        console.log(error);
        throw new Error('Error al crear bloqueo en la base de datos');
    }
};

const updateBloqueo = async (bloqueoId, bloqueo) => {
    
    try {
        const bloqueodb = await Bloqueo.findByPk(bloqueoId);

        if (!bloqueodb) {
            throw new Error('Bloqueo no encontrado');
        }
        if (bloqueo.profesional_id != undefined && bloqueodb.profesional_id !== bloqueo.profesional_id) {
            throw new Error('No se puede cambiar el id del profesional.');
        }
        /*

        const profesional = await Profesional.findByPk(bloqueodb.profesional_id, { include: ['horarios']});

        // Verificar que el bloqueo esté dentro del horario del profesional
        const diaInicio = bloqueo.fecha_hora_desde.getDay();
        const diaFin = bloqueo.fecha_hora_hasta.getDay();
        const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

        const horariosInicio = profesional.horarios.filter(h => h.dia === diasSemana[diaInicio]);
        const horariosFin = profesional.horarios.filter(h => h.dia === diasSemana[diaFin]);

        */
        if (!horariosInicio.some(h => timeToMinutes(h.hora_inicio) <= timeToMinutes(bloqueo.fecha_hora_desde.toTimeString().split(' ')[0]) && timeToMinutes(h.hora_fin) >= timeToMinutes(bloqueo.fecha_hora_desde.toTimeString().split(' ')[0])) ||
            !horariosFin.some(h => timeToMinutes(h.hora_inicio) <= timeToMinutes(bloqueo.fecha_hora_hasta.toTimeString().split(' ')[0]) && timeToMinutes(h.hora_fin) >= timeToMinutes(bloqueo.fecha_hora_hasta.toTimeString().split(' ')[0]))) {
            throw new Error('El bloqueo debe estar dentro del horario del profesional');
        }

        // Verificar solapamiento con otros turnos o bloqueos
        const fechaInicio = new Date(bloqueo.fecha_hora_desde);
        const fechaFin = new Date(bloqueo.fecha_hora_hasta);

        const solapamientos = await Bloqueo.findAll({
            where: {
                profesional_id: bloqueo.profesional_id,
                [Op.or]: [
                    {
                        fecha_hora_desde: {
                            [Op.between]: [fechaInicio, fechaFin]
                        }
                    },
                    {
                        fecha_hora_hasta: {
                            [Op.between]: [fechaInicio, fechaFin]
                        }
                    },
                    {
                        [Op.and]: [
                            {
                                fecha_hora_desde: {
                                    [Op.lte]: fechaInicio
                                }
                            },
                            {
                                fecha_hora_hasta: {
                                    [Op.gte]: fechaFin
                                }
                            }
                        ]
                    }
                ],
                id: {
                    [Op.ne]: bloqueo.id
                }
            }
        });

        const solapamientosTurnos = await Turno.findAll({
            where: {
                profesional_id: bloqueo.profesional_id,
                estado: {
                    [Op.ne]: 'Cancelado'
                },
                [Op.or]: [
                    {
                        fecha_hora: {
                            [Op.between]: [fechaInicio, fechaFin]
                        }
                    },
                    {
                        [Op.and]: [
                            {
                                fecha_hora: {
                                    [Op.lte]: fechaInicio
                                }
                            },
                            {
                                fecha_hora: {
                                    [Op.gte]: fechaInicio
                                }
                            }
                        ]
                    },
                    {
                        [Op.and]: [
                            {
                                fecha_hora: {
                                    [Op.lte]: fechaFin
                                }
                            },
                            {
                                fecha_hora: {
                                    [Op.gte]: fechaFin
                                }
                            }
                        ]
                    }
                ]
            }
        });

        // Realizar la verificación de solapamiento mediante JavaScript
        const isOverlapping = (start1, end1, start2, end2) => {
            return (start1 < end2 && start2 < end1);
        };

        for (const turno of solapamientosTurnos) {
            const turnoInicio = new Date(turno.fecha_hora);
            const turnoFin = new Date(turno.fecha_hora);
            turnoFin.setMinutes(turnoInicio.getMinutes() + turno.duracion);

            if (isOverlapping(fechaInicio, fechaFin, turnoInicio, turnoFin)) {
                throw new Error('El bloqueo se solapa con otro turno existente');
            }
        }

        if (solapamientos.length > 0) {
            throw new Error('El bloqueo se solapa con otro bloqueo existente');
        }

        await bloqueodb.update(bloqueo);
        
        await afterUpdate(bloqueo,getChanges(bloqueodb.toJSON(),bloqueo))
        return bloqueodb;
    } catch (error) {
        
        console.error(error);
        throw new Error('Error al actualizar bloqueo en la base de datos');
    }
}; 

const getBloqueoById = async ( bloqueoId ) => {
    try {
        const result = await Bloqueo.findByPk( bloqueoId, {
            include: [
                { model: Profesional, as: 'profesional' },
            ]
        });
        return result;
    } catch (error) {
        console.log(error)
        throw new Error('Error al obtener profesional por ID de la base de datos');
    }
};

const deleteBloqueo = async (bloqueoId) => {
    
    try {
        const result = await Bloqueo.destroy({
            where: { id: bloqueoId }
        });
        
        return result;
    } catch (error) {
        
        throw new Error('Error al eliminar profesional de la base de datos');
    }
};
async function getHorarioPractica(profesionalId, start, end) {
    const profesional = await Profesional.findByPk(profesionalId, {
        include: [
            { model: Horario, as: 'horarios' },
            { model: ProfesionalPractica, as: 'practicas' }
        ]
    });
  
    // Calcular la duración de la práctica más corta
    let practica = profesional.practicas.reduce((prev, cur) => {
        return (cur.duracion < prev.duracion) ? cur.duracion : prev;
    },30);

    return { horarios:profesional.horarios, practica };
};

async function afterCreate(bloqueo) {
    try {
        //await logChange(bloqueo, 'create');
        //Evento secretaria
        //Evento profesional
        let {horarios,practica} = await getHorarioPractica(bloqueo.profesional_id,new Date(bloqueo.fecha_hora_desde),new Date(bloqueo.fecha_hora_hasta));

        publishEvent('actualizacion',{ modelo:"bloqueo",operation:'create', horario:horarios,practica,bloqueoId: bloqueo.id });
        publishEvent( 'doctor-'+bloqueo.profesional_id,{modelo:"bloqueo",operation:'create', horario:horarios,practica,bloqueoId: bloqueo.id });
    } catch (error) { }
};

async function afterUpdate(bloqueo, changes) {
    try {
        //await logChange(bloqueo, 'update');
        let {horarios,practica} = await getHorarioPractica(bloqueo.profesional_id,new Date(bloqueo.fecha_hora_desde),new Date(bloqueo.fecha_hora_hasta));
        publishEvent('actualizacion',{ modelo:"bloqueo",operation:'update', horario:horarios,practica,bloqueoId: bloqueo.id ,changes});
        publishEvent( 'doctor-'+bloqueo.profesional_id,{modelo:"bloqueo",operation:'update', horario:horarios,practica,bloqueoId: turno.id ,changes});
    } catch (error) { }
};

function getChanges(oldData, newData) {
    const changes = {};
    for (const key in oldData) {
        if (oldData[key] !== newData[key]) {
            changes[key] = { from: oldData[key], to: newData[key] };
        }
    }
    return changes;
};

const getAllProfesionalesIds = async () => {
    const profesionales = await Profesional.findAll({ attributes: ['id'] });
    return profesionales.map(profesional => profesional.id);
};

const createBloqueosFromHolidays = async (profesionalIds) => {
    try {
        const bloqueos = [];

        
        for (const holiday of holidays) {
            const mes = holiday.mes;
            const anio = holiday.anio;
            
            if(anio == new Date().getFullYear())
            {
                for (const dias in holiday) {
                    if (dias === 'mes' || dias === 'anio') continue;
    
                    const diasArray = dias.split(',');
    
                    for (const dia of diasArray) {
                        const fecha = new Date(anio, mes, parseInt(dia));
                        
                        for (const profesionalId of profesionalIds) {
                            bloqueos.push({
                                profesional_id: profesionalId,
                                fecha_hora_desde: fecha,
                                fecha_hora_hasta: new Date(fecha.getTime() + 24 * 60 * 60 * 1000 - 1), // Fin del día
                                motivo: `${Array.isArray(holiday[dias]) ? holiday[dias].join(', ') : holiday[dias]} - Automatico`
                            });
                        }
                    }
                }
            } 
        }

        // Guardar todos los bloqueos en la base de datos
        await Bloqueo.bulkCreate(bloqueos);

        console.log(`Se han creado ${bloqueos.length} bloqueos para los profesionales.`);
    } catch (error) {
        console.error('Error al crear los bloqueos:', error);
        throw new Error('Error al crear los bloqueos a partir de los días festivos');
    }
};

module.exports = {
    createProfesional,
    getAllProfesionales,
    getProfesionalById,
    updateProfesional,
    deleteProfesional,
    search,getHorarioPractica,
    createBloqueo,
    updateBloqueo,
    deleteBloqueo,
    getBloqueoById,
    getAllProfesionalesIds,
    createBloqueosFromHolidays,
};
