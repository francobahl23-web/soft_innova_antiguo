// React
import React, { useEffect, useState } from 'react'

// Components
import Input from '@/components_UI/Input'

const HorariosSemanales = ({ programacionDefault, actualizarProgramacion }) => {
    const [programacion, setProgramacion] = useState(programacionDefault ?? {})
    const [diasSeleccionados, setDiasSeleccionados] = useState(
        programacionDefault ? 
            Object.keys(programacionDefault).reduce(( list, key ) => programacionDefault[key].length > 0 ? [...list,key] : list, [])
        :
            []
    )
    
    const manejoCambioDia = (day) => {
        if (diasSeleccionados.includes(day)) {
            setDiasSeleccionados(diasSeleccionados.filter(d => d !== day))
            const nuevaProgramacion = { ...programacion }
            delete nuevaProgramacion[day]
            setProgramacion(nuevaProgramacion)
            //Actualizo porque elimina la programacion
            if(actualizarProgramacion){
                actualizarProgramacion(nuevaProgramacion)
            }
        } else {
            setDiasSeleccionados([...diasSeleccionados, day])
            setProgramacion({
                ...programacion,
                [day]: [{ start: '', end: '' }] 
            })
        }
    }

    const manejoAgregarTiempo = (day) => {
        setProgramacion({
            ...programacion,
            [day]: [...programacion[day], { start: '', end: '' }]
        })
    }

    const manejoQuitarTiempo = (dia, indice) => {
        const nuevoTiempo = programacion[dia].filter((_, i) => i !== indice)
        setProgramacion({
            ...programacion,
            [dia]: nuevoTiempo
        })
        //Actualizo porque elimina una franja horaria
        if(actualizarProgramacion){
            actualizarProgramacion({
                ...programacion,
                [dia]: nuevoTiempo
            })
        }
    }

    const manejoCambioTiempo = (dia, indice, tipo, valor) => {
        const nuevoTiempo = programacion[dia].map((slot, i) =>
            i === indice ? { ...slot, [tipo]: valor } : slot
        )
        setProgramacion({
            ...programacion,
            [dia]: nuevoTiempo
        })
        //Actualizo si se cambia un horario
        if(actualizarProgramacion){
            actualizarProgramacion({
                ...programacion,
                [dia]: nuevoTiempo
            })
        }
    }

    const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const nombresDias = {
        'L': 'Lunes',
        'M': 'Martes',
        'X': 'Miércoles',
        'J': 'Jueves',
        'V': 'Viernes',
        'S': 'Sábado',
        'D': 'Domingo'
    };

    useEffect(() => {
        if(programacionDefault)
        {
            setProgramacion(programacionDefault ?? {})
            setDiasSeleccionados(
                programacionDefault ? 
                    Object.keys(programacionDefault).reduce(( list, key ) => programacionDefault[key].length > 0 ? [...list,key] : list, [])
                :
                    []
            )
        }
    }, [programacionDefault])

    return (
        <div className="c-horario_semanal">
            <div className="c-horario_semanal__dias">
                {
                    dias.map((dia) => (
                        <button
                            key={dia}
                            className={diasSeleccionados.includes(dia) ? 'selected' : ''}
                            onClick={() => manejoCambioDia(dia)}
                        >
                            {dia}
                        </button>
                    ))
                }
            </div>
            <div className="c-horario_semanal__programacion">
                {
                    diasSeleccionados.map((dia) => (
                        <div key={dia}>
                            <p className='u-p2--vertical'>{nombresDias[dia]}</p>
                            {
                                programacion[dia].map((slot, index) => (
                                    <div key={index} className="c-horario_semanal__dia">
                                        <Input
                                            type="time"
                                            defaultValue={slot.start}
                                            handleChange={(val) => manejoCambioTiempo(dia, index, 'start', val)}
                                        />
                                        a
                                        <Input
                                            type="time"
                                            defaultValue={slot.end}
                                            handleChange={(val) => manejoCambioTiempo(dia, index, 'end', val)}
                                        />
                                        {
                                            index === programacion[dia].length - 1 && (
                                                <>
                                                    <button onClick={() => manejoAgregarTiempo(dia)}> + </button>
                                                    <button onClick={() => manejoQuitarTiempo(dia, index)}> - </button>
                                                </>
                                            )
                                        }
                                    </div>
                                ))
                            }
                            {
                                programacion[dia].length === 0 && (
                                    <button onClick={() => manejoAgregarTiempo(dia)}> + </button>
                                )
                            }
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default HorariosSemanales
