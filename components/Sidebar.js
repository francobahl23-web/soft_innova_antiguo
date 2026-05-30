'use client'
// React
import { useState } from 'react'

// Next
import Link from 'next/link'

// Context
import {useSideBarContext} from '@/contexts/sidebar'

// ICONS
import { AiOutlineShop } from "react-icons/ai";
import { GrDeliver } from "react-icons/gr";
import { SlSocialDropbox } from "react-icons/sl"
import { LuFileSpreadsheet } from "react-icons/lu";
import { FaAddressBook } from "react-icons/fa";


export const menu = [
    {
        id: 'clientes',
        logo: <FaAddressBook/>,
        text: 'Clientes',
        link: '/clientes',
        permisos: ['administrador']
    },
    {
        id: 'proveedores',
        logo: <GrDeliver/>,
        text: 'Proveedores',
        link: '/proveedores',
        permisos: ['administrador']
    },
    {
        id: 'productos',
        logo: <SlSocialDropbox/>,
        text: 'Productos',
        link: '/productos',
        permisos: ['administrador']
    },
    {
        id: 'orden_compra',
        logo: <AiOutlineShop/>,
        text: 'Orden de Compra',
        link: '/orden',
        permisos: ['administrador']
    },
    {
        id: 'presupuesto',
        logo: <LuFileSpreadsheet/>,
        text: 'Presupuesto',
        link: '/presupuesto',
        permisos: ['administrador']
    },
]

const Sidebar = () => {
    const [menuActive, setMenuActive] = useState(null)
    const [previousState, setPreviousState] = useState(null)
    const { open, setOpen } = useSideBarContext()
    
    const handleMenu = menu => {
        if(menu === menuActive)
            setMenuActive(null)
        else
            setMenuActive(menu)
    }

    const handleMouseEnter = () => {
        if(!open)
        {
            setPreviousState(open);
            setOpen(!open)
        }
    }

    const handleMouseLeave = () => {
        if(previousState !== null)
        {
            setOpen(previousState)
            setPreviousState(null)
        }
    }

    return (
        <div className={`c-sidebar ${open && 'c-sidebar--active'}`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {
                menu.map((item, index) => {
                    return (
                        <div className='c-sidebar__menu' key={index}>
                            <Link
                                href={item.link ? item.link : ""}
                                id={item.text}
                                className={`c-sidebar__link`}
                                onClick={() => {
                                    item.submenu ?
                                        handleMenu(item.text)
                                    :
                                        null
                                }}
                            >
                                {
                                    item.logo
                                }
                                {
                                    open
                                        ?
                                        <span>{item.text}</span>
                                        :
                                        ''
                                }
                                {
                                    item.submenu
                                    ?
                                        open
                                        ?
                                            <FaAngleLeft/>
                                        :
                                            ""
                                    :
                                        ''
                                }
                            </Link>
                            {
                                open
                                    ?
                                    item.submenu && item.text === menuActive
                                        ?
                                        <div className={`c-sidebar__submenu`}>
                                            {
                                                item.submenu.map((item, index) => {
                                                    return (
                                                        <Link className='c-sidebar__link c-sidebar__link--submenu' key={index} href={item.link}>
                                                            {
                                                                item.logo
                                                            }
                                                            {
                                                                item.text
                                                            }
                                                        </Link>
                                                    )
                                                })
                                            }
                                        </div>
                                        :
                                        ""
                                    :
                                    ""
                            }
                        </div>
                    )
                })
            }
        </div>
    )
}

export default Sidebar