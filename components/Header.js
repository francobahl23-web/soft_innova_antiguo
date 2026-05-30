'use client'
// NEXT JS COMPONENT
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// Components
import ToggleSwitch from '@/components_UI/ToggleSwitch';
import ContextMenu from '@/components_UI/ContextMenu';

// React Icons
import { FaBars } from 'react-icons/fa'
import { FaPowerOff } from "react-icons/fa6"
import { FaPlusSquare } from "react-icons/fa"

// Contexts
import { useSideBarContext } from '@/contexts/sidebar'
import { useWebSocketContext } from '@/contexts/webSocket'
import { useUserContext } from '@/contexts/user'
import { useTurnoContext } from '@/contexts/turno'
import { usePacienteContext } from '@/contexts/paciente'

const Header = ({ blocked }) => {
    const [open, setOpen] = useState(false)
    const [menuTurno, setMenuTurno] = useState(false)
    const [coordenadas, setCoordenadas] = useState({
        x: null,
        y: null
    })
    const { logOut,user } = useUserContext()
    const { setOpenTurno, setOpenCalendar, openCalendar } = useTurnoContext()
    const { setOpenPaciente } = usePacienteContext()
    const { closeWebSocket  } = useWebSocketContext()
    const pathname = usePathname()

    useEffect(() => {
        if(pathname.length > 1 && !pathname.includes('agenda') && !pathname.includes('calendario'))
            setOpenCalendar(false)
        else
            setOpenCalendar(true)
    }, [pathname])

    return (
        <header className={`c-header ${ blocked ? 'c-header--blocked' : ''}`}>
            <div className='u-flex-center-center'>
                {
                    (pathname.length > 1 || !pathname.includes('calendario')) &&
                    <ToggleSwitch setEstado={setOpenCalendar} estado={ openCalendar }/>
                }
                <FaPlusSquare 
                    id='newTurno' 
                    className='u-color--white u-text--4 u-cursor--pointer u-m3--left' 
                    onClick={(e) => {
                        const rect = e.target.getBoundingClientRect();
                        setCoordenadas({
                            x: rect.left,
                            y: rect.bottom + 5,
                        })
                        setMenuTurno(prev => !prev)
                    }}
                />
                <div className={`c-header__links ${ open ? 'c-header__links--open' : '' }`}>
                    <Link className='c-header__link' href={'/'} onClick={() => setOpen((prevState) => !prevState)}>
                        <span>Calendario</span>
                    </Link>
                    <Link className='c-header__link' href={'/agenda'} onClick={() => setOpen((prevState) => !prevState)}>
                        <span>Agenda</span>
                    </Link>
                    <Link className='c-header__link' href={'/paciente'} onClick={() => setOpen((prevState) => !prevState)}>
                        <span>Pacientes</span>
                    </Link>
                    {
                        user.rol !== "profesional" && 
                        <Link className='c-header__link' href={'/profesional'} onClick={() => setOpen((prevState) => !prevState)}>
                            <span>Profesionales</span>
                        </Link>
                    }
                    {
                        String(user.rol).trim() === "administrador" || String(user.rol).trim() === "admin"? 
                            <Link className='c-header__link' href={'/usuario'} onClick={() => setOpen((prevState) => !prevState)}>
                                <span>Usuarios</span>
                            </Link>
                        :
                            <Link className='c-header__link' href={`/usuario/crear/${user.id}`} onClick={() => setOpen((prevState) => !prevState)}>
                                <span>Mi perfil</span>
                            </Link>
                    }
                </div>
                {
                    menuTurno &&
                    <ContextMenu x={coordenadas.x} y={coordenadas.y} setContextMenu={setMenuTurno}>
                        <div className="c-context_menu--item" onClick={() => { setOpenTurno(prev => !prev); setMenuTurno(prev => !prev); }}>
                            <span className="u-6/7">Nuevo Turno</span>
                        </div>
                        <div className="c-context_menu--item" onClick={() => { setOpenPaciente(prev => !prev); setMenuTurno(prev => !prev); }}>
                            <span className="u-6/7">Nuevo Paciente</span>
                        </div>
                    </ContextMenu>
                }
            </div>
            <Link href={'/'}>
                <Image className={'c-header__logo'} src={"/innova/imagenes/iso.png"} width={1422} height={1661} alt='logo'/>
            </Link>
            <div className='u-flex-center-center'>
                <FaBars className='c-header__menu u-m3--right' onClick={() => setOpen((prevState) => !prevState)}/>
                <FaPowerOff className='c-header__cerrarSesion'  onClick={()=>{closeWebSocket();logOut();}}/>
            </div>
        </header>
    )
}

export default Header