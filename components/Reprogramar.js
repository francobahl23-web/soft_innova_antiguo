'use client'
// React
import React from 'react'

// Context
import { useTurnoContext } from '@/contexts/turno'
import { useUserContext } from '@/contexts/user'

// Components
import Overlay from '@/components_UI/Overlay'
import PopUp from '@/components_UI/PopUp'
import Button from '@/components_UI/Button'
import Loader from '@/components_UI/Loader'
import { checkFetch } from '@/utils/checkFetch'


const Reprogramar = () => {
    const { reprogramando, setReprogramando, filtros, profesional } = useTurnoContext()
    const { user, logOut } = useUserContext()

    const turnoParaEnviar = ( nuevaFecha, nuevoHorario ) => {
        let turnoParaEnviar = { }
        
        let aux = new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth(), nuevaFecha.getDate(), nuevoHorario.split(':')[0], nuevoHorario.split(':')[1])
        turnoParaEnviar.fecha_hora = aux.toISOString()

        return turnoParaEnviar
    }

    const reprogramar = async () => {
        try {
            setReprogramando({
                ...reprogramando,
                enCurso: true,
                error: false,
            })
            
            let turnoListo = turnoParaEnviar(new Date(reprogramando.nuevoHorario.start), reprogramando.nuevoHorario.hora)

            const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/turnos/${reprogramando.id}`,
                {
                    method: "PUT",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        authorization: "Bearer " + user.token,
                    },
                    body: JSON.stringify(turnoListo)
                }
            )
            const json = await response.json()
            checkFetch(json, logOut)
            if (json.status === "SUCCESS")
            {
                setReprogramando( null )
                //if(window) window.location.reload()
            }
            else
                setReprogramando({
                    ...reprogramando,
                    nuevoHorario: null,
                    enCurso: false,
                    error: true,
                })

        } catch (error) {
            console.log(error);
            setReprogramando({
                ...reprogramando,
                nuevoHorario: null,
                enCurso: false,
                error: true,
            })
        }
    }

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return (
        reprogramando && (reprogramando.enCurso || reprogramando.error || reprogramando.nuevoHorario) &&
        <Overlay>
            <PopUp centered={true}>
                <div className='u-1/1 u-flex-column-start-center u-p3--vertical u-p4--horizontal'>
                    {
                    reprogramando.enCurso ?
                        <div className='u-1/1'><Loader text='Reprogramando...'/></div>
                    :
                        reprogramando.nuevoHorario ?
                            <>
                                <p className='u-text--1 u-m2--bottom'>¿Seguro desea reprogramar?</p>
                                <div className='u-1/1 u-flex-column-center-center u-text_align--start u-p4--vertical'>
                                    <p className='u-1/1'><span className='u-text--1 u-color--primary'>Profesional:</span> { user.rol === 'profesional' ? `${profesional.apellido}, ${profesional.nombre}` : `${filtros.profesional.apellido}, ${filtros.profesional.nombre}`}</p>
                                    <p className='u-1/1'>
                                        <span className='u-text--1 u-color--primary'>Fecha anterior: </span>
                                        {capitalizeFirstLetter(new Date(reprogramando.fecha).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        }))}, {reprogramando.hora}
                                    </p>
                                    <p className='u-1/1'>
                                        <span className='u-text--1 u-color--primary'>Fecha nueva: </span>
                                        {capitalizeFirstLetter(new Date(reprogramando.nuevoHorario.start).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        }))}, {new Date(reprogramando.nuevoHorario.start).toLocaleTimeString('es-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className='u-1/1 u-flex-center-center'>
                                    <Button 
                                        text={'Aceptar'} 
                                        clickHandler={
                                            () => {
                                                reprogramar()
                                            }
                                        }
                                    />
                                    <Button text={'Cancelar'} clickHandler={() => setReprogramando({ ...reprogramando, nuevoHorario: null})}/>
                                </div>
                            </>
                        :
                            reprogramando.error &&
                            <>
                                <p className='u-text--1 u-m2--bottom'>
                                    ¡No se pudo asignar el turno en el horario seleccionado!
                                </p>
                                <p className='u-text--1 u-m2--bottom'>
                                    Corrobora que el mismo no se solapa con otros turnos.
                                </p>
                                <div className='u-1/1 u-flex-center-center'>
                                    <Button 
                                        text={'Continuar'} 
                                        clickHandler={
                                            () => {
                                                setReprogramando({ ...reprogramando, error: null})
                                            }
                                        }
                                    />
                                </div>
                            </>
                    }
                </div>
            </PopUp>
        </Overlay>
    )
}

export default Reprogramar