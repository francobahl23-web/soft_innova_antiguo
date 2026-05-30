const { Turno, Horario,HistorialCambio, Profesional, Usuario,Practicas, ProfesionalPractica, Bloqueo, Cobertura, Paciente, Contacto } = require('../models');
const { Op } = require('sequelize');

const consultarDisponibilidad = async ({ coberturas, practicas, servicios, profesionales, fecha, cantDias }) => {
    let whereClause = {
        fecha_hora: {
            [Op.gte]: new Date(fecha)
        }
    };

    if (coberturas && coberturas.length > 0) {
        whereClause.cobertura_id = { [Op.in]: coberturas };
    }

    if (practicas && practicas.length > 0) {
        whereClause.practica_id = { [Op.in]: practicas };
    }
    let flag = false;
    if (!profesionales || profesionales.length === 0) {
        flag=true;
        profesionales = (await Profesional.findAll({ where: { active: true }, attributes: ['id'] })).map(e => e.id);
    }

    whereClause.profesional_id = { [Op.in]: profesionales };

    const turnos = await Turno.findAll({
        where: whereClause,
        include: [
            { model: Profesional, as: 'profesional' },
            {
                model: Paciente, as: 'paciente',
                include: [{ model: Contacto, required: false, as: 'contactos' },
                { model: Cobertura, as: 'coberturas' },]
            },
            { model: Cobertura, required: false, as: 'cobertura' },
            { model: Practicas, as: 'practica' },
            {model:HistorialCambio,include:{model:Usuario,as:"usuario",attributes:['username',"nombre"]},as:"historial_cambios"}
        ],
        order: [['fecha_hora', 'ASC']]
    });

    const bloqueos = await Bloqueo.findAll({
        where: {
            fecha_hora_hasta: { [Op.gte]: new Date(fecha) },
            profesional_id: { [Op.in]: profesionales }
        },
        include: { model: Profesional, as: 'profesional' },
        order: [['fecha_hora_desde', 'ASC']]
    });
    let disponibilidad = [];
    let daysCount = 0; 

    if(flag){
        
        for (let d = new Date(fecha); daysCount < cantDias; d.setDate(d.getDate() + 1)) {

            let dateStr = d.toISOString().split('T')[0];
    
            let turnosDiaTodos = turnos.filter(t => t.fecha_hora.getDate() === d.getDate() && t.fecha_hora.getMonth() === d.getMonth() && t.fecha_hora.getFullYear() === d.getFullYear());
            let bloqueosDia = bloqueos.filter(b => {
                let start = new Date(b.fecha_hora_desde);
                let end = new Date(b.fecha_hora_hasta);
                let startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                let endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                let currentDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            
                return (startDay <= currentDay && endDay >= currentDay);
            });
            
            let turnosDiaSinCancelados = turnosDiaTodos.filter(t => t.estado !== 'Cancelado');

            let aux = {
                dia: dateStr,
                turnos: turnosDiaSinCancelados,
                bloqueos: bloqueosDia,
                turnosDiaTodos,
                disponibilidad:[]
            }; 
            disponibilidad.push(aux);
            daysCount++;
        }
        return disponibilidad
    }
    // Filtrar los días laborales del profesional
    const horarios = await Horario.findAll({
        where: { profesional_id: whereClause.profesional_id },
        order: [['profesional_id', 'DESC']]
    });
    
    if(horarios.length===0){
        return null;
    }

    for (let d = new Date(fecha); daysCount < cantDias; d.setDate(d.getDate() + 1)) {

        let dayOfWeek = d.toLocaleString('es-ES', { weekday: 'long' });

        // Verificar si el profesional tiene horario este día
        let dateStr = d.toISOString().split('T')[0];
        
        let horarioDia = horarios.filter(h => h.dia === dayOfWeek);
        let turnosDiaTodos = turnos.filter(t => t.fecha_hora.getDate() === d.getDate() && t.fecha_hora.getMonth() === d.getMonth() && t.fecha_hora.getFullYear() === d.getFullYear());
        let bloqueosDia = bloqueos.filter(b => {
            let start = new Date(b.fecha_hora_desde);
            let end = new Date(b.fecha_hora_hasta);
            let startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            let endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            let currentDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        
            return (startDay <= currentDay && endDay >= currentDay);
        });
        let turnosDiaSinCancelados = turnosDiaTodos.filter(t => t.estado !== 'Cancelado');

        if (horarioDia.length > 0) { 

            let turnosDiaSinSobreTNiCancel = turnosDiaSinCancelados.filter(t => t.tipo !== 'sobreturno');

            let aux = {
                dia: dateStr,
                turnos: turnosDiaSinCancelados,
                bloqueos: bloqueosDia,
                turnosDiaTodos,
                disponibilidad:[]
            };

            if (profesionales.length === 1) {
                const minDuration = await getMinDuration(practicas, profesionales[0]);
                aux.disponibilidad = calculateFreeSlots(horarioDia, turnosDiaSinSobreTNiCancel, bloqueosDia, d, minDuration);
            }
            disponibilidad.push(aux);
            daysCount++;
        }else if(turnosDiaSinCancelados.length>0){
            
            let aux = {
                dia: dateStr,
                turnos: turnosDiaSinCancelados,
                bloqueos: bloqueosDia,
                turnosDiaTodos,
                disponibilidad:[]
            }; 
            disponibilidad.push(aux);
            daysCount++;
        }
    }

    return disponibilidad;
};

