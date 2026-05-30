'use client'
// React
import React, { useState, useRef, useEffect } from 'react'

// Contexts
import { useTurnoContext } from '@/contexts/turno'

// Icons
import { FaLock } from "react-icons/fa"
import { FaLockOpen } from "react-icons/fa"

// Components
import Loader from '@/components_UI/Loader'

const primeraLetraMayus = (string) => {
    let result = ''

    for(let palabra of string.split(' '))
        result += `${palabra.slice(0,1).toUpperCase()}${palabra.slice(1)} `

    return result.trim()
}


const Calendario = () => {
    const [visibleDays, setVisibleDays] = useState(null)
    const calendarRef = useRef(null)
    const { dias, mesesEspañol, setTurno, openTurno, setOpenTurno, filtros, setBloqueo, setOpenBloqueo, setCancelandoBloqueo, reprogramando, setReprogramando } = useTurnoContext()

    const handleTurno = (day, interval) => {
        setOpenBloqueo(false)
        
        if(interval.tipo === 'disponibilidad')
        {
            setTurno((prev) => {
                return(
                    {
                        ...prev,
                        fecha: day.fecha,
                        hora: interval.hora ?? interval.text,
                        id: null,
                    }
                )
            })
        }
        else
        {
            setTurno((prev) => {
                return(
                    {
                        ...prev,
                        fecha: day.fecha,
                        hora: interval.hora,
                        id: interval.id,
                        nombrePaciente: primeraLetraMayus(interval.nombre),
                        nombreProfesional: primeraLetraMayus(interval.doctor),
                        nombrePractica: `${interval.duracion}' - ${primeraLetraMayus(interval.practica)}`,
                        nota: interval.nota,
                        tipo: interval.tipo,
                        onlyView: false,
                        estado: interval.estado,
                        idPaciente: interval.idPaciente,
                        practica_id: interval.practica_id,
                        profesional_id: interval.profesional_id,
                        practica_nombre: interval.practica,
                    }
                )
            })
        }
        setOpenTurno(true)
    }

    const handleReprogramar = (interval) => {
        setReprogramando({
            ...reprogramando,
            nuevoHorario: {...interval}
        })
    }

    const handleBloqueo = (e, day, interval) => {
        e.stopPropagation()

        if(!day)
        {
            setCancelandoBloqueo(interval)
            return
        }

        setOpenTurno(false)
        if(interval && interval.tipo === 'disponibilidad')
            setBloqueo((prev) => {
                return(
                    {
                        profesional: filtros.profesional,
                        fechaDesde: day.fecha,
                        horaDesde: interval.hora,
                        fechaHasta: day.fecha,
                        horaHasta: interval.text.slice(interval.text.length - 5)
                    }
                )
            })
        else
            setBloqueo((prev) => {
                return(
                    {
                        profesional: filtros.profesional,
                        fechaDesde: day.fecha,
                        horaDesde: '00:00',
                        fechaHasta: day.fecha,
                        horaHasta: '23:59',
                    }
                )
            })

        setOpenBloqueo(true)
    }

    useEffect(() => {
        const handleResize = () => {
            if (calendarRef.current && dias.dias) {
                const calendarWidth = calendarRef.current.offsetWidth
                const minWidthPerDay = 160 + 70 // Ancho mínimo por columna
                const maxVisibleDays = Math.min(Math.floor(calendarWidth / minWidthPerDay), 5)
                let aux = []

                for(let dia of dias.dias)
                {
                    if(dia.intervalos && dia.intervalos.length > 0)
                        aux.push(dia)
                    
                    if(maxVisibleDays === aux.length)
                        break
                }

                setVisibleDays(aux)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [dias.dias, calendarRef.current?.offsetWidth, openTurno])
    
    
    return (
        <>
            {
                reprogramando &&
                <div className='c-reprogramandoPopUp' onClick={() =>{setReprogramando(null)}}>
                    <p className='c-reprogramandoPopUp__text'>Reprogramando</p>
                    <p className='c-reprogramandoPopUp__hover'>Cancelar</p>
                </div>   
            }
            <div className='c-daily_calendar' ref={calendarRef}>
                {
                    dias && typeof dias !== 'string' && visibleDays ?
                        <>
                            <div className="c-daily_calendar__header">
                                {
                                    visibleDays.map((day, index) => (
                                        day.intervalos && day.intervalos.length > 0 ?
                                            <div key={index} className="c-daily_calendar__day_header">
                                                {
                                                    !reprogramando && !day.intervalos.find(el => el.tipo === 'turno' || el.tipo === 'sobreturno') && day.intervalos.find(el => el.tipo === 'disponibilidad') &&
                                                    <FaLock className='c-daily_calendar__lock' onClick={(e) => handleBloqueo(e, day, null)}/>
                                                }
                                                <div>
                                                    {day.fecha.getDate()} 
                                                </div>
                                                <div className='u-flex-column-center-start'>
                                                    <p>
                                                        {`${day.nombre.charAt(0).toUpperCase()}${day.nombre.slice(1)}`}
                                                    </p>
                                                    <p>
                                                    {`${mesesEspañol[day.fecha.getMonth()].charAt(0).toUpperCase()}${mesesEspañol[day.fecha.getMonth()].slice(1)}`}{}
                                                    </p>
                                                </div>
                                            </div>
                                        :
                                            <></>
                                    ))
                                }
                            </div>
                            <div className="c-daily_calendar__body">
                                {visibleDays.map((day, dayIndex) => (
                                    day.intervalos && day.intervalos.length > 0 ?
                                        <div key={dayIndex} className="c-daily_calendar__day_column">
                                            {
                                                    day.intervalos.map((interval, index) => {
                                                        if(interval.tipo ==="disponibilidad"){
                                                            return (
                                                                <div key={index} className="c-daily_calendar__day_cell" onClick={() => !reprogramando ? handleTurno(day, interval) : handleReprogramar(interval)}>
                                                                    <div className="c-daily_calendar__time_cell">
                                                                        {interval.text.slice(0, 5)} 
                                                                    </div>
                                                                    {
                                                                        !reprogramando &&
                                                                        <div className="c-daily_calendar__data_cell">
                                                                            <FaLock className='c-daily_calendar__lock' onClick={(e) => handleBloqueo(e, day, interval)}/>
                                                                        </div> 
                                                                    }
                                                                </div>
                                                            )
                                                        }
                                                        else if(interval.tipo==="bloqueo"){
                                                            //ponerle un colorcito rojo
                                                            return (
                                                                <div key={index} className="c-daily_calendar__day_cell">
                                                                    <div className="c-daily_calendar__time_cell">
                                                                        {new Date(interval.start).getHours().toString().padStart(2, '0')}:{new Date(interval.start).getMinutes().toString().padStart(2, '0')}
                                                                    </div>
                                                                    <div className="c-daily_calendar__data_cell">
                                                                        <FaLockOpen className='c-daily_calendar__lock_open' onClick={(e) => !reprogramando ? handleBloqueo(e, null, interval) : null }/>
                                                                    </div> 
                                                                </div>
                                                            )
                                                        } 
                                                        else  {
                                                            return (
                                                                <div key={index} className="c-daily_calendar__day_cell" onClick={ () => !reprogramando ? handleTurno(day, interval) : null }>
                                                                    <div className={`c-daily_calendar__time_cell ${ interval.tipo==="sobreturno" ? 'c-daily_calendar__time_cell--sobreturno' : '' } `}>
                                                                        {interval.text.slice(0, 5)} 
                                                                    </div>
                                                                    <div className="c-daily_calendar__data_cell">
                                                                        <p>{primeraLetraMayus(interval.nombre)}</p>
                                                                        <p>{interval.duracion}' - {primeraLetraMayus(interval.practica)}</p>
                                                                    </div> 
                                                                </div>
                                                            )
                                                        }
                                                    })
                                            }
                                        </div>
                                    :
                                        <></>
                                ))}
                            </div>
                        </>
                    :
                        typeof dias === 'string'?
                            <div className='u-1/1 u-p5--vertical u-flex-column-center-center'>
                                <p className='u-color--red u-text--2 u-m2--bottom'>!Error!</p>
                                <p>No se pudo obtener el calendario del profesional. Verifique el horario laboral del mismo.</p>
                            </div>  
                        :
                            <div className='u-1/1 u-p5--vertical u-flex-center-center'>
                                <Loader text='Cargando turnos...'/>
                            </div>
                }

            </div>
        </>
    )
}

export default Calendario