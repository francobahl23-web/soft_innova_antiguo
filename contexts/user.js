'use client'

import {createContext, useContext, useEffect, useState} from 'react'
import {encryptFetch} from '@/utils/customFetch'

const UserContext = createContext([])

export const useUserContext = () => useContext(UserContext)

export const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [waitChecking, setWait] = useState(true)
    const [logged, setLogged] = useState(false)
    const [changePass, setChangePass] = useState(false)
    const [triedLog, setTriedLog] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    const reiniciarBase = async () =>{
        fetch(
            `${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/reiniciarBase`,
            {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'authorization': "Bearer " + user.token
                }
            }
        ).catch(()=>{
            logOut()
        })
        .then(()=>{
            logOut()
        })
    }

    const handleUser = (name, value) => {
        let userRef = {
            ...user,
            [name]: value
        }
        setUser(userRef)
    }
    const logOut = () => {
        if(window)
        {
            if(window.localStorage.getItem('user-innova'))
                window.localStorage.removeItem('user-innova')

            setUser(null)
            setLogged(false)
            setTriedLog(false)
            window.location.reload()
        }
    }

    const logIn = async (e) => {
        e.preventDefault();
        let result = false;
        await encryptFetch(
            // URL
            `${process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/login`,
            // Config
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            },
            // Body
            {
                username: user.username,
                password: user.password
            },
            // Callback
            json => {
                if(json.status === 'SUCCESS')
                {
                    let userRef = {
                        ...user,
                        ...json.data
                    }
                    setUser(userRef)
                    setLogged(true)

                    if(user.username === user.password)
                        setChangePass(true)

                    result = json.data.permisos.length === 1 && json.data.permisos[0] === "invitado" ? "invitado" : "admin";
                }
                else
                {
                    setTriedLog(true)
                }
            }
        )
        return result
    }

    useEffect(() => {
        if(user && logged){
            window.localStorage.setItem('user-innova', JSON.stringify(user))
        }
    }, [user, logged])

    useEffect(() => {
        if(!logged)
            setChangePass(false)
    }, [logged])

    useEffect(() => {
        let user = window.localStorage.getItem('user-innova') ? JSON.parse(window.localStorage.getItem('user-innova')) : null
        setUser(user)
        if(user){
            setLogged(true)
        }
        setWait(false)
    }, [])


    return (
        <UserContext.Provider value={{
            user,
            logged,
            triedLog,
            error,
            message,
            changePass,
            setChangePass,
            setTriedLog,
            setMessage,
            setError,
            reiniciarBase,
            waitChecking,
            handleUser,
            logIn,
            logOut,
        }}>
            { children }
        </UserContext.Provider>
    )
}
