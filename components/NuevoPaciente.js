'use client'
// React
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// context
import { usePacienteContext } from '@/contexts/paciente'
import { useUserContext } from '@/contexts/user'
import { useTurnoContext } from '@/contexts/turno'

// Icons
import { IoMdClose } from "react-icons/io"
import { FaWhatsapp } from "react-icons/fa";

// Utils
import { checkFetch } from '@/utils/checkFetch'

// components
import Button from '@/components_UI/Button'
import Input from '@/components_UI/Input'
import Select from '@/components_UI/Select'
import Loader from '@/components_UI/Loader'
import Turno from './Turno'


const NuevoPaciente = ({ id = null, toClose = false }) => {
    const [paciente, setPaciente] = useState({
        nombre: '',
        apellido: '',
        dni: null,
        fecha_nacimiento: null,
        genero: null,
        obraSocial: '',
        obraSocialNum: null,
        telefonos: [''],
        emails: [''],
    })
    const [error, setError] = useState({
        value: false,
        mensaje: '',
    })
    const [accion, setAccion] = useState({
        text: '',
        value: false
    })
    const [loading, setLoading] = useState( id ? true : false )
    const { openPaciente, setOpenPaciente } = usePacienteContext()
    const { setTurno } = useTurnoContext()
    const { user, logOut } = useUserContext()
    const pathname = usePathname()
    const router = useRouter()

    const handleChange = (val, key) => {
        let aux = {...paciente, [key]: val}
        setPaciente(aux)
    }

    const handleChangeArray = (val, key, index) => {
        let aux = { ...paciente }
        let auxArray = [ ...paciente[key] ]
        auxArray[index] = val
        aux[key] = auxArray
        setPaciente(aux)
    }

    const producirInputs = (handleChange = null, cantInputs = 1, setCantInputs = null, values = [], type = '', placeholder = '') => {
        let result = []
        
        for(let i = 0; i < cantInputs; i++)
        {
            result.push(
                <div className='u-1/1 u-flex-column-center-start u-m2--vertical' key={i}>
                    <div className='u-flex-center-center'>
                        <p className='u-text--0'>
                            {`${placeholder} ${i + 1}`}
                        </p>
                        {
                            values[i] && placeholder.trim().toLowerCase().includes('telefono') &&
                            <a href={`http://web.whatsapp.com/send?phone=${values[i]}`} target="_blank">
                                <FaWhatsapp/>
                            </a>
                        }
                    </div>
                    <div className='u-1/1 u-flex-start-center'>
                        <Input className='u-1/1' handleChange={(val) => handleChange(val, i)} defaultValue={values[i] ?? null}/>
                        <div style={{ width: '75px' }}>
                            {
                                cantInputs > 1 && 
                                <Button text={'-'} clickHandler={() => setCantInputs(i)}/>
                            }
                        </div>
                        <div style={{ width: '75px' }}>
                            {
                                i === cantInputs - 1 &&
                                <Button text={'+'} clickHandler={() => setCantInputs(i + 1)}/>
                            }
                        </div>
                    </div>
                </div>
            )
        }

        return result
    }

    const validar = (object) => {
        if (!object.nombre) {
            return 'El campo "Nombres" es obligatorio.'
        }

        if (!object.apellido) {
            return 'El campo "Apellidos" es obligatorio.'
        }

        return true
    }

    const crear = async (object) => {
        setAccion({
            text: 'Creando paciente...',
            value: true
        })
        try {
            let validate = validar(object)
            if(validate !== true)
            {
                setError({
                    value: true,
                    mensaje: validate
                })
                setAccion({
                    text: '',
                    value: false
                })
                return
            }

            let objectToSend = { 
                ...object, 
                contactos: [], 
                coberturas: [], 
            }

            if(objectToSend.genero)
                objectToSend.genero = object.genero.value ? object.genero.value : object.genero

            if(objectToSend.obraSocial && objectToSend.obraSocial !== '')
                objectToSend.coberturas.push({ nombre: objectToSend.obraSocial, numero: objectToSend.obraSocialNum ?? '' })
            
            if(objectToSend.telefonos.length > 0 && objectToSend.telefonos[0] !== '')
                objectToSend.contactos = objectToSend.contactos.concat(objectToSend.telefonos.map(el => { return({ tipo: 'telefono', valor: el }) }))

            if(objectToSend.emails.length > 0 && objectToSend.emails[0] !== '')
                objectToSend.contactos = objectToSend.contactos.concat(objectToSend.emails.map(el => { return({ tipo: 'email', valor: el }) }))

            const response = await fetch(`${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL }/pacientes`,
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  authorization: "Bearer "+ user.token,
                },
                body: JSON.stringify(objectToSend)
              }
            );
            const json = await response.json();
            checkFetch(json, logOut)
            if(json.status === 'SUCCESS')
            {
                if(pathname.includes('paciente'))
                    router.push("/paciente")
                else
                {
                    setTurno(prev => ({
                        ...prev,
                        paciente: json.data,
                        pacienteText: `${objectToSend.apellido}, ${objectToSend.nombre} ${objectToSend.dni ? `(${objectToSend.dni})` : ''}`,
                        cobertura: null,
                        coberturaText: '',
                    }))
                    setOpenPaciente(false)
                }
            }
            else
            {
                setError({
                    value: true,
                    mensaje: json.message
                })
            }
        } catch (error) {
            console.log(error)
            setError({
                value: true,
                mensaje: 'Ocurrio un error, vuelva a intentar luego.'
            })
        }
        setAccion({
            text: '',
            value: false
        })
    }

    const editar = async (object) => {
        setAccion({
            text: 'Editando paciente...',
            value: true
        })
        try {
            let validate = validar(object)
            if(validate !== true)
            {
                setError({
                    value: true,
                    mensaje: validate
                })
                setAccion({
                    text: '',
                    value: false
                })
                return
            }

            let objectToSend = { 
                ...object, 
                genero: object.genero.value ? object.genero.value : object.genero,
                contactos: [], 
                coberturas: [], 
            }

            if(objectToSend.obraSocial && objectToSend.obraSocial !== '')
                objectToSend.coberturas.push({ nombre: objectToSend.obraSocial, numero: objectToSend.obraSocialNum ?? '' })

            objectToSend.contactos = objectToSend.contactos.concat(objectToSend.telefonos.map(el => { return({ tipo: 'telefono', valor: el }) }))
            objectToSend.contactos = objectToSend.contactos.concat(objectToSend.emails.map(el => { return({ tipo: 'email', valor: el }) }))

            const response = await fetch(`${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL }/pacientes/${paciente.id}`,
              {
                method: "PUT",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  authorization: "Bearer "+ user.token,
                },
                body: JSON.stringify(objectToSend)
              }
            );
            const json = await response.json();
            checkFetch(json, logOut)
            if(json.status === 'SUCCESS')
            {
                if(pathname.includes('paciente'))
                    router.push("/paciente")
                else
                {
                    setTurno(prev => ({
                        ...prev,
                        paciente: json.data,
                        pacienteText: `${objectToSend.apellido}, ${objectToSend.nombre} ${objectToSend.dni ? `(${objectToSend.dni})` : ''}`,
                        cobertura: null,
                        coberturaText: '',
                    }))
                    setOpenPaciente(null)
                }
            }
            else
            {
                setError({
                    value: true,
                    mensaje: json.message
                })
            }
        } catch (error) {
            console.log(error)
            setError({
                value: true,
                mensaje: 'Ocurrio un error, vuelva a intentar luego.'
            })
        }
        setAccion({
            text: '',
            value: false
        })
    }

    const buscarPaciente = async (id) => {
        setLoading(true)

        try {
            const response = await fetch(`${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL }/pacientes/${id}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        authorization: "Bearer " + user.token,
                    },
                }
            );
            const json = await response.json();
            checkFetch(json, logOut)
            if(json.status === 'SUCCESS')
            {
                let emailsBD = json.data.contactos.filter((el) => el.tipo === 'email').map(el => el.valor)
                let telefonosBD = json.data.contactos.filter((el) => el.tipo === 'telefono').map(el => el.valor)
                
                setPaciente({ 
                    ...json.data, 
                    genero: { value: json.data.genero ? json.data.genero.charAt(0).toUpperCase() + json.data.genero.slice(1).toLowerCase() : ""},
                    obraSocial: json.data.coberturas && json.data.coberturas.length > 0? json.data.coberturas[0].nombre :"",
                    obraSocialNum: json.data.coberturas && json.data.coberturas.length > 0? json.data.coberturas[0].numero :"",
                    emails: emailsBD.length > 0 ? emailsBD : [''],
                    telefonos: telefonosBD.length > 0 ? telefonosBD : [''],
                })
                setLoading(false)
            }
            else
            {
                if(pathname.includes('paciente'))
                    router.push("/paciente")
                else
                    setOpenPaciente(null)
            }
        } catch (error) {
            console.log(error);
        }

        setLoading(false)
    }

    useEffect(() => {
        if(id !== null)
        {
            buscarPaciente(id)
        }
    }, [id])

    useEffect(() => {
        if(openPaciente !== null && typeof openPaciente !== 'boolean')
        {
            setLoading(true)
            buscarPaciente(openPaciente)
        }
    }, [openPaciente])

    return (
        <div className='u-1/1 u-flex-column-center-center'>
            <div className='c-nuevo_paciente u-p3--horizontal u-p1--horizontal@mobile'>
                <h2 className='u-color--primary'>{id!==null? 'Editar': 'Nuevo'} Paciente</h2>
                {
                    !loading ?
                        <>
                            {
                                toClose &&
                                <IoMdClose className='u-cursor--pointer u-text--1 u-absolute--top_right' onClick={() => setOpenPaciente( prev => !prev )}/>
                            }
                            <div className='c-nuevo_paciente__item'>
                                <div>
                                    <span>Nombres</span>
                                    <Input defaultValue={paciente.nombre} handleChange={(val) => handleChange(val, 'nombre')}/>
                                </div>
                            </div>
                            <div className='c-nuevo_paciente__item'>
                                <div>
                                    <span>Apellidos</span>
                                    <Input defaultValue={paciente.apellido} handleChange={(val) => handleChange(val, 'apellido')}/>
                                </div>
                            </div>
                            <div className='c-nuevo_paciente__item'>
                                <div>
                                    <span>DNI</span>
                                    <Input type={'number'} defaultValue={paciente.dni} handleChange={(val) => handleChange(val, 'dni')}/>
                                </div>
                            </div>
                            <div className='c-nuevo_paciente__item'>
                                <div>
                                    <span>Fecha de Nacimiento</span>
                                    <Input type={'date'} defaultValue={paciente.fecha_nacimiento} handleChange={(val) => handleChange(val, 'fecha_nacimiento')}/>
                                </div>
                            </div>
                            <div className='c-nuevo_paciente__item'>
                                <div>
                                    <span>Genero</span>
                                    <Select 
                                        options={[ { id:1, value: 'Masculino' }, { id:2, value: 'Femenino' }, { id:3, value: 'Otro' } ]} 
                                        handleChange={(val) => handleChange(val, 'genero')}
                                        defaultOption={paciente.genero}
                                    />
                                </div>
                            </div>
                            <div className='c-nuevo_paciente__item'>
                                <div>
                                    <span>Obra Social</span>
                                    <Input defaultValue={paciente.obraSocial} handleChange={(val) => handleChange(val, 'obraSocial')}/>
                                </div>
                            </div>
                            <div className='c-nuevo_paciente__item'>
                                <div>
                                    <span>Numero Obra Social</span>
                                    <Input defaultValue={paciente.obraSocialNum} handleChange={(val) => handleChange(val, 'obraSocialNum')}/>
                                </div>
                            </div>
                            <div className='c-nuevo_paciente__item c-nuevo_paciente__hora'>
                                <div>
                                    <span>Telefonos</span>
                                    {
                                        producirInputs(
                                            (val, index) => handleChangeArray(val, 'telefonos', index),
                                            paciente.telefonos.length,
                                            (index) => {
                                                if(index >= paciente.telefonos.length)
                                                {
                                                    setPaciente(prev => {
                                                        let aux = [...prev.telefonos]
                                                        aux.push('')
                                                        return({ ...prev, telefonos: aux })
                                                    })
                                                }
                                                else
                                                {
                                                    setPaciente(prev =>{
                                                        let aux = [...prev.telefonos]
                                                        aux.splice(index,  1)
                                                        return({ ...prev, telefonos: aux })
                                                    })
                                                }
                                            },
                                            paciente.telefonos,
                                            'number',
                                            'Telefono'
                                        )   
                                    }
                                </div>
                            </div>
                            <div className='c-nuevo_paciente__item c-nuevo_paciente__hora'>
                                <div>
                                    <span>Emails</span>
                                    {
                                        producirInputs(
                                            (val, index) => handleChangeArray(val, 'emails', index),
                                            paciente.emails.length,
                                            (index) => {
                                                if(index >= paciente.emails.length)
                                                {
                                                    setPaciente(prev => {
                                                        let aux = [...prev.emails]
                                                        aux.push('')
                                                        return({ ...prev, emails: aux })
                                                    })
                                                }
                                                else
                                                {
                                                    setPaciente(prev =>{
                                                        let aux = [...prev.emails]
                                                        aux.splice(index,  1)
                                                        return({ ...prev, emails: aux })
                                                    })
                                                }
                                            },
                                            paciente.emails,
                                            'mail',
                                            'Email'
                                        )   
                                    }
                                </div>
                            </div>
                        </>
                    :
                        <></>
                }
                {
                    error.value &&
                    <div className='c-nuevo_paciente__item c-nuevo_paciente__item--right'>
                        <p className='u-text--1 u-color--red'>{error.mensaje}</p>
                    </div>
                }
                {
                    loading || accion.value ?
                        <div className='c-nuevo_paciente__item c-nuevo_paciente__item--right u-p3--vertical'>
                            <Loader text={accion.text.length > 0 ? accion.text : 'Cargando paciente...'}/>
                        </div>
                    :
                        !loading?
                            <div className='c-nuevo_paciente__item c-nuevo_paciente__item--right u-m4--top'>
                                <Button text={ id || paciente.id ? 'Editar Paciente' : 'Crear Paciente'} clickHandler={ id || paciente.id ? () => editar(paciente) : () => crear(paciente)}/>
                            </div>
                        :
                            <></>
                }
            </div>
            {
                paciente.turnos && paciente.turnos.length > 0 &&
                <div className='u-1/1 u-flex-column-center-start u-p3--horizontal'>
                    <h2 className='u-text--2 u-color--primary'>Turnos</h2>
                    {paciente.turnos.map( (turno) => (<Turno data={turno} onlyView={true}/>))}
                </div>
            }
        </div>
    )
}

export default NuevoPaciente