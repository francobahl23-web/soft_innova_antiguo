const { sequelize } = require('../models');
const {
  Turno,HistorialCambio, Profesional, Paciente, Cobertura, Practicas, ProfesionalPractica, Usuario, Historial, Bloqueo, Horario, Contacto
} = sequelize.models;
const { Op } = require('sequelize');
const { publishEvent } = require('../2-services/Event');

const checkAvailability = async (profesionalId, fechaHora, duracion, turnoId) => {
    const fechaInicio = new Date(fechaHora);
    const fechaFin = new Date(fechaHora);
    fechaFin.setMinutes(fechaInicio.getMinutes() + duracion);

    // Obtener el día de inicio y fin
    const startOfDay = new Date(fechaInicio);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(fechaInicio);
    endOfDay.setHours(23, 59, 59, 999);

    let whereTurnos = {
        profesional_id: profesionalId,
        estado: { [Op.ne]: 'Cancelado' },
        tipo: { [Op.ne]: 'sobreturno' },
        fecha_hora: {
            [Op.between]: [startOfDay, endOfDay]
        }
    };

    if (turnoId) {
        whereTurnos.id = { [Op.ne]: turnoId };
    }

    const existingTurnos = await Turno.findAll({ where: whereTurnos });

    let whereBloqueos = {
        profesional_id: profesionalId,
        [Op.or]: [
            {
                fecha_hora_desde: { [Op.between]: [startOfDay, endOfDay] },
                fecha_hora_hasta: { [Op.between]: [startOfDay, endOfDay] }
            },
            {
                fecha_hora_desde: { [Op.lte]: startOfDay },
                fecha_hora_hasta: { [Op.gte]: endOfDay }
            }
        ]
    };

    const existingBloqueos = await Bloqueo.findAll({ where: whereBloqueos });

    const isOverlapping = (start1, end1, start2, end2) => {
        return (start1 < end2 && start2 < end1);
    };

    for (const turno of existingTurnos) {
        const turnoInicio = new Date(turno.fecha_hora);
        const turnoFin = new Date(turno.fecha_hora);
        turnoFin.setMinutes(turnoInicio.getMinutes() + turno.duracion);

        if (isOverlapping(fechaInicio, fechaFin, turnoInicio, turnoFin)) {
            const suggestions = await getSuggestions(profesionalId, fechaHora, duracion);
            return {
                available: false,
                message: turnoId ? "No se pudo editar el turno, ya que se estaría solapando con otro turno" : "No se pudo crear el turno, ya que está solapado con otro turno",
                suggestions: suggestions
            };
        }
    }

    for (const bloqueo of existingBloqueos) {
        const bloqueoInicio = new Date(bloqueo.fecha_hora_desde);
        const bloqueoFin = new Date(bloqueo.fecha_hora_hasta);

        if (isOverlapping(fechaInicio, fechaFin, bloqueoInicio, bloqueoFin)) {
            const suggestions = await getSuggestions(profesionalId, fechaHora, duracion);
            return {
                available: false,
                message: "No se pudo crear el turno, ya que hay un bloqueo en el mismo horario.",
                suggestions: suggestions
            };
        }
    }

    // Obtener horarios del profesional para el día específico
    const dayOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][fechaInicio.getDay()];
    const horarios = await Horario.findAll({
        where: {
            profesional_id: profesionalId,
            dia: dayOfWeek
        }
    });

    // Verificar si la hora solicitada está dentro del horario del profesional
    const isWithinHorario = horarios.some(horario => {
        const horaInicio = new Date(fechaInicio);
        const horaFin = new Date(fechaFin);
        horaInicio.setHours(...horario.hora_inicio.split(':'), 0);
        horaFin.setHours(...horario.hora_fin.split(':'), 0);

        return fechaInicio >= horaInicio && fechaFin <= horaFin;
    });

    if (!isWithinHorario) {
        const suggestions = await getSuggestions(profesionalId, fechaHora, duracion);
        return {
            available: true,
            message: "El turno fue programado fuera del horario del profesional.",
            suggestions: suggestions
        };
    }

    return { available: true, suggestions: [] };
};

