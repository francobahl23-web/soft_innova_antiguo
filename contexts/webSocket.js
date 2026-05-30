'use client';
// WebSocketContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/user'; // Ajusta la ruta según corresponda
import { useTurnoContext } from '@/contexts/turno'; // Ajusta la ruta según corresponda
import { toast } from 'react-toastify';
import { usePathname } from 'next/navigation';

const WebSocketContext = createContext([]);

export const useWebSocketContext = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const { user } = useUserContext();
    const { lenguaje, fechaFormateada, date, setTurnos, setDias, compararTurnos, filtros } = useTurnoContext()
    const [socket, setSocket] = useState(null);

    const formatTime = (date) => {
        if(typeof date === 'string')
            date = new Date(date) 
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };
    
    // Función para convertir una fecha formateada en un objeto Date
    const parseFechaFormateada = (fechaFormateada, lenguaje) => {
        const [diaSemana, diaMes, mes, anio] = fechaFormateada
            .replace(',', '')
            .split(/[\s-]+/);
        const mesesEspañol = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const mesesIngles = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const mesIndex = lenguaje === 'español' ? mesesEspañol.indexOf(mes) : mesesIngles.indexOf(mes);

        return new Date(anio, mesIndex, diaMes);
    };

    // Función para comparar solo día, mes y año de dos fechas usando la fecha formateada
    const isSameDay = (fecha1, fecha2) => {
        return (
            fecha1.getFullYear() === fecha2.getFullYear() &&
            fecha1.getMonth() === fecha2.getMonth() &&
            fecha1.getDate() === fecha2.getDate()
        );
    };

    function updateCalendarBloqueo(bloqueo, operation, horarios, practica) {
        setDias(prev => {
            if (!prev) return prev;
            if (!prev.profesional || (prev.profesional && prev.profesional.id !== bloqueo.profesional_id)) return prev;

            // Función para obtener el rango de días entre dos fechas
            function getDaysArray(start, end) {
                let arr = [];
                let dt = new Date(start);
                while (dt <= end) {
                    arr.push(new Date(dt));
                    dt.setDate(dt.getDate() + 1);
                }
                return arr;
            }

            const bloqueoStart = new Date(bloqueo.start);
            const bloqueoEnd = new Date(bloqueo.end);
            const daysArray = getDaysArray(bloqueoStart, bloqueoEnd);

            return {
                ...prev,
                dias: prev.dias.map(dia => {
                    let diaDate = new Date(dia.fecha);
                    let diaString = diaDate.toDateString();
                    let inBloqueoRange = daysArray.some(day => day.toDateString() === diaString);
    
                    if (inBloqueoRange) {
                        let bloqueoOld = dia.intervalos.find(intervalo => intervalo.tipo === "bloqueo" && intervalo.id == bloqueo.id);
                        let intervalos = dia.intervalos.filter(intervalo => {
                            if (intervalo.id === bloqueo.id) return false;
    
                            let intervaloStart = new Date(intervalo.start);
                            let intervaloEnd = new Date(intervalo.end);
    
                            return (
                                !(
                                    (intervalo.tipo === "disponibilidad" &&
                                        (intervaloStart < new Date(bloqueo.end) && intervaloEnd > new Date(bloqueo.start))) ||
                                    (intervalo.tipo === "disponibilidad" &&
                                        (intervaloStart == new Date(bloqueo.start).toISOString() && intervaloEnd == new Date(bloqueo.end).toISOString()))
                                )
                            );
                        });
                        if (operation === "delete" && bloqueoOld) {
                            horarios.forEach(horario => {
                                if (horario.dia === diaDate.toLocaleDateString('es-ES', { weekday: 'long' })) {
                                    let horarioInicio = new Date(`${diaString} ${horario.hora_inicio}`);
                                    let horarioFin = new Date(`${diaString} ${horario.hora_fin}`);
                                    let bloqueoInicio = new Date(bloqueoOld.start);
                                    let bloqueoFin = new Date(bloqueoOld.end);
                            
                                    // Crear intervalos de disponibilidad según el día y la hora del bloqueo
                                    if (bloqueoInicio.toDateString() === diaDate.toDateString() && bloqueoFin.toDateString() === diaDate.toDateString()) {
                                        // El bloqueo empieza y termina el mismo día
                                        if (bloqueoInicio <= horarioFin && bloqueoFin >= horarioInicio) {
                                            if (bloqueoInicio > horarioInicio) {
                                                horarioInicio = bloqueoInicio;
                                            }
                                            if (bloqueoFin < horarioFin) {
                                                horarioFin = bloqueoFin;
                                            }
                                            while (horarioInicio < horarioFin) {
                                                let disponibilidadFin = new Date(horarioInicio.getTime() + practica * 60000);
                                                if (disponibilidadFin > horarioFin) {
                                                    disponibilidadFin = new Date(horarioFin);
                                                }
                                                intervalos.push({
                                                    tipo: "disponibilidad",
                                                    duracion: practica,
                                                    start: horarioInicio,
                                                    end: disponibilidadFin,
                                                    text: `${formatTime(horarioInicio)} - ${formatTime(disponibilidadFin)}`,
                                                    hora: formatTime(horarioInicio),
                                                });
                                                horarioInicio = new Date(disponibilidadFin);
                                            }
                                        }
                                    } else if (bloqueoInicio.toDateString() === diaDate.toDateString()) {
                                        // El bloqueo empieza en este día pero termina después
                                        if (bloqueoInicio <= horarioFin) {
                                            if (bloqueoInicio > horarioInicio) {
                                                horarioInicio = bloqueoInicio;
                                            }
                                            while (horarioInicio < horarioFin) {
                                                let disponibilidadFin = new Date(horarioInicio.getTime() + practica * 60000);
                                                if (disponibilidadFin > horarioFin) {
                                                    disponibilidadFin = new Date(horarioFin);
                                                }
                                                intervalos.push({
                                                    tipo: "disponibilidad",
                                                    duracion: practica,
                                                    start: horarioInicio,
                                                    end: disponibilidadFin,
                                                    text: `${formatTime(horarioInicio)} - ${formatTime(disponibilidadFin)}`,
                                                    hora: formatTime(horarioInicio),
                                                });
                                                horarioInicio = new Date(disponibilidadFin);
                                            }
                                        }
                                    } else if (bloqueoFin.toDateString() === diaDate.toDateString()) {
                                        // El bloqueo termina en este día pero empieza antes
                                        if (bloqueoFin >= horarioInicio) {
                                            if (bloqueoFin < horarioFin) {
                                                horarioFin = bloqueoFin;
                                            }
                                            while (horarioInicio < horarioFin) {
                                                let disponibilidadFin = new Date(horarioInicio.getTime() + practica * 60000);
                                                if (disponibilidadFin > horarioFin) {
                                                    disponibilidadFin = new Date(horarioFin);
                                                }
                                                intervalos.push({
                                                    tipo: "disponibilidad",
                                                    duracion: practica,
                                                    start: horarioInicio,
                                                    end: disponibilidadFin,
                                                    text: `${formatTime(horarioInicio)} - ${formatTime(disponibilidadFin)}`,
                                                    hora: formatTime(horarioInicio),
                                                });
                                                horarioInicio = new Date(disponibilidadFin);
                                            }
                                        }
                                    } else {
                                        // El bloqueo ni empieza ni termina en este día, crear disponibilidad para todo el día
                                        while (horarioInicio < horarioFin) {
                                            let disponibilidadFin = new Date(horarioInicio.getTime() + practica * 60000);
                                            if (disponibilidadFin > horarioFin) {
                                                disponibilidadFin = new Date(horarioFin);
                                            }
                                            intervalos.push({
                                                tipo: "disponibilidad",
                                                duracion: practica,
                                                start: horarioInicio,
                                                end: disponibilidadFin,
                                                text: `${formatTime(horarioInicio)} - ${formatTime(disponibilidadFin)}`,
                                                hora: formatTime(horarioInicio),
                                            });
                                            horarioInicio = new Date(disponibilidadFin);
                                        }
                                    }
                                }
                            });
                            
                            
                        } else {
                            if (operation === 'create' || operation === 'update') {
                                intervalos.push(bloqueo);
                            }
                        }
                        intervalos.sort((a, b) => new Date(a.start) - new Date(b.start));
    
                        return { ...dia, intervalos };
                    }
                    return dia;
                })
            }
        });
    }

    function updateAgendaCalendar(turno, operation, horarios, practica) {
        const turnoData = {
            ...turno,
            start: new Date(turno.fecha),
            end: new Date(new Date(turno.fecha).getTime() + turno.duracion * 60000),
            hora: turno.horario,
            text: `${turno.horario} - ${formatTime(new Date(new Date(turno.fecha).getTime() + turno.duracion * 60000))}`,
            estado: turno.estado
        };
        
        // Función para obtener el rango de días entre dos fechas
        function getDaysArray(start, end) {
            let arr = [];
            let dt = new Date(start);
            while (dt <= end) {
                arr.push(new Date(dt));
                dt.setDate(dt.getDate() + 1);
            }
            return arr;
        }

        const turnoStart = new Date(turno.fecha);
        const turnoEnd = new Date(turnoStart.getTime() + turno.duracion * 60000);
        const daysArray = getDaysArray(turnoStart, turnoEnd);
        
        setDias(prev => {
            if (!prev) return prev;
            if (!prev.profesional || (prev.profesional && prev.profesional.id !== turno.profesional_id)) return prev;
            return {
                ...prev,
                dias: prev.dias.map(dia => {
                    const diaDate = new Date(dia.fecha);
                    const diaString = diaDate.toDateString();
                    const inTurnoRange = daysArray.some(day => day.toDateString() === diaString);
                    // busco el turno viejo
                    let turnoOld = dia.intervalos.find(intervalo => (intervalo.tipo === "turno" || intervalo.tipo === "sobreturno") && intervalo.id === turno.id);
                    // caso el turno se movio dentro del mismo dia, se cancelo o se creo uno nuevo
                    if (inTurnoRange) {
                        let intervalos = dia.intervalos.filter(intervalo => !(intervalo.tipo === "disponibilidad" || ((intervalo.tipo === "turno" || intervalo.tipo === "sobreturno") && intervalo.id === turno.id)));
                        if (operation === 'create' || (operation === 'update' && turno.estado !== 'Cancelado')) {
                            intervalos.push(turnoData);
                        }
                        
                        // Asegurarse de que los intervalos estén ordenados
                        intervalos.sort((a, b) => new Date(a.start) - new Date(b.start));

                        let slotDuration = practica * 60000; // Convertir a milisegundos
                        let diasNombres = [ 'lunes','martes','miércoles','jueves','viernes','sábado','domingo' ]
                        let diaNombre = diasNombres[diaDate.getDay() - 1]
                        // Calculate free slots
                        let freeSlots = [];
                        horarios.forEach(horario => {
                            if(diaNombre.toLowerCase() !== horario.dia.toLowerCase())
                                return
                            let start = new Date(dia.fecha);
                            start.setHours(...horario.hora_inicio.split(':'), 0);
                            let end = new Date(dia.fecha);
                            end.setHours(...horario.hora_fin.split(':'), 0);

                            let currentStart = start;
                            if(intervalos[0] && intervalos[0].end > currentStart && intervalos[0].start < currentStart){
                                currentStart = intervalos[0].end;
                            }
                            intervalos.forEach(slot => {
                                if( typeof slot.start === "string"){
                                    slot.start = new Date(slot.start);
                                }
                                if( typeof slot.end === "string"){
                                    slot.end = new Date(slot.end);
                                }
                                while (currentStart < slot.start) {
                                    let currentEnd = new Date(currentStart.getTime() + slotDuration);
                                    if (currentEnd <= slot.start) {
                                        let newDisp = {
                                            tipo: "disponibilidad",
                                            duracion: practica,
                                            start: currentStart,
                                            end: currentEnd,
                                            text: `${formatTime(currentStart)} - ${formatTime(currentEnd)}`,
                                            hora: formatTime(currentStart),
                                        }
                                        freeSlots.push(newDisp);
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
                                    let newDisp = {
                                        tipo: "disponibilidad",
                                        duracion: practica,
                                        start: currentStart,
                                        end: currentEnd,
                                        text: `${formatTime(currentStart)} - ${formatTime(currentEnd)}`,
                                        hora: formatTime(currentStart),
                                    }
                                    freeSlots.push(newDisp);
                                }
                                currentStart = currentEnd;
                            }
                        });
                        intervalos = intervalos.concat(freeSlots)
                        // Sort by start time
                        intervalos.sort((a, b) => a.start - b.start);
                        return { ...dia, intervalos };
                    } else {
                        //caso el turno se cambio de dia entonces si esta en el dia filtrado lo borramos
                        if (turnoOld) {
                            dia.intervalos = dia.intervalos.filter(intervalo => !((intervalo.tipo === "turno" || intervalo.tipo === "sobreturno") && intervalo.id == turno.id));
                            let diasNombres = [ 'lunes','martes','miércoles','jueves','viernes','sábado','domingo' ]
                            let diaNombre = diasNombres[diaDate.getDay() - 1]
                            horarios.forEach(horario => {
                                if(diaNombre.toLowerCase() !== horario.dia.toLowerCase())
                                    return
                                if(turnoOld.start instanceof Date){
                                    turnoOld.start = turnoOld.start.toISOString();
                                }
                                if(turnoOld.end instanceof Date){
                                    turnoOld.end = turnoOld.end.toISOString();
                                }
                                let horarioInicio = new Date(`${turnoOld.start.split('T')[0]}T${horario.hora_inicio}`);
                                let intervaloFin = new Date(turnoOld.end);
                                // Crear intervalos durante el turno viejo
                                while (horarioInicio < intervaloFin) {
                                    let disponibilidadFin = new Date(horarioInicio.getTime() + practica * 60000);
                                    if (disponibilidadFin > intervaloFin) {
                                        disponibilidadFin = new Date(intervaloFin);
                                    }
                                    dia.intervalos.push({
                                        tipo: "disponibilidad",
                                        duracion: practica,
                                        start: horarioInicio,
                                        end: disponibilidadFin,
                                        text: `${formatTime(horarioInicio)} - ${formatTime(disponibilidadFin)}`,
                                        hora: formatTime(horarioInicio),
                                    });
                                    horarioInicio = new Date(disponibilidadFin);
                                } 
                            });

                            let intervalos = dia.intervalos.filter( intervalo => intervalo.tipo !== "sobreturno")
                            let sobreturnos = dia.intervalos.filter( intervalo => intervalo.tipo === "sobreturno")

                            // Asegurarse de que los intervalos estén ordenados
                            intervalos.sort((a, b) => new Date(a.start) - new Date(b.start));
                            
                            debugger;
                            // Eliminar intervalos duplicados o solapados
                            let result = [];
                            for (let i = 0; i < intervalos.length; i++) {
                                let fechaAControlar = intervalos[i].tipo !== "disponibilidad" ? new Date(new Date(intervalos[i].start).getTime()) : new Date(intervalos[i].start)
                                let segundaFecha = result.length > 0 ? new Date(result[result.length - 1].end) : null
                                if (i === 0 || fechaAControlar >= segundaFecha) {
                                    result.push(intervalos[i]);
                                } 
                            }
                            dia.intervalos = result.concat(sobreturnos);

                            // Asegurarse de que los intervalos estén ordenados
                            dia.intervalos.sort((a, b) => new Date(a.start) - new Date(b.start));
                        }
                    }
                    return dia;
                })
            }
        });

        // Update setTurnos
        setTurnos(prev => {
            if (!prev) return prev;
            if (prev.profesional && prev.profesional.id !== turno.profesional_id) return prev;
            
            let aux = {...prev}
            // Filtrar turnos previos
            aux.turnos = aux.turnos.filter(t => t.id !== turno.id);

            if (isSameDay(new Date(turno.fecha), new Date(aux.fecha))) {
                if (operation === 'create' || operation === 'update') {
                    aux.turnos.push(turnoData);
                }
                aux.turnos.sort(compararTurnos);
                return aux;
            }
            return aux;
        });
    }
    async function processPaciente(cambios) {
        setDias(prev => {
            if (!prev) return prev;
    
            return {
                ...prev,
                dias: prev.dias.map(dia => {
                    return {
                        ...dia,
                        intervalos: dia.intervalos.map(intervalo => {
                            if ((intervalo.tipo === "turno" || intervalo.tipo === "sobreturno") && intervalo.idPaciente === cambios.idPaciente) {
                                return {
                                    ...intervalo,
                                    nombre: cambios.nombre,
                                    obraSocial: cambios.cobertura,
                                    telefono: cambios.telefono
                                };
                            }
                            return intervalo;
                        })
                    };
                })
            };
        });
    
        setTurnos(prev => {
            if (!prev) return prev;
    
            return {
                ...prev,
                turnos: prev.turnos.map(turno => {
                    if (turno.idPaciente === cambios.idPaciente) {
                        return {
                            ...turno,
                            nombre: cambios.nombre,
                            obraSocial: cambios.cobertura,
                            telefono: cambios.telefono
                        };
                    }
                    return turno;
                })
            };
        });
    }
    
    async function processTurno(data) {
        const response = await fetch(`${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/turnos/${data.turnoId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                authorization: "Bearer " + user.token,
            }
        });

        const result = await response.json();

        if (result.status === "SUCCESS") {
            const turno = result.data;
            const changes = data.changes;

            // Extract necessary information
            const fecha = new Date(turno.fecha).toLocaleDateString('es-ES');
            const hora = turno.horario;
            const nombrePaciente = turno.nombre;
            const doctor = user.rol !== 'profesional' ? `Doctor: ${turno.doctor}` : '';

            // Generate the message based on the operation
            if (data.operation === 'create') {
                let message = `Turno creado para ${nombrePaciente} el ${fecha} a las ${hora}. ${doctor}`;
                toast(message, { type: 'info' });
            } else if (data.operation === 'update') {
                let message = `Turno actualizado para ${nombrePaciente} el ${fecha} a las ${hora}. ${doctor}. Cambios: `;
                let changesMessages = [];

                if (changes.fecha_hora) {
                    const from = new Date(changes.fecha_hora.from).toLocaleString('es-ES');
                    const to = new Date(changes.fecha_hora.to).toLocaleString('es-ES');
                    toast(message + `
                    fecha y hora: de ${from} a ${to}`, { type: 'info' });
                    changesMessages.push(`fecha y hora: de ${from} a ${to}`);
                }

                if (changes.estado) {
                    const from = changes.estado.from;
                    const to = changes.estado.to;
                    if (changes.estado.to === 'Cancelado') {
                        message = `Se canceló el turno para ${nombrePaciente} el ${fecha} a las ${hora}. ${doctor}`;
                        toast(message, { type: 'error' });
                    } else {
                        toast(message + `
                        estado: de ${from} a ${to}`, { type: 'info' });
                    }
                }

                if (changes.nota) {
                    const from = changes.nota.from;
                    const to = changes.nota.to;
                    toast(message + `Se agregó la nota al turno: ${to}`, { type: 'info' });
                }

            }
            updateAgendaCalendar(turno, data.operation, data.horario, data.practica);
        }

    }

    async function processBloqueo(data) {
        if (data.operation === "delete") {
            const fecha = new Date(data.data.start).toLocaleDateString('es-ES');
            const fecha_fin = new Date(data.data.end).toLocaleDateString('es-ES');
            const doctor = user.rol !== 'profesional' ? `Doctor: ${data.data.doctor}` : '';
            let message = `Bloqueo eliminado desde ${fecha} hasta ${fecha_fin}. ${doctor}`;
            toast(message, { type: 'error' });
            return updateCalendarBloqueo(data.data, data.operation, data.horario, data.practica);
        }

        const response = await fetch(`${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/bloqueo/${data.bloqueoId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                authorization: "Bearer " + user.token,
            }
        });

        const result = await response.json();

        if (result.status === "SUCCESS") {
            const bloqueo = result.data;
            // Extract necessary information
            const fecha = new Date(bloqueo.start).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
            const fecha_fin = new Date(bloqueo.end).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
            const doctor = user.rol !== 'profesional' ? `Doctor: ${bloqueo.doctor}` : '';

            // Generate the message based on the operation
            if (data.operation === 'create') {
                let message = `Bloqueo creado desde ${fecha} hasta ${fecha_fin}. ${doctor}`;
                toast(message, { type: 'info' });
            } else if (data.operation === 'update') {
                let message = `Bloqueo actualizado desde ${fecha} hasta ${fecha_fin}. ${doctor}.`;
                toast(message, { type: 'info' });
            }

            updateCalendarBloqueo(bloqueo, data.operation, data.horario, data.practica);

        }

    }

    useEffect(() => {
        let newSocket;
    
        const connectWebSocket = () => {
            if (user && user['wsToken']) {
                const newSocket = new WebSocket(`${process.env.WS_APP_BASE_URL}?token=${user['wsToken']}`);
    
                newSocket.onopen = () => {
                    console.log('WebSocket connected');
                };
    
                newSocket.onmessage = async (event) => {
                    const { codigo, data } = JSON.parse(event.data); //por ahora el codigo es turno sino es el modulo que afecta ahr
    
                    try {
                        if (data.modelo === "turno")
                            await processTurno(data);
                        if (data.modelo === "bloqueo")
                            await processBloqueo(data);
                        if (data.modelo === "paciente")
                            await processPaciente(data.cambios)
                    } catch (error) {
                        console.error('Error fetching turno:', error);
                    }
                };
    
                newSocket.onclose = () => {
                    console.log('WebSocket disconnected. Attempting to reconnect...');
                    setTimeout(connectWebSocket, 5000); // Intentar reconectar después de 5 segundos
                };
    
                newSocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    newSocket.close(); // Cierra el WebSocket en caso de error, lo que desencadenará el onclose
                };
    
                setSocket(newSocket);
            }
        };
    
        connectWebSocket();
    
        return () => {
            if (newSocket) {
                newSocket.close();
            }
        };
    }, [user]);

    const closeWebSocket = () => {
        if (socket) {
            socket.close();
            setSocket(null);
        }
    };

    return (
        <WebSocketContext.Provider value={{ closeWebSocket }}>
            {children}
        </WebSocketContext.Provider>
    );
};