'use client'
// React
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// context
import { useProfesionalContext } from '@/contexts/profesional'
import { useUserContext } from '@/contexts/user'

// Icons
import { IoMdClose } from "react-icons/io"

// components
import Button from '@/components_UI/Button'
import Input from '@/components_UI/Input'
import Select from '@/components_UI/Select'
import Loader from '@/components_UI/Loader'
import HorariosSemanales from './HorarioSemanal'
import { checkFetch } from '@/utils/checkFetch'


const NuevoProfesional = ({ id = null, toClose = false }) => {
    const [profesional, setProfesional] = useState({
        nombre: '',
        apellido: '',
        dni: null,
        fecha_nacimiento: null,
        genero: null,
        practicas: [{ nombre: '', duracion_moda: '00:30:00' }],
        obrasSociales: [''],
        coberturas: [''],
        clinicas: [''],
        horarios: null,
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
    const [loading, setLoading] = useState(id ? true : false)
    const { openProfesional, setOpenProfesional } = useProfesionalContext()
    const { user, logOut } = useUserContext()
    const router = useRouter()

    const handleChange = (val, key) => {
        let aux = { ...profesional, [key]: val }
        setProfesional(aux)
    }

    const handleChangeArray = (val, key, index) => {
        let aux = { ...profesional }
        let auxArray = [...profesional[key]]
        auxArray[index] = val
        aux[key] = auxArray
        setProfesional(aux)
    }

    const producirInputs = (handleChange = null, cantInputs = 1, setCantInputs = null, values = [], type = '', placeholder = '') => {
        let result = []

        for (let i = 0; i < cantInputs; i++) {
            result.push(
                <div className='u-1/1 u-flex-start-center u-m3--vertical' key={i}>
                    {
                        placeholder === 'Practica' ?
                            <>
                                <Input className='u-1/2' type={type} placeholder={`Nombre`} handleChange={(val) => handleChange({ ...values[i], nombre: val }, i)} defaultValue={values[i].nombre ?? null} />
                                <Input className='u-1/2' type={'time'} placeholder={`Duracion`} handleChange={(val) => handleChange({ ...values[i], duracion_moda: val }, i)} defaultValue={values[i].duracion_moda ?? null} />
                            </>
                        :
                            <Input className='u-1/1' type={type} placeholder={`${placeholder} ${i + 1}`} handleChange={(val) => handleChange(val, i)} defaultValue={values[i] ?? null} />
                    }
                    <div style={{ width: '75px' }}>
                        {
                            cantInputs > 1 &&
                            <Button text={'-'} clickHandler={() => setCantInputs(i)} />
                        }
                    </div>
                    <div style={{ width: '75px' }}>
                        {
                            i === cantInputs - 1 &&
                            <Button text={'+'} clickHandler={() => setCantInputs(i + 1)} />
                        }
                    </div>
                </div>
            )
        }

        return result
    }

    const timeToMinutes = (time) => {
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    const validar = (object) => {
        if (!object.nombre) {
            return 'El campo "Nombre" es obligatorio.'
        }

        if (!object.apellido) {
            return 'El campo "Apellido" es obligatorio.'
        }

        if (!object.dni) {
            return 'El campo "DNI" es obligatorio.'
        }
        if (!object.genero) {
            return 'El campo "Genero" es obligatorio.'
        }

        if (!object.fecha_nacimiento) {
            return 'El campo "Fecha de Nacimiento" es obligatorio.'
        }

        if (!object.telefonos.find((el) => el && el.length > 0)) {
            return 'Debe ingresar al menos un telefono.'
        }

        if (!object.emails.find((el) => el && el.length > 0)) {
            return 'Debe ingresar al menos un email.'
        }

        if (object.obraSocial && object.obraSocial.length > 0 && !object.obraSocialNum) {
            return 'Ha ingresado que el Profesional posee obra social, ingrese el numero .'
        }
        if (object.horarios) {
            let vls = Object.values(object.horarios);
            for (const v of vls) {
                if(!v.every(time=>time.start!==''&&time.end!==''))
                    return 'Completá hora de inicio y hora de fin para todos los dias que seleccionaste.'
                let x = v.find(time => timeToMinutes(time.start) > timeToMinutes(time.end))
                if(x != undefined)
                    return `Formato incorrecto para el horario: ${time.start.slice(0,5)} a ${time.end.slice(0,5)} el horario de inicio es posterior al horario de fin`
            
            }
        }

        return true
    }

    const crear = async (object) => {
        setAccion({
            text: 'Creando profesional...',
            value: true
        })
        try {
            let validate = validar(object)
            if (validate !== true) {
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
                genero: object.genero.value,
                contactos: [],
                coberturas: [],
            }

            if (objectToSend.obraSocial && objectToSend.obraSocial.length > 0) {
                objectToSend.coberturas.push({ nombre: objectToSend.obraSocial, numero: objectToSend.obraSocialNum })
            }

            objectToSend.contactos = objectToSend.contactos.concat(objectToSend.telefonos.map(el => { return ({ tipo: 'telefono', valor: el }) }))
            objectToSend.contactos = objectToSend.contactos.concat(objectToSend.emails.map(el => { return ({ tipo: 'email', valor: el }) }))

            const response = await fetch(`${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/profesionales`,
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
            if (json.status === 'SUCCESS') {
                router.push("/profesional");
            }
            else {
                setError({
                    value: true,
                    mensaje: json.message
                })
                setAccion({
                    text: '',
                    value: false
                })
            }
        } catch (error) {
            console.log(error)
            setError({
                value: true,
                mensaje: 'Ocurrio un error, vuelva a intentar luego.'
            })
            setAccion({
                text: '',
                value: false
            })
        }
    }

    const editar = async (object) => {
        setAccion({
            text: 'Editando profesional...',
            value: true
        })
        try {
            let validate = validar(object)
            if (validate !== true) {
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

            if (objectToSend.obraSocial && objectToSend.obraSocial.length > 0) {
                objectToSend.coberturas.push({ nombre: objectToSend.obraSocial, numero: objectToSend.obraSocialNum })
            }

            objectToSend.contactos = objectToSend.contactos.concat(objectToSend.telefonos.map(el => { return ({ tipo: 'telefono', valor: el }) }))
            objectToSend.contactos = objectToSend.contactos.concat(objectToSend.emails.map(el => { return ({ tipo: 'email', valor: el }) }))

            const response = await fetch(`${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/profesionales/${profesional.id}`,
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
            if (json.status === 'SUCCESS') {
                router.push("/profesional");
            }
            else {
                setError({
                    value: true,
                    mensaje: json.message
                })
            }
            setAccion({
                text: '',
                value: false
            })
        } catch (error) {
            console.log(error)
            setError({
                value: true,
                mensaje: 'Ocurrio un error, vuelva a intentar luego.'
            })
            setAccion({
                text: '',
                value: false
            })
        }
    }

    useEffect(() => {
        const buscarProfesional = async (id) => {
            setLoading(true)

            try {
                const response = await fetch(`${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/profesionales/${id}`,
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
                if (json.status === 'SUCCESS') {
                    let emails= json.data.contactos.filter((el) => el.tipo === 'email').map(el => el.valor)
                    let telefonos= json.data.contactos.filter((el) => el.tipo === 'telefono').map(el => el.valor)
                    json.data.clinicas = json.data.clinicas.length ? json.data.clinicas.map( el => el.nombre ) : ['']
                    json.data.obrasSociales = json.data.coberturas.length ? json.data.coberturas : ['']
                    json.data.practicas = json.data.practicas.length ? json.data.practicas : [{ nombre: '', duracion_moda: '' }]
                    json.data.telefonos = telefonos.length ? telefonos : ['']
                    json.data.emails = emails.length ? emails : ['']
                    json.data.genero = { value: json.data.genero ? json.data.genero.charAt(0).toUpperCase() + json.data.genero.slice(1).toLowerCase() : ""},
                    setProfesional(json.data)
                    setLoading(false)
                }
                else {
                    router.push("/profesional");
                }
            } catch (error) {
                console.log(error);
            }

            setLoading(false)
        }
        if (id !== null) {
            buscarProfesional(id)
        }
    }, [id])

    return (
        <div className='c-nuevo_paciente'> 
            {
                !loading ?
                    <>
                        <h2 className='u-color--primary'>{id!==null? 'Editar': 'Nuevo'} Profesional</h2>
                        <div className='c-nuevo_paciente__item'>
                            <div>
                                <span className='u-m3--bottom'>Nombre</span>
                                <Input defaultValue={profesional.nombre} handleChange={(val) => handleChange(val, 'nombre')} />
                            </div>
                        </div>
                        <div className='c-nuevo_paciente__item'>
                            <div>
                                <span className='u-m2--bottom'>Apellido</span>
                                <Input defaultValue={profesional.apellido} handleChange={(val) => handleChange(val, 'apellido')} />
                            </div>
                        </div>
                        <div className='c-nuevo_paciente__item'>
                            <div>
                                <span className='u-m2--bottom'>DNI</span>
                                <Input type={'number'} defaultValue={profesional.dni} handleChange={(val) => handleChange(val, 'dni')} />
                            </div>
                        </div>
                        <div className='c-nuevo_paciente__item'>
                            <div>
                                <span className='u-m2--bottom'>Fecha de Nacimiento</span>
                                <Input type={'date'} defaultValue={profesional.fecha_nacimiento} handleChange={(val) => handleChange(val, 'fecha_nacimiento')} />
                            </div>
                        </div>
                        <div className='c-nuevo_paciente__item'>
                            <div>
                                <span className='u-m2--bottom'>Genero</span>
                                <Select
                                    options={[{ id: 1, value: 'Masculino' }, { id: 2, value: 'Femenino' }, { id: 3, value: 'Otro' }]}
                                    handleChange={(val) => handleChange(val, 'genero')}
                                    defaultOption={profesional.genero}
                                />
                            </div>
                        </div><div className='c-nuevo_paciente__item c-nuevo_paciente__hora'>
                            <div>
                                <span className='u-m2--bottom'>Clinica</span>
                                {
                                    producirInputs(
                                        (val, index) => handleChangeArray(val, 'clinicas', index),
                                        profesional.clinicas.length,
                                        (index) => {
                                            if (index >= profesional.clinicas.length) {
                                                setProfesional(prev => {
                                                    let aux = [...prev.clinicas]
                                                    aux.push('')
                                                    return ({ ...prev, clinicas: aux })
                                                })
                                            }
                                            else {
                                                setProfesional(prev => {
                                                    let aux = [...prev.clinicas]
                                                    aux.splice(index, 1)
                                                    return ({ ...prev, clinicas: aux })
                                                })
                                            }
                                        },
                                        profesional.clinicas,
                                        '',
                                        'Clinica'
                                    )
                                }
                            </div>
                        </div>
                        <div className='c-nuevo_paciente__item c-nuevo_paciente__hora'>
                            <div>
                                <span className='u-m2--bottom'>Obras Sociales</span>
                                {
                                    producirInputs(
                                        (val, index) => handleChangeArray(val, 'obrasSociales', index),
                                        profesional.obrasSociales.length,
                                        (index) => {
                                            if (index >= profesional.obrasSociales.length) {
                                                setProfesional(prev => {
                                                    let aux = [...prev.obrasSociales]
                                                    aux.push('')
                                                    return ({ ...prev, obrasSociales: aux })
                                                })
                                            }
                                            else {
                                                setProfesional(prev => {
                                                    let aux = [...prev.obrasSociales]
                                                    aux.splice(index, 1)
                                                    return ({ ...prev, obrasSociales: aux })
                                                })
                                            }
                                        },
                                        profesional.obrasSociales,
                                        '',
                                        'Obra social'
                                    )
                                }
                            </div>
                        </div>
                        <div className='c-nuevo_paciente__item c-nuevo_paciente__hora'>
                            <div>
                                <span className='u-m2--bottom'>Practicas</span>
                                {
                                    producirInputs(
                                        (val, index) => {
                                            handleChangeArray(val, 'practicas', index)
                                        },
                                        profesional.practicas.length,
                                        (index) => {
                                            if (index >= profesional.practicas.length) {
                                                setProfesional(prev => {
                                                    let aux = [...prev.practicas]
                                                    aux.push({ nombre: '', duracion_moda: '00:30:00' })
                                                    return ({ ...prev, practicas: aux })
                                                })
                                            }
                                            else {
                                                setProfesional(prev => {
                                                    let aux = [...prev.practicas]
                                                    aux.splice(index, 1)
                                                    return ({ ...prev, practicas: aux })
                                                })
                                            }
                                        },
                                        profesional.practicas,
                                        '',
                                        'Practica'
                                    )
                                }
                            </div>
                        </div>
                        <div className='c-nuevo_paciente__item c-nuevo_paciente__hora'>
                            <div>
                                <span className='u-m2--bottom'>Telefonos</span>
                                {
                                    producirInputs(
                                        (val, index) => handleChangeArray(val, 'telefonos', index),
                                        profesional.telefonos.length,
                                        (index) => {
                                            if (index >= profesional.telefonos.length) {
                                                setProfesional(prev => {
                                                    let aux = [...prev.telefonos]
                                                    aux.push('')
                                                    return ({ ...prev, telefonos: aux })
                                                })
                                            }
                                            else {
                                                setProfesional(prev => {
                                                    let aux = [...prev.telefonos]
                                                    aux.splice(index, 1)
                                                    return ({ ...prev, telefonos: aux })
                                                })
                                            }
                                        },
                                        profesional.telefonos,
                                        'number',
                                        'Telefono'
                                    )
                                }
                            </div>
                        </div>
                        <div className='c-nuevo_paciente__item c-nuevo_paciente__hora'>
                            <div>
                                <span className='u-m2--bottom'>Emails</span>
                                {
                                    producirInputs(
                                        (val, index) => handleChangeArray(val, 'emails', index),
                                        profesional.emails.length,
                                        (index) => {
                                            if (index >= profesional.emails.length) {
                                                setProfesional(prev => {
                                                    let aux = [...prev.emails]
                                                    aux.push('')
                                                    return ({ ...prev, emails: aux })
                                                })
                                            }
                                            else {
                                                setProfesional(prev => {
                                                    let aux = [...prev.emails]
                                                    aux.splice(index, 1)
                                                    return ({ ...prev, emails: aux })
                                                })
                                            }
                                        },
                                        profesional.emails,
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
            <div className='u-1/1'>
                <div className='u-m3--bottom'>
                    <span  className='u-m2--bottom u-text--1'>Horario Semanal</span>
                </div>
                <HorariosSemanales programacionDefault={profesional.horarios?profesional.horarios:null} actualizarProgramacion={(programacion)=>{setProfesional(prev=>{prev.horarios=programacion; return prev;})}}/>
            </div>
            {
                error.value &&
                <div className='c-nuevo_paciente__item c-nuevo_paciente__item--right'>
                    <p className='u-text--1 u-color--red'>{error.mensaje}</p>
                </div>
            }
            {
                loading || accion.value ?
                    <div className='c-nuevo_paciente__item c-nuevo_paciente__item--right u-p3--vertical'>
                        <Loader text={accion.text.length > 0 ? accion.text : 'Cargando profesional...'} />
                    </div>
                    :
                    !loading ?
                        <div className='c-nuevo_paciente__item c-nuevo_paciente__item--right u-m4--top'>
                            <Button text={id ? 'Editar Profesional' : 'Crear Profesional'} clickHandler={id ? () => editar(profesional) : () => crear(profesional)} />
                        </div>
                        :
                        <></>
            }
        </div>
    )
}

export default NuevoProfesional