const getSuggestions = async (profesionalId, fechaHora, duracion) => {
    const suggestions = [];
    const startTime = new Date(fechaHora);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 7);

    const horarios = await Horario.findAll({
        where: {
            profesional_id: profesionalId,
            dia: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][startTime.getDay()]
        }
    });

    horarios.forEach(horario => {
        let start = new Date(startTime);
        start.setHours(...horario.hora_inicio.split(':'), 0);
        let end = new Date(startTime);
        end.setHours(...horario.hora_fin.split(':'), 0);

        while (start < end) {
            const slotEnd = new Date(start);
            slotEnd.setMinutes(start.getMinutes() + duracion);

            if (slotEnd <= end) {
                suggestions.push({
                    start: start.toISOString(),
                    end: slotEnd.toISOString()
                });
            }

            start = slotEnd;
        }
    });

    return suggestions;
};

const handleCreateTurno = async (turnoData) => {
    
    let result = {};
    try {
        const entities = await Promise.all([
            Profesional.findByPk(turnoData.profesional_id,{include:{ model: ProfesionalPractica, as: 'practicas',where:{practica_id:turnoData.practica_id},required:false }}),
            Paciente.findByPk(turnoData.paciente_id),
            Practicas.findByPk(turnoData.practica_id)
            //Clinica.findByPk(turnoData.clinica_id)
        ]);
        
        if (turnoData.cobertura_id) {
            entities.push(await Cobertura.findByPk(turnoData.cobertura_id));
        }

        if (turnoData.usuario_id) {
            entities.push(await Usuario.findByPk(turnoData.usuario_id));
        }
 
        if (entities.some(entity => entity === null)) {
            throw new Error('Una o más entidades relacionadas no existen.');
        }
        if(entities[0].practicas.length===0){
            throw new Error('Error en la práctica, limpiar profesional y volver a seleccionar.');
        }

        if(turnoData.tipo != "sobreturno"){
            const availability = await checkAvailability(turnoData.profesional_id, turnoData.fecha_hora, turnoData.duracion);
            //Si esta fuera de horario lo agregamos igual
            if (!availability.available) {
                return availability;
            }
        }
        const turno = await Turno.create(turnoData);

        if (turnoData.historial && turnoData.historial.length) {
            for (const historial of turnoData.historial) {
                await Historial.create({ ...historial, turno_id: turno.id });
            }
        }

        await HistorialCambio.create({
            turno_id: turno.id,
            usuario_id: turnoData.usuario_id,
            campo_modificado: 'Creador',
            nuevo_valor: '',
            valor_anterior: ''
        });
        
        
        result.available = true;
        result.turno = turno;
        await afterCreate(turno);
        return result;
    } catch (error) {
        
        throw error;
    }
};

const handleUpdateTurno = async (turnoId, turnoData) => {
    
    const turno = await Turno.findByPk(turnoId);
    if (!turno) {
        throw new Error('Turno no encontrado');
    }
    if(turnoData.practica_id){
        let validProf = await Profesional.findByPk(turno.profesional_id,{include:{ model: ProfesionalPractica, as: 'practicas',where:{practica_id:turnoData.practica_id} }})
        console.log(validProf)
        if(!validProf){
            throw new Error('Error en la práctica, limpiar profesional y volver a seleccionar.');
        }
    }
    try {
        if (turnoData.tipo != "sobreturno" && turnoData.fecha_hora && new Date(turno.fecha_hora).toISOString() !== new Date(turnoData.fecha_hora).toISOString()) {
            const availability = await checkAvailability(turno.profesional_id, turnoData.fecha_hora, turno.duracion, turnoId);
            if (!availability.available) {
                return availability;
            }
        }

        const oldTurnoData = turno.toJSON();
        await turno.update(turnoData);

        if (turnoData.historial && turnoData.historial.length) {
            await Historial.destroy({ where: { turno_id: turno.id }});
            for (const historial of turnoData.historial) {
                await Historial.create({ ...historial, turno_id: turno.id });
            }
        }
        // Create history record
        let changes = Object.keys(turnoData).filter(key => turnoData[key] !== oldTurnoData[key]);

        if(changes.includes('fecha_hora') && new Date(turno.fecha_hora).toISOString() === new Date(turnoData.fecha_hora).toISOString())
            changes = changes.filter( el => el !== 'fecha_hora')

        for (const change of changes) {
            await HistorialCambio.create({
                turno_id: turno.id,
                usuario_id: turnoData.usuario_id,
                campo_modificado: change,
                nuevo_valor: turnoData[change] ?? '',
                valor_anterior: oldTurnoData[change] instanceof Date ? oldTurnoData[change].toISOString() : oldTurnoData[change] ?? ''
            });
        }
        
        await afterUpdate(turno, getChanges(oldTurnoData,turnoData))
        return { turno, available: true };
    } catch (error) {
        
        console.log(error)
        throw new Error('Ocurrio un error al actualizar el turno.'); 
    }
};

