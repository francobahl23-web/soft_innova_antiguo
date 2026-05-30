'use client'
// React
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// components
import Overlay from '@/components_UI/Overlay'
import Datalist from '@/components_UI/Datalist'
import Button from '@/components_UI/Button'
import Input from '@/components_UI/Input'
import Loader from '@/components_UI/Loader'

// context
import { useTurnoContext } from '@/contexts/turno'
import { useUserContext } from '@/contexts/user'

// Icons
import { IoMdClose } from "react-icons/io"
import Textarea from '@/components_UI/Textarea'
import PopUp from '@/components_UI/PopUp'
import { checkFetch } from '@/utils/checkFetch'


const NuevoBloqueo = () => {
    const [error, setError] = useState({
        value: false,
        mensaje: ''
    })
    const [loading, setLoading] = useState(false)
    const { bloqueo, setBloqueo, openBloqueo, setOpenBloqueo, profesionales, profesional } = useTurnoContext()
    const { user, logOut } = useUserContext()
    const router = useRouter()

    const handleDatalist = (val, key) => {
        setBloqueo({
            ...bloqueo,
            [`${key}`]: val,
        })
    }

    const bloqueoParaEnviar = ( bloqueo ) => {
        let bloqueoParaEnviar = { }
        
        bloqueoParaEnviar.profesional_id = profesional ? profesional.id : bloqueo.profesional ? bloqueo.profesional.id : null
        bloqueoParaEnviar.fecha_hora = null

        if(bloqueo.fechaDesde && bloqueo.horaDesde)
        {
            let aux = new Date(bloqueo.fechaDesde.getFullYear(), bloqueo.fechaDesde.getMonth(), bloqueo.fechaDesde.getDate(), bloqueo.horaDesde.split(':')[0], bloqueo.horaDesde.split(':')[1])
            bloqueoParaEnviar.fecha_hora_desde = aux.toISOString()
        }

        if(bloqueo.fechaHasta && bloqueo.horaHasta)
        {
            let aux = new Date(bloqueo.fechaHasta.getFullYear(), bloqueo.fechaHasta.getMonth(), bloqueo.fechaHasta.getDate(), bloqueo.horaHasta.split(':')[0], bloqueo.horaHasta.split(':')[1])
            bloqueoParaEnviar.fecha_hora_hasta = aux.toISOString()
        }

        return bloqueoParaEnviar
    }
    
    const validar = ( bloqueo ) => {
        
        if (!bloqueo.profesional_id)
        {
            setError({
                value: true,
                mensaje: "Falta seleccionar el profesional."
            })
            return false
        }

        if (!bloqueo.fecha_hora_desde)
        {
            setError({
                value: true,
                mensaje: "Falta seleccionar la fecha de inicio o hora del bloqueo."
            })
            return false
        }

        if (!bloqueo.fecha_hora_hasta)
        {
            setError({
                value: true,
                mensaje: "Falta seleccionar la fecha de fin o hora del bloqueo."
            })
            return false
        }

        return true
    }

    const crearBloqueo = () => {
        const crear = async () => {
            try {
                setLoading(true)
                let bloqueoListo = bloqueoParaEnviar(bloqueo)
    
                if(!validar(bloqueoListo))
                {
                    setLoading(false)
                    return
                }
    
                const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/bloqueo`,
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            authorization: "Bearer " + user.token,
                        },
                        body: JSON.stringify(bloqueoListo)
                    }
                )
                const json = await response.json()
                checkFetch(json, logOut)
                setLoading(false)
                if (json.status === "SUCCESS") 
                {
                    setOpenBloqueo( prev => !prev )
                    //if(window) window.location.reload()
                }
                else
                {
                    setError({
                        value: true,
                        mensaje: json.message ?? 'Ocurrio un erro al crear el bloqueo.'
                    })
                }

            } catch (error) {
                console.log(error)
                setError({
                    value: true,
                    mensaje: 'Ocurrio un error, vuelva a intentar luego.'
                })
                setLoading(false)
            }
        }
        crear()
    }

    useEffect(() => {
        setError({
            value: false,
            mensaje: ''
        })
    }, [])

    return (
        <>
            {
                openBloqueo &&
                <Overlay>
                    <div className='c-nuevo_bloqueo'>
                        <IoMdClose 
                            className='u-cursor--pointer u-text--1 u-absolute--top_right' 
                            onClick={() => {
                                setOpenBloqueo( prev => !prev ) 
                            }}
                        />
                        <h2 className='u-color--primary u-m4--bottom'>Bloqueo</h2>
                        {
                            !profesional &&
                            <div className='u-flex-column-center-start'>
                                <span>Profesional</span>
                                <div className='u-1/1 u-flex-center-center'>
                                    <Datalist
                                        className={'u-1/1'}
                                        list={ profesionales } 
                                        defaultOption={ !bloqueo.profesional ? '' : typeof bloqueo.profesional === 'string' ? { value: bloqueo.profesional } : bloqueo.profesional} 
                                        setter={(val) => handleDatalist(val, "profesional")}
                                    />
                                    <IoMdClose className='u-color--red u-cursor--pointer' onClick={() => handleDatalist(null, "profesional")}/>
                                </div>
                            </div>
                        }
                        <div className='c-nuevo_bloqueo__item c-nuevo_bloqueo__hora'>
                            <div className='u-flex-column-center-start'>
                                <span>Fecha Inicio</span>
                                <Input className={'u-1/1'} type={'date'} defaultValue={bloqueo.fechaDesde} handleChange={(val) => setBloqueo({...bloqueo, fechaDesde: val})}/>
                            </div>
                            <div className='u-flex-column-center-start'>
                                <span>Hora</span>
                                <Input className={'u-1/1'} type={'time'} defaultValue={bloqueo.horaDesde} handleChange={(val) => setBloqueo({...bloqueo, horaDesde: val})}/>
                            </div>
                        </div>
                        <div className='c-nuevo_bloqueo__item c-nuevo_bloqueo__hora'>
                            <div className='u-flex-column-center-start'>
                                <span>Fecha Fin</span>
                                <Input className={'u-1/1'} type={'date'} defaultValue={bloqueo.fechaHasta} handleChange={(val) => setBloqueo({...bloqueo, fechaHasta: val})}/>
                            </div>
                            <div className='u-flex-column-center-start'>
                                <span>Hora</span>
                                <Input className={'u-1/1'} type={'time'} defaultValue={bloqueo.horaHasta} handleChange={(val) => setBloqueo({...bloqueo, horaHasta: val})}/>
                            </div>
                        </div>
                        {
                            loading ?
                                <div className='c-nuevo_bloqueo__item c-nuevo_bloqueo__end c-nuevo_bloqueo__item--right'>
                                    <Loader text={'Bloqueando...'} />
                                </div>
                            :
                                <div className='c-nuevo_bloqueo__item c-nuevo_bloqueo__end c-nuevo_bloqueo__item--right u-flex-column-center-end u-m4--top'>
                                    {
                                        error.value &&
                                        <div className='c-nuevo_bloqueo__item c-nuevo_bloqueo__item--right'>
                                            <p className='u-color--red'>{'El bloqueo se solapa con turnos reservados.'}</p>
                                        </div>
                                    }
                                    <Button 
                                        text={'Bloquear horario'} 
                                        clickHandler={ crearBloqueo }
                                    />
                                </div>
                        }
                    </div>
                </Overlay>
            }
        </>
    )
}

export default NuevoBloqueo