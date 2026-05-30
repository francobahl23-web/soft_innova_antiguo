'use client'
// React
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// context
import { useTurnoContext } from '@/contexts/turno'
import { usePacienteContext } from '@/contexts/paciente'
import { useUserContext } from '@/contexts/user'

// Utils
import { checkFetch } from '@/utils/checkFetch'

// Icons
import { IoMdClose } from "react-icons/io"

// components
import Overlay from '@/components_UI/Overlay'
import Datalist from '@/components_UI/Datalist'
import Button from '@/components_UI/Button'
import Input from '@/components_UI/Input'
import Loader from '@/components_UI/Loader'
import Textarea from '@/components_UI/Textarea'
import PopUp from '@/components_UI/PopUp'
import Select from '@/components_UI/Select'


const estados = [
    {id: 1, value: 'Reservado'},
    {id: 2, value: 'Esperando'},
    {id: 3, value: 'En Consulta'},
    {id: 4, value: 'Atendido'},
    {id: 5, value: 'Cancelado'},
    {id: 6, value: 'Ausente'},
]


const NuevoTurno = () => {
    const [error, setError] = useState({
        value: false,
        mensaje: ''
    })
    const [loading, setLoading] = useState(false)
    const [cambioFecha, setCambioFecha] = useState(false)
    const [accion, setAccion] = useState({
        value: false,
        mensaje: '',
        accion: null
    })
    const [esSobreTurno, setEsSobreTurno] = useState(false)
    const { turno, setTurno, openTurno, setOpenTurno, filtros, setReprogramando, profesionales, profesional } = useTurnoContext()
    const { setOpenPaciente, openPaciente } = usePacienteContext()
    const { user, logOut } = useUserContext()
    const debounceTimeout = useRef(null)
    const router = useRouter()

    const handleDatalist = (val, key) => {
        let aux = null
        if(typeof val === 'string')
            aux = {
                ...turno,
                [`${key}Text`]: val
            }
        else
            aux = {
                ...turno,
                [`${key}Text`]: val ? val.value : '',
                [`${key}`]: val,
            }
        
        if(key === 'paciente')
            aux.coberturaText = ''

        if(key === 'profesional')
        {
            aux.practicaText = ''
            aux.practica = null
        }
            
        setTurno(aux)
    }
    
    const minutesToTime = (duracion) => {
        let hours = Math.floor(duracion/60);
        if(hours <= 9){
            hours = "0"+hours
        }
        let minutes = duracion%60;
        if(minutes <= 9){
            minutes= "0"+minutes
        }
        return `${hours}:${minutes}`;
    }
    
    const timeToMinutes = (time) => {
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    const buscar = async ( ruta, searchValue, setter = null ) => {
        try {
            const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/${ruta}/search?searchValue=${searchValue}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        authorization: "Bearer " + user.token,
                    },
                }
            )
            const json = await response.json()
            checkFetch(json, logOut)
            if (json.status === "SUCCESS") {
                if(json.data[ruta].length && json.data[ruta].length > 0)
                    setter(json.data)
                else
                    setter({pacientes: []})
            } 
            else
                setter({pacientes: []})
        } catch (error) {
            console.log(error)
            setter({pacientes: []})
        }
    }

    const turnoParaEnviar = ( turno, crear = true ) => {
        let turnoParaEnviar = { }
        
        if(crear)
        {
            turnoParaEnviar.profesional_id = turno.profesional ? turno.profesional.id : null
            turnoParaEnviar.paciente_id = turno.paciente ? turno.paciente.id : null
            turnoParaEnviar.cobertura_id = turno.cobertura ? turno.cobertura.id : null
            turnoParaEnviar.clinica_id = turno.profesional && turno.profesional.clinicas ? turno.profesional.clinicas[0].id : turno.profesional.clinica.id ?? null
        }

        turnoParaEnviar.practica_id = turno.practica ? turno.practica.id : null
        turnoParaEnviar.duracion = turno.practica ? timeToMinutes(turno.practica.duracion_moda) : null

        if(turno.fecha && turno.hora && (cambioFecha || crear))
        {
            let aux = new Date(turno.fecha.getFullYear(), turno.fecha.getMonth(), turno.fecha.getDate(), turno.hora.split(':')[0], turno.hora.split(':')[1])
            turnoParaEnviar.fecha_hora = aux.toISOString()
        }
        turnoParaEnviar.nota = turno.nota ? turno.nota : null
        turnoParaEnviar.tipo = turno.tipo ? turno.tipo : 'turno'
        turnoParaEnviar.estado = turno.estado ?? null
        
        if(!turnoParaEnviar.estado)
            delete turnoParaEnviar.estado

        return turnoParaEnviar
    }

    const validar = ( turno, crear = true ) => {
        
        if (!turno.profesional_id && crear)
        {
            setError({
                value: true,
                mensaje: "Falta seleccionar el profesional."
            })
            return false
        }
        
        if (!turno.paciente_id && crear)
        {
            setError({
                value: true,
                mensaje: "Falta seleccionar el paciente."
            })
            return false
        }

        if (!turno.fecha_hora && crear)
        {
            setError({
                value: true,
                mensaje: "Falta seleccionar la fecha o hora del turno."
            })
            return false
        }

        if (!turno.practica_id)
        {
            setError({
                value: true,
                mensaje: "Falta seleccionar la practica del turno."
            })
            return false
        }

        return true
    }

    const crearTurno = () => {
        const crear = async () => {
            try {
                setLoading(true)
                let turnoListo = turnoParaEnviar(turno)
                if(!validar(turnoListo))
                {
                    setLoading(false)
                    return
                }
    
                const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/turnos`,
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            authorization: "Bearer " + user.token,
                        },
                        body: JSON.stringify(turnoListo)
                    }
                )
                const json = await response.json()
                setLoading(false)
                checkFetch(json, logOut)
                if (json.status === "SUCCESS") 
                {
                    setOpenTurno( prev => !prev )
                }
                else
                {
                    setError({
                        value: true,
                        mensaje: json.message ?? 'Ocurrio un erro al crear el turno.'
                    })
                }

            } catch (error) {
                console.log(error);
                setError({
                    value: true,
                    mensaje: 'Ocurrio un error, vuelva a intentar luego.'
                })
                setLoading(false)
            }
        }
        crear()
    }

    const editarTurno = () => {
        const editar = async () => {
            try {
                setLoading(true)
                let turnoListo = turnoParaEnviar(turno, false)
    
                if(!validar(turnoListo, false))
                {
                    setLoading(false)
                    return
                }
                
                const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/turnos/${turno.id}`,
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
                setLoading(false)
                if (json.status === "SUCCESS")
                {
                    setOpenTurno( prev => !prev )
                }
                else
                {
                    setError({
                        value: true,
                        mensaje: json.message ?? 'Ocurrio un erro al crear el turno.'
                    })
                    setAccion({ value: false, text: '', accion: null })
                }

            } catch (error) {
                console.log(error)
                setError({
                    value: true,
                    mensaje: 'Ocurrio un error, vuelva a intentar luego.'
                })
                setLoading(false)
                setAccion({ value: false, text: '', accion: null })
            }
        }
        editar()
    }

    const cancelarTurno = () => {
        setOpenTurno((prev) => !prev)
        const cancelar = async () => {
            try {
                const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/turnos/${turno.id}`,
                    {
                        method: "PUT",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            authorization: "Bearer " + user.token,
                        },
                        body: JSON.stringify({ estado: 'Cancelado' })
                    }
                )
                let json = await response.json()
                checkFetch(json, logOut)
                //if(window) window.location.reload()
            } catch (error) { console.log(error); setAccion({ value: false, text: '', accion: null }) }
        }
        cancelar( )
    }
    
    const showEstado = () => {
        let fecha = new Date(turno.fecha)
        let actual = new Date()

        return fecha.getDate() === actual.getDate() && fecha.getMonth() === actual.getMonth() && fecha.getFullYear() === actual.getFullYear()
    }

    useEffect(() => {
        if(turno.pacienteText.length > 2)
        {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }

            debounceTimeout.current = setTimeout(() => {
                buscar(
                    'pacientes',
                    turno.pacienteText,
                    (pacientes) => {
                        setTurno((prevTurno) => {
                            return{
                                ...prevTurno,
                                pacienteList: pacientes.pacientes.map((ele) => ({
                                    ...ele,
                                    value: `${ele.apellido}, ${ele.nombre} ${ele.dni ? `(${ele.dni})` : ''}`
                                }))
                            }
                        })
                        
                    }
                );
            }, 300);
        }
        
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [turno.pacienteText])

    useEffect(() => {
        if(!turno.id)
        {
            let aux = {
                fecha: turno.fecha,
                hora: turno.hora,
                pacienteText: '',
                pacienteList: [],
                paciente: null,
                profesionalText: '',
                profesionalList: [],
                profesional: null,
                practicaText: '',
                practica: null,
                coberturaText: '',
                cobertura: null,
                nota:  '',
                tipo: 'turno'
            }

            if(profesional)
            {
                aux.profesional = profesional
            }
            else if(filtros && filtros.profesional)
            {
                aux.profesional = filtros.profesional
                aux.profesionalText = filtros.profesional.value
            }

            setTurno(aux)
        }
        else
        {
            let profesionalAux
            if(profesional)
                profesionalAux = profesional
            else
                profesionalAux = profesionales.find( el => el.id === turno.profesional_id)
            let practicaAux = profesionalAux.practicas.find( el => turno.practica_id === el.id )
            
            if(practicaAux === undefined)
                practicaAux = profesionalAux.practicas.find( el => turno.practica_nombre.trim().toLowerCase() === el.nombre.trim().toLowerCase() )

            if(practicaAux !== undefined)
            {
                setTurno({
                    ...turno,
                    profesional: profesionalAux,
                    practica: { ...practicaAux, value: `${practicaAux.nombre} (${practicaAux.duracion_moda})` },
                    practicaText: `${practicaAux.nombre} (${practicaAux.duracion_moda})`
                })
            }
            else
            {
                setTurno({
                    ...turno,
                    profesional: profesionalAux,
                    practica: null,
                    practicaText: ``
                })
            }

        }

        setError({
            value: false,
            mensaje: ''
        })
        setLoading(false)
        setAccion({ value: false, text: '', accion: null })
        setCambioFecha(false)
    }, [filtros, openTurno, profesional])

    useEffect(() => {
        if(openTurno && turno && turno.tipo === 'sobreturno')
            setEsSobreTurno(true)
        else if(openTurno && turno)
            setEsSobreTurno(false)

        if(!openTurno)
            setTurno((prev) => ({
                ...prev,
                id: null,
                fecha: null,
                hora: null,
            }))
    }, [openTurno])
    
    return (
        <>
            {
                openTurno &&
                <Overlay>
                    {
                        accion.value &&
                        <Overlay>
                            <PopUp centered={true}>
                                <div className='u-1/1 u-flex-column-start-center u-p3--vertical'>
                                    <p className='u-text--1 u-m2--bottom'>{accion.text}</p>
                                    <div className='u-1/1 u-flex-end-center'>
                                        <Button 
                                            text={'Aceptar'} 
                                            clickHandler={
                                                () => {
                                                    setAccion({ value: false, text: '', accion: null })
                                                    accion.accion()
                                                }
                                            }
                                        />
                                        <Button text={'Cancelar'} clickHandler={() => setAccion({ value: false, text: '', accion: null })}/>
                                    </div>
                                </div>
                            </PopUp>
                        </Overlay>
                    }
                    <div className='c-nuevo_turno'>
                        <IoMdClose 
                            className='u-cursor--pointer u-text--1 u-absolute--top_right' 
                            onClick={() => {
                                setOpenTurno( prev => !prev ) 
                            }}
                        />
                        <h2 className='u-color--primary'>Turno</h2>
                        {
                            user.rol !== 'profesional' &&
                            <div className='c-nuevo_turno__item'>
                                <div className='u-flex-column-center-start'>
                                    <span>Profesional</span>
                                    {
                                        turno.id ?
                                            <Input className={'u-1/1'} defaultValue={turno.nombreProfesional} isReadOnly={true}/>
                                        :
                                            <div className='u-1/1 u-flex-center-center'>
                                                <Datalist
                                                    className={'u-1/1'}
                                                    list={ profesionales } 
                                                    defaultOption={ typeof turno.profesionalText === 'string' ? { value: turno.profesionalText } : turno.profesionalText } 
                                                    setter={(val) => handleDatalist(val, "profesional")}
                                                />
                                                <IoMdClose className='u-color--red u-cursor--pointer' onClick={() => handleDatalist(null, "profesional")}/>
                                            </div>
                                    }
                                </div>
                            </div>
                        }
                        {
                            (turno.profesional || (turno.id && turno.practica)) &&
                            <div className='c-nuevo_turno__item'>
                                <div className='u-flex-column-center-start'>
                                    <span>Practica</span>
                                    <div className='u-1/1 u-flex-center-center'>
                                        <Datalist
                                            className={'u-1/1'}
                                            list={ turno.profesional?.practicas.map((el) => { return ({ ...el, value: `${el.nombre} (${el.duracion_moda})` }) }) } 
                                            defaultOption={ { value: turno.practicaText } } 
                                            setter={(val) => handleDatalist(val, "practica")}
                                        />
                                        <IoMdClose className='u-color--red u-cursor--pointer' onClick={() => handleDatalist(null, "practica")}/>
                                    </div>
                                </div>
                            </div>
                        }
                        <div className='c-nuevo_turno__item'>
                            <div className='u-flex-column-center-start'>
                                <span>Paciente</span>
                                <div className='u-1/1 u-flex-center-center'>
                                    {
                                        turno.id ?
                                            <Input className={'u-flex--1'} defaultValue={turno.nombrePaciente} isReadOnly={true}/>
                                        :
                                            <>
                                                <Datalist
                                                    className={'u-1/1'}
                                                    list={ turno.pacienteList } 
                                                    defaultOption={ { value: turno.pacienteText } } 
                                                    setter={(val) => handleDatalist(val, "paciente")}
                                                    filter={false}
                                                />
                                                <IoMdClose className='u-color--red u-cursor--pointer' onClick={() => handleDatalist(null, "paciente")}/>
                                            </>
                                    }
                                    <Button 
                                        text={ (turno.paciente && turno.paciente.id) || turno.idPaciente ? 'Editar' : 'Crear'} 
                                        clickHandler={() => {
                                            (turno.paciente && turno.paciente.id) || turno.idPaciente ? setOpenPaciente(turno.idPaciente ?? turno.paciente.id) : setOpenPaciente(true)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        {
                            !turno.id && turno.paciente && turno.paciente.coberturas.length > 0 ?
                                <div className='c-nuevo_turno__item'>
                                    <div className='u-flex-column-center-start'>
                                        <span>Obra Social</span>
                                        <Datalist
                                            className={'u-1/1'}
                                            list={ turno.paciente.coberturas.map((el) => { return ({ ...el, value: el.nombre }) }) } 
                                            defaultOption={ { value: turno.coberturaText } } 
                                            setter={(val) => handleDatalist(val, "cobertura")}
                                        />
                                    </div>
                                </div>
                            :
                                <></>
                        }
                        <div className='c-nuevo_turno__item c-nuevo_turno__hora'>
                            <div className='u-flex-column-center-start'>
                                <span>Fecha</span>
                                <Input className={'u-1/1'} type={'date'} defaultValue={turno.fecha} handleChange={(val) => {setTurno({...turno, fecha: val}); setCambioFecha(true) }}/>
                            </div>
                            <div className='u-flex-column-center-start'>
                                <span>Hora</span>
                                <Input className={'u-1/1'} type={'time'} defaultValue={turno.hora} handleChange={(val) => { setTurno({...turno, hora: val}); setCambioFecha(true) }}/>
                            </div>
                        </div>
                        {
                            turno.id &&
                            <div className='c-nuevo_turno__item c-nuevo_turno__hora'>
                                <div className='u-flex-column-center-start'>
                                    <span>Estado</span>
                                    {
                                        !showEstado() ?
                                            <Input className={'u-1/1'} defaultValue={turno.estado} isReadOnly={true}/>
                                        :
                                            <Select className={'u-1/1'} defaultOption={{value: turno.estado}} options={estados} handleChange={(val) => setTurno({...turno, estado: val.value})}/>

                                    }
                                </div>
                            </div>
                        }
                        <div className='c-nuevo_turno__item c-nuevo_turno__hora'>
                            <div className='u-flex-column-center-start'>
                                <span>Nota</span>
                                <Textarea className={'u-1/1'} defaultValue={turno.nota} handleChange={(val) => setTurno({...turno, nota: val})}/>
                            </div>
                        </div>
                        <div className='c-nuevo_turno__item c-nuevo_turno__hora'>
                            <div className='u-flex-end-start'>
                                <Input className={'u-m2--right'} type={'checkbox'} defaultChecked={turno.tipo === 'sobreturno'} handleChange={(val) => setTurno({...turno, tipo: val ? 'sobreturno' : 'turno'})}/>
                                <span className='u-cursor--pointer' onClick={() => setTurno({...turno, tipo: turno.tipo === 'turno' ? 'sobreturno' : 'turno'})}>Sobreturno</span>
                            </div>
                        </div>
                        {
                            loading ?
                                <div className='c-nuevo_turno__item c-nuevo_turno__end c-nuevo_turno__item--right'>
                                    <Loader text={turno.id ? 'Editando...' : 'Creando...'} />
                                </div>
                            :
                                <div className='c-nuevo_turno__item c-nuevo_turno__end c-nuevo_turno__item--right u-flex-column-center-end'>
                                    {
                                        error.value &&
                                        <div className='c-nuevo_turno__item c-nuevo_turno__item--right'>
                                            <p className='u-color--red'>{error.mensaje}</p>
                                        </div>
                                    }
                                    <Button 
                                        text={turno.id ? 'Actualizar' : 'Dar turno'} 
                                        clickHandler={
                                            turno.id ? 
                                                () => setAccion({ value: true, text: '¿Estas seguro que deseas editar el turno?', accion: editarTurno})
                                            : 
                                                crearTurno
                                        }
                                    />
                                    {
                                        turno.id && !turno.onlyView && 
                                            <Button text={'Reprogramar'} clickHandler={() => {setOpenTurno(false); setReprogramando(turno);}}/>
                                    }
                                    {
                                        turno.id &&
                                            <Button text={'Cancelar Turno'} clickHandler={() => setAccion({ value: true, text: '¿Estas seguro que deseas cancelar el turno?', accion: cancelarTurno})}/>
                                    }
                                </div>
                        }
                        {/*<div className='c-nuevo_turno__item c-nuevo_turno__item--right'>
                            <Button className={''} text={'Bloquear Horario'}/>
                        </div>*/}
                    </div>
                </Overlay>
            }
        </>
    )
}

export default NuevoTurno