async function getMinDuration(practicas, profesional_id) {
    let whereClause = { profesional_id: profesional_id };
    if (practicas && practicas.length > 0) {
        whereClause.practica_id = { [Op.in]: practicas };
    }
    const practicasList = await ProfesionalPractica.findAll({ where: whereClause, attributes: ['duracion'] });
    return Math.min(...practicasList.map(p => p.duracion));
}

function calculateFreeSlots(horarios, turnos, bloqueos, date, minDuration) {
    let freeSlots = [];
    let slotDuration = minDuration * 60000; // Convertir a milisegundos

    horarios.forEach(horario => {
        let start = new Date(date);
        start.setHours(...horario.hora_inicio.split(':'), 0);
        let end = new Date(date);
        end.setHours(...horario.hora_fin.split(':'), 0);

        // Combine turnos and bloqueos into one array of busy slots
        let busySlots = turnos.filter(t => {
            let fecha_inicio = new Date(t.fecha_hora);
            let fecha_fin = new Date(fecha_inicio.getTime() + t.duracion * 60000);
            return !(fecha_fin.getTime() <= start.getTime() || fecha_inicio.getTime() >= end.getTime());
        }).map(t => ({
            start: new Date(t.fecha_hora),
            end: new Date(t.fecha_hora.getTime() + t.duracion * 60000)
        })).concat(
            
            bloqueos.filter(bl=>{
                return !(bl.fecha_hora_hasta.getTime() <= start.getTime() || bl.fecha_hora_desde.getTime() >= end.getTime())
            }).map(b => ({
                start: new Date(b.fecha_hora_desde),
                end: new Date(b.fecha_hora_hasta)
            }))
        );

        // Sort by start time
        busySlots.sort((a, b) => a.start - b.start);

        // Calculate free slots
        let currentStart = start;
        if(busySlots[0] && busySlots[0].end > currentStart && busySlots[0].start < currentStart){
            currentStart = busySlots[0].end;
        }
        busySlots.forEach(slot => {
            while (currentStart < slot.start) {
                let currentEnd = new Date(currentStart.getTime() + slotDuration);
                if (currentEnd <= slot.start) {
                    const duracion = (currentEnd - currentStart) / 60000; // Duración en minutos
                    freeSlots.push({
                        start: currentStart,
                        end: currentEnd,
                        duracion: duracion
                    });
                }
                currentStart = currentEnd;
            }
            if (new Date(slot.end) > currentStart) {
                currentStart = new Date(slot.end);
            }
        });

        while (currentStart < end) {
            let currentEnd = new Date(currentStart.getTime() + slotDuration);
            if (currentEnd <= end) {
                const duracion = (currentEnd - currentStart) / 60000; // Duración en minutos
                freeSlots.push({
                    start: currentStart,
                    end: currentEnd,
                    duracion: duracion
                });
            }
            currentStart = currentEnd;
        }
    });

    return freeSlots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString()
    }));
}

module.exports = {
    consultarDisponibilidad,
};
