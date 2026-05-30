'use client'
import { createContext, useContext, useState } from 'react'

const PacienteContext = createContext([])

export const usePacienteContext = () => useContext(PacienteContext)

export const PacienteContextProvider = ({ children }) => {
    const [openPaciente, setOpenPaciente] = useState(false)

    return (
        <PacienteContext.Provider value={{
            openPaciente,
            setOpenPaciente,
        }}>
            { children }
        </PacienteContext.Provider>
    )
}