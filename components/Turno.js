'use client'
import { useState, useRef, useEffect } from 'react'

// Context
import { useTurnoContext } from '@/contexts/turno'
import { useUserContext } from '@/contexts/user'
import { usePacienteContext } from '@/contexts/paciente'

// Icons
import { MdInsertComment } from "react-icons/md"
import { GiInfo } from "react-icons/gi"
import { IoMdArrowDropdown } from "react-icons/io"
import { FaLongArrowAltRight } from "react-icons/fa";

// utils
import { checkFetch } from '@/utils/checkFetch'

// Components
import Tooltip from '@/components_UI/Tooltip'


const estados = [
    'Reservado',
    'Esperando',
    'En Consulta',
    'Atendido',
    'Cancelado',
    'Ausente',
]

const Turno = ({ data = null, onlyView = false }) => {
    const [dataTurno, setDataTurno] = useState( data ?? null )
    const [desplegable, setDesplegable] = useState(false)
    const [desplegableCSS, setDesplegableCSS] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const botonRef = useRef(null);
    const desplegableRef = useRef(null);
    const { user, logOut } = useUserContext()
    const { date, turno, setTurno, setOpenTurno, fechaFormateada } = useTurnoContext()
    const { setOpenPaciente } = usePacienteContext()
    const infoRef = useRef()

    const primeraLetraMayus = (string) => {
        let result = ''

        for(let palabra of string.split(' '))
            result += `${palabra.slice(0,1).toUpperCase()}${palabra.slice(1)} `

        return result.trim()
    }
    
    const haceTanto = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffInMilliseconds = now - past;
    
        const seconds = Math.floor(diffInMilliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);
    
        if (years > 0) {
            return years === 1 ? "hace 1 año" : `hace ${years} años`;
        } else if (months > 0) {
            return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
        } else if (days > 0) {
            return days === 1 ? "hace 1 día" : `hace ${days} días`;
        } else if (hours > 0) {
            return hours === 1 ? "hace 1 hora" : `hace ${hours} horas`;
        } else if (minutes > 0) {
            return minutes === 1 ? "hace 1 minuto" : `hace ${minutes} minutos`;
        } else {
            return seconds === 1 ? "hace 1 segundo" : `hace ${seconds} segundos`;
        }
    }

    const handleClickOutside = (event) => {
        if (
            desplegableRef.current && 
            !desplegableRef.current.contains(event.target) &&
            botonRef.current && 
            !botonRef.current.contains(event.target)
        ) {
            setDesplegable(false);
        }
    }

    const editarEstado = ( nuevoEstado ) => {
        setDesplegable(false)
        const editar = async (nuevoEstado) => {
            try {
                const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/turnos/${dataTurno.id}`,
                    {
                        method: "PUT",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            authorization: "Bearer " + user.token,
                        },
                        body: JSON.stringify({ estado: nuevoEstado })
                    }
                )
                let json = await response.json()
                checkFetch(json, logOut)
                //if(window) window.location.reload()
            } catch (error) { }
        }
        editar( nuevoEstado )
    }

    const next = () => {
        setDesplegable(false)
        const editar = async () => {
            try {
                const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/turnos/${dataTurno.id}`,
                    {
                        method: "PUT",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            authorization: "Bearer " + user.token,
                        },
                        body: JSON.stringify({ estado: estados[estados.findIndex( el => el.toLowerCase() === dataTurno.estado.toLowerCase()) + 1] })
                    }
                )
                let json = await response.json()
                checkFetch(json, logOut)
            } catch (error) { }
        }
        editar()
    }

    const handleModificarTurno = () => {
        let aux = {
            fecha: date,
            hora: dataTurno.horario,
            id: dataTurno.id,
            nombrePaciente: primeraLetraMayus(dataTurno.nombre),
            nombreProfesional: primeraLetraMayus(dataTurno.doctor),
            nombrePractica:  `${dataTurno.duracion}' - ${primeraLetraMayus(dataTurno.practica)}`,
            nota: dataTurno.nota,
            tipo: dataTurno.tipo,
            estado: dataTurno.estado,
            profesional_id: dataTurno.profesional_id,
            practica_id: dataTurno.practica_id,
            practica_nombre: dataTurno.practica,
            idPaciente: dataTurno.idPaciente,
            onlyView: true,
        }
        setTurno((prev) => {
            return({
                ...prev,
                ...aux,
            })
        })
        setOpenTurno(true)
    }
    

    const generateHistorial = () => {
        return(
            <div className='u-p1--vertical u-p2--horizontal'>
                {
                    dataTurno.historial_cambios.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).map( cambio => {
                        if(cambio.campo_modificado === 'fecha_hora')
                            return(
                                <div className='c-turno__cambio'>
                                    <p className='c-turno__cambio--titulo'>Reprogramado</p>
                                    <p className='c-turno__cambio--fecha'>Fecha anterior: { new Date(cambio.valor_anterior).toLocaleDateString() } { new Date(cambio.valor_anterior).toLocaleTimeString() }</p>
                                    <p className='c-turno__cambio--fecha'>Fecha nueva: { new Date(cambio.nuevo_valor).toLocaleDateString() } { new Date(cambio.nuevo_valor).toLocaleTimeString() }</p>
                                    <p className='c-turno__cambio--usuario'>Usuario: { cambio.usuario.nombre && cambio.usuario.nombre !== '' ? cambio.usuario.nombre : cambio.usuario.username }</p>
                                </div>
                            )
                        else
                            return(
                                <div className='c-turno__cambio'>
                                    <p className='c-turno__cambio--titulo'>{ cambio.campo_modificado === "Creador" ? cambio.campo_modificado : cambio.nuevo_valor }</p>
                                    <p className='c-turno__cambio--fecha'>Fecha: { new Date(cambio.fecha).toLocaleDateString() } { new Date(cambio.fecha).toLocaleTimeString() }</p>
                                    <p className='c-turno__cambio--usuario'>Usuario: { cambio.usuario.nombre && cambio.usuario.nombre !== '' ? cambio.usuario.nombre : cambio.usuario.username }</p>
                                </div>
                        )
                    })
                }
            </div>
        )
    }

    const showEstado = () => {
        let fecha = new Date(dataTurno.fecha)
        let actual = new Date()

        return fecha.getDate() === actual.getDate() && fecha.getMonth() === actual.getMonth() && fecha.getFullYear() === actual.getFullYear()
    }

    const mensajeWhatsApp = () => {
        return `Hola, ${primeraLetraMayus(dataTurno.nombre)}! Recuerda que el ${fechaFormateada} ${dataTurno.horario} hs tienes un turno con ${primeraLetraMayus(dataTurno.doctor)}.%0A%0AAdjunto los detalles del turno:%0A%0APráctica: ${primeraLetraMayus(dataTurno.practica)}%0ADirección: Juan W. Gez 377. - Juan Martín de Pueyrredón - San Luis.%0A%0A¡Muchas gracias!`;
    }

    useEffect(() => {
        const adjustDropdownPosition = () => {
            if (desplegable && botonRef.current && desplegableRef.current) {
                const buttonRect = botonRef.current.getBoundingClientRect();
                const dropdownHeight = desplegableRef.current.offsetHeight;
                const windowHeight = window.innerHeight;
    
                const spaceBelow = windowHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
    
                if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                    setDesplegableCSS({
                        top: `calc(${buttonRect.top - dropdownHeight}px - 10px)`,
                        left: `${buttonRect.right - desplegableRef.current.offsetWidth}px`,
                        direction: 'up'
                    });
                } else {
                    setDesplegableCSS({
                        top: `calc(${buttonRect.bottom}px + 10px)`,
                        left: `${buttonRect.right - desplegableRef.current.offsetWidth}px`,
                        direction: 'down'
                    });
                }
    
                document.addEventListener('mousedown', handleClickOutside);
            } else {
                document.removeEventListener('mousedown', handleClickOutside);
            }
    
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        };
    
        adjustDropdownPosition();
    }, [desplegable]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setDataTurno(data)
    }, [data])
    
    return (
        <>
            {
                onlyView &&
                <span className='u-m3--top'>{new Date(dataTurno.fecha).getDate()}/{new Date(dataTurno.fecha).getMonth() + 1}/{new Date(dataTurno.fecha).getFullYear()}</span>
            }
            <div 
                className={`
                    c-turno ${ onlyView ? 'c-turno--onlyView' : '' }
                    ${dataTurno.estado.toLowerCase() === 'esperando' && !onlyView ? 'c-turno--esperando' : ''}
                    ${dataTurno.estado.toLowerCase() === 'en consulta' && !onlyView ? 'c-turno--consulta' : ''}
                    ${dataTurno.estado.toLowerCase() === 'atendido' && !onlyView ? 'c-turno--atendido' : ''}
                    ${dataTurno.estado.toLowerCase() === 'ausente' && !onlyView ? 'c-turno--ausente' : ''}
                    ${dataTurno.estado.toLowerCase() === 'cancelado' && !onlyView ? 'c-turno--cancelado' : ''}
                `}
            >
                <div className='c-turno__horario'>
                    <div className={`c-turno__hora ${ dataTurno.tipo==="sobreturno" ? 'c-turno__hora--sobreturno' : '' } `}>
                        {
                            dataTurno.historial_cambios &&
                            <Tooltip className={'u-flex-center-center'} text={generateHistorial()} childrenRef={infoRef}>
                                <GiInfo ref={infoRef} className='u-cursor'/>
                            </Tooltip>
                        }
                        {
                            dataTurno.nota &&
                            <Tooltip className={'u-flex-center-center'} text={dataTurno.nota}>
                                {
                                    !onlyView ?
                                        <MdInsertComment onClick={  handleModificarTurno } className='u-cursor'/>
                                    :
                                        <MdInsertComment className='u-cursor'/>
                                }
                            </Tooltip>
                        }
                        <span onClick={ !onlyView ? handleModificarTurno : null }>{dataTurno.horario}</span>
                    </div>
                    <div className='c-turno__div c-turno__informacion--column'>
                        <span>{haceTanto(dataTurno.ultimaModificacion)}</span>
                        <span>{dataTurno.estado}</span>
                    </div>
                </div>
                {
                    !onlyView &&
                    <div className='c-turno__paciente'>
                        <span className='c-turno__nombre' onClick={() => setOpenPaciente(dataTurno.idPaciente)}>{primeraLetraMayus(dataTurno.nombre)}</span>
                        <div className='c-turno__informacion'>
                            {
                                dataTurno.telefono &&
                                <>
                                    <a class="c-turno__telefono" href={`http://web.whatsapp.com/send?phone=${dataTurno.telefono}&text=${mensajeWhatsApp()}`} target="_blank">{dataTurno.telefono}</a>
                                    <a class="c-turno__telefono--mobile" href={`whatsapp://send?phone=${dataTurno.telefono}&text=${mensajeWhatsApp()}`} target="_blank">{dataTurno.telefono}</a>
                                </>
                            }
                            <span className='c-turno__dni'>{dataTurno.dni}</span>
                        </div>
                    </div>
                }
                <div className='c-turno__clinica'>
                    {
                        !onlyView &&
                        <div className='u-m3--right'>
                            <span className='c-turno__obra'>{primeraLetraMayus(dataTurno.obraSocial)}</span>
                        </div>
                    }
                    <div className='c-turno__doctor'>
                        <div className='c-turno__hora'>
                            <span className='u-text--bold'>Practica - {primeraLetraMayus(dataTurno.practica)}</span>
                        </div>
                        <div className='c-turno__div c-turno__informacion--column'>
                            <span className='u-text--bold'>{primeraLetraMayus(dataTurno.doctor)}</span>
                        </div>
                    </div>
                </div>
                {
                    !onlyView && showEstado() &&
                    <div className='c-turno__estado'>
                        {
                            dataTurno.estado !== 'Cancelado' && dataTurno.estado !== 'Atendido' && dataTurno.estado !== 'Ausente' &&
                            <Tooltip text={'Siguiente Estado'}>
                                <button className='c-turno__estadoNext' onClick={next}>
                                    <FaLongArrowAltRight/>
                                </button>
                            </Tooltip>
                        }
                        <button className='c-turno__estadoDropdown' ref={botonRef} onClick={() => setDesplegable( (prev) => !prev )}>
                            <IoMdArrowDropdown/>
                        </button>
                    </div>
                }
            </div>
            {
                !onlyView &&
                <div 
                    className={`c-turno__desplegable ${ desplegable ? 'c-turno__desplegable--open' : ''}  ${ desplegableCSS.direction === 'up' ? 'c-turno__desplegable--up' : 'c-turno__desplegable--down'}`} 
                    ref={desplegableRef}
                    style={desplegableCSS}
                >
                    {
                        estados.map( (ele, index) => {
    
                            return(
                                <div className='c-turno__option' key={index} onClick={ () => editarEstado(ele) }>
                                    {ele.slice(0, 1).toUpperCase()}{ele.slice(1)}
                                </div>
                            )
                        })
                    }
                </div>
            }
        </>
    )
}

export default Turno