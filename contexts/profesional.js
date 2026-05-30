'use client'
import { createContext, useContext, useState } from 'react'

const ProfesionalContext = createContext([])

export const useProfesionalContext = () => useContext(ProfesionalContext)

export const ProfesionalContextProvider = ({ children }) => {
    const [openProfesional, setOpenProfesional] = useState(false)

    return (
        <ProfesionalContext.Provider value={{
            openProfesional,
            setOpenProfesional,
        }}>
            { children }
        </ProfesionalContext.Provider>
    )
}