const createTurno = async (turnoData) => {
    const result = await handleCreateTurno(turnoData);
    return result;
};

const updateTurno = async (turnoId, turnoData) => {
    const result = await handleUpdateTurno(turnoId, turnoData);
    return result;
};

const deleteTurno = async (turnoId) => {
    try {
        const turno = await Turno.findByPk(turnoId);
        if (!turno) {
            throw new Error('Turno no encontrado');
        }
        await turno.destroy();
        return { message: 'Turno eliminado correctamente' };
    } catch (error) {
        throw error;
    }
};

const getTurnoById = async (turnoId) => {
    try {
        const turno = await Turno.findByPk(turnoId, {
            include: ['profesional', 
            {
                model: Paciente, as: 'paciente',
                include: [{ model: Contacto, required: false, as: 'contactos' },
                { model: Cobertura, as: 'coberturas' }]
            }, 'cobertura', 'practica', 'clinica', 'usuario', 'historial',
            {model:HistorialCambio,include:{model:Usuario,as:"usuario",attributes:['username',"nombre"]},as:"historial_cambios"}]
        });
        
        if (!turno) {
            throw new Error('Turno no encontrado');
        }
        return turno;
    } catch (error) {
        throw error;
    }
};



const getAllTurnos = async (profesionalId) => {
    try {
        let where = {};
        if(profesionalId)
            where.profesional_id = profesionalId
        const turnos = await Turno.findAll({
            where,
            include: ['profesional', 'paciente', 'cobertura', 'practica', 'clinica', 'usuario', 'historial']
        });
        return turnos;
    } catch (error) {
        throw error;
    }
};
async function getHorarioPractica(profesionalId){
    const profesional = await Profesional.findByPk(profesionalId, {
        include: [ 
            { model: Horario, as: 'horarios' },
            { model: ProfesionalPractica, as: 'practicas'}]
    });
    
    // Verificar si el profesional tiene horario este día
    let practica = profesional.practicas.reduce((prev,cur)=>{return (cur.duracion<prev)? cur.duracion:prev},30)
    return {horarios:profesional.horarios,practica};
}
async function afterCreate(turno) {
    try {
        //await logChange(turno, 'create');
        //Evento secretaria
        //Evento profesional
        let {horarios,practica} = await getHorarioPractica(turno.profesional_id,new Date(turno.fecha_hora));
        publishEvent( 'actualizacion', { modelo:"turno", operation:'create', horario:horarios, practica, turnoId: turno.id } );
        publishEvent( 'doctor-'+turno.profesional_id,{modelo:"turno", operation:'create', horario:horarios,practica,turnoId: turno.id });
    } catch (error) { 
        console.log(error)
    }
}
async function afterUpdate(turno, changes) {
    try {
        //await logChange(turno, 'update');
        let {horarios,practica} = await getHorarioPractica(turno.profesional_id,new Date(turno.fecha_hora));
        publishEvent('actualizacion',{ modelo:"turno", operation:'update', horario:horarios,practica,turnoId: turno.id ,changes});
        publishEvent( 'doctor-'+turno.profesional_id,{modelo:"turno", operation:'update', horario:horarios,practica,turnoId: turno.id ,changes});
    } catch (error) { 
        console.log(error)
    }
}
function getChanges(oldData, newData) {
    const changes = {};
    for (const key in oldData) {
        if ( newData[key] && oldData[key] !== newData[key]) {
            changes[key] = { from: oldData[key], to: newData[key] };
        }
    }
    return changes;
}

module.exports = {
    createTurno,
    updateTurno,
    deleteTurno,
    getTurnoById,
    getAllTurnos
};
