'use client'
import { createContext, useContext, useState } from 'react'

const SideBarContext = createContext([])

export const useSideBarContext = () => useContext(SideBarContext)

export const SideBarContextProvider = ({ children }) => {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState([])

    return (
        <SideBarContext.Provider value={{
            open,
            setOpen,
            selected,
            setSelected
        }}>
            { children }
        </SideBarContext.Provider>
    )
}