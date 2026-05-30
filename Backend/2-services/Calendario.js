const calendarioRepository = require('../3-repositories/Calendario');
const TurnoDTO = require('./DTO/TurnoDTO'); 

const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const consultarDisponibilidad = async (req, res) => {
    try {
        let { coberturas, practicas, servicios, profesionales, fecha } = req.query;
        const cantDias = parseInt(req.params.cant_dias, 10);
        coberturas = coberturas ? coberturas.split(',') : [];
        practicas = practicas ? practicas.split(',') : [];
        servicios = servicios ? servicios.split(',') : [];
        profesionales = profesionales ? profesionales.split(',') : [];

        if(req.user.rol==="profesional"){
           profesionales = [req.user.profesional.id];
        }
        let [year, month, day] = fecha.split('-').map(Number);
        let fechaInicio = new Date(year, month - 1, day, 0, 0, 0);

        const disponibilidad = await calendarioRepository.consultarDisponibilidad({
            coberturas, practicas, servicios, profesionales, fecha: fechaInicio, cantDias
        });
        if(disponibilidad === null){
            return res.failureResponse({message:"El profesional no tiene horarios asignados"})
        }
        const result = disponibilidad.map(day => {
            const list = [];

            // Procesar disponibilidad
            for (const disp of day.disponibilidad) {
                const start = new Date(disp.start);
                const end = new Date(disp.end);
                const duracion = (end - start) / 60000;
                list.push({
                    tipo: "disponibilidad",
                    start: start,
                    end: end,
                    hora: formatTime(start),
                    text: `${formatTime(start)} - ${formatTime(end)}`,
                    duracion: duracion,
                });
            }

            // Procesar turnos
            for (const turno of day.turnos) {
                const start = new Date(turno.fecha_hora);
                const end = new Date(start.getTime() + turno.duracion * 60000);
                list.push({
                    id: turno.id,
                    estado: turno.estado,
                    tipo: turno.tipo,
                    doctor: `${turno.profesional.apellido}, ${turno.profesional.nombre}`,
                    profesional_id: turno.profesional.id,
                    practica_id: turno.practica.id,
                    practica: turno.practica.nombre,
                    nota: turno.nota,
                    hora: formatTime(start),
                    horario: `${formatTime(start)} - ${formatTime(end)}`,
                    nombre: TurnoDTO.formatNombre(turno.paciente),
                    obraSocial: TurnoDTO.formatObraSocial(turno.paciente?.coberturas),
                    idPaciente: turno.paciente.id,
                    duracion: turno.duracion,
                    estado: turno.estado,
                    start,
                    end,
                    text: `${formatTime(start)} - ${formatTime(end)}`, // Texto adicional si lo necesitas
                });
            }

            // Procesar bloqueos
            for (const bloqueo of day.bloqueos) {
                const start = new Date(bloqueo.fecha_hora_desde);
                const end =  new Date(bloqueo.fecha_hora_hasta);
                list.push({
                    id: bloqueo.id,
                    tipo: "bloqueo",
                    start,
                    end,
                    text:bloqueo.motivo,
                    hora: formatTime(start),
                });
            }

            // Ordenar la lista por horario
            list.sort((a, b) => (a.start).getTime() - (b.start).getTime());

            return {
                dia: day.dia,
                list: list,
                turnos: day.turnosDiaTodos.map(e => TurnoDTO.fromDatabase(e)),
            };
        });

        res.ok({ data: result });
    } catch (error) {
        console.log(error);
        res.failureResponse({ message: `Error al consultar disponibilidad`, error });
    }
};

module.exports = {
    consultarDisponibilidad,
};
