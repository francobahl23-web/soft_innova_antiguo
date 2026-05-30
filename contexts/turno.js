'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useUserContext } from './user'
import { checkFetch } from '@/utils/checkFetch'

const TurnoContext = createContext([])

export const useTurnoContext = () => useContext(TurnoContext)

const lenguaje = 'español'


const generateIntervals = (start, end, interval) => {
    const times = []
    let currentTime = new Date(start.getTime())

    while (currentTime <= end) {
        const hours = String(currentTime.getHours()).padStart(2, '0')
        const minutes = String(currentTime.getMinutes()).padStart(2, '0')
        times.push({ tipo: 'disponibilidad', text: `${hours}:${minutes}` })
        currentTime.setMinutes(currentTime.getMinutes() + interval)
    }

    return times
}

const getWeekDays = (fecha) => {
    const today = fecha
    const days = []
    const intervals = generateIntervals(new Date(today.setHours(8, 0, 0)), new Date(today.setHours(20, 30, 0)), 10) // 10 minutos de intervalo
    const options = { weekday: 'long' }

    let count = 0
    while (days.length < 7) {
        const date = new Date(today)
        date.setDate(today.getDate() + count)
        const dayName = date.toLocaleDateString('es-ES', options)

        if (dayName !== 'sábado' && dayName !== 'domingo') {
            days.push({ nombre: dayName, fecha: new Date(date), intervalos: [...intervals] })
        }
        count++
    }

    return days
}

const isSameDay = (fecha1,fecha2) => {
    return (
        fecha1.getFullYear() === fecha2.getFullYear() &&
        fecha1.getMonth() === fecha2.getMonth() &&
        fecha1.getDate() === fecha2.getDate()
    );
};

export const TurnoContextProvider = ({ children }) => {
    const [turno, setTurno] = useState({
        pacienteText: '',
        pacienteList: [],
        paciente: null,
        profesionalText: '',
        profesionalList: [],
        profesional: null,
        practicasText: '',
        practicaText: '',
        practica: null,
        coberturaText: '',
        cobertura: null,
        fecha: null,
        hora: null
    })
    const [bloqueo, setBloqueo] = useState({
        profesionalText: '',
        profesionalList: [],
        profesional: null,
        fechaDesde: null,
        horaDesde: null,
        fechaHasta: null,
        horaHasta: null,
    })
    const [dias, setDias] = useState({
        dias: [],
        profesional: null
    })
    const [profesionales, setProfesionales] = useState( [] )
    const [profesional, setProfesional] = useState( null )
    const [cancelandoBloqueo, setCancelandoBloqueo] = useState(null)
    const [filtros, setFiltros] = useState(typeof window !== 'undefined' && window.sessionStorage.getItem('filtros-innova') ?
            JSON.parse(window.sessionStorage.getItem('filtros-innova'))
        :
            {
                profesional: null,
                practica: null
            }
    )
    const [openTurno, setOpenTurno] = useState(false)
    const [openBloqueo, setOpenBloqueo] = useState(false)
    const [loadingTurnos, setLoadingTurnos] = useState(true)
    const [date, setDate] = useState(typeof window !== 'undefined' && window.sessionStorage.getItem('date-innova') ?
        new Date(window.sessionStorage.getItem('date-innova'))
    :
        new Date()
    )
    const [turnos, setTurnos] = useState({
        fecha: date,
        turnos: [],
        profesional: null
    })
    const [reprogramando, setReprogramando] = useState(null)
    const [openCalendar, setOpenCalendar] = useState(true)
    const { user, logOut, logged } = useUserContext()
    const pathname = usePathname()
    const diaSemana = lenguaje === 'español' ? 
            ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()] 
        :
            ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()] 
    const mes = lenguaje === 'español' ? mesesEspañol[date.getMonth()] : mesesIngles[date.getMonth()]
    const fechaFormateada = diaSemana + ' ' + date.getDate() + ' - ' + mes + ' ' + date.getFullYear()

    const reiniciarTurno = () => {
        setTurno({
            ...turno,
            pacienteText: '',
            pacienteList: [],
            paciente: null,
            practicasText: '',
            practicaText: '',
            practica: null,
            coberturaText: '',
            cobertura: null,
            fecha: null,
            hora: null,
            id: null,
            onlyView: false
        })
        setFiltros({
            profesional: null,
            practica: null
        })
    }

    const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);


    const compararTurnos = (a, b) => {
        const estadoOrden = {
            'En consulta': 1,
            'Esperando': 2,
            'Reservado': 3,
            'Atendido': 4,
            'Cancelado': 5,
            'Ausente': 6
        };

        // Comparar por estado primero
        const estadoA = estadoOrden[a.estado];
        const estadoB = estadoOrden[b.estado];
        if (estadoA !== estadoB) {
            return estadoA - estadoB;
        }
    
        // Si los estados son iguales, comparar por fecha
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaA - fechaB;
    };
    
    const buscarTurnos = async ( dia, profesional = null ) => {
        try {
            setLoadingTurnos(true)
            const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/calendario/disponibilidad/1?fecha=${dia.getFullYear()}-${dia.getMonth() + 1}-${dia.getDate()}${profesional ? `&profesionales=${profesional.id}` : ''}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        authorization: "Bearer " + user.token,
                    }
                }
            )
            const json = await response.json()
            checkFetch(json, logOut)
            if (json.status === "SUCCESS") 
                setTurnos((prev) => ({
                    ...prev,
                    fecha: prev.date ?? date,
                    turnos: [...json.data[0].turnos.filter((el) => isSameDay(new Date(el.fecha), date))].sort(compararTurnos)
                }))
            
            setLoadingTurnos(false)
        } catch (error) {
            setLoadingTurnos(false)
            console.log(error);
        }
    }

    const cancelarBloqueo = async ( id ) => {
        try {
            setCancelandoBloqueo( true )
            const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/bloqueo/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        authorization: "Bearer " + user.token,
                    }
                }
            )
            const json = await response.json()
            checkFetch(json, logOut)
            //if(window) window.location.reload()
            setCancelandoBloqueo( false )
        } catch (error) {
            console.log(error);
            setCancelandoBloqueo( false )
        }
    }

    const buscarProfesionales = async ( id ) => {
        try {
            const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/profesionales${id ? `/${id}` : ''}`,
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
                let profesionales = null
                if(id)
                {
                    profesionales = json.data
                    setProfesional(profesionales)
                }
                else if(json.data.length && json.data.length > 0)
                {
                    profesionales = json.data.reduce((acc, profesional) => {
                            profesional.clinicas.forEach(clinica => {
                                const newProfessional = {
                                    ...profesional,
                                    clinica: clinica,
                                    value: `${capitalizeFirstLetter(profesional.apellido)}, ${capitalizeFirstLetter(profesional.nombre)} (${capitalizeFirstLetter(clinica.nombre)})`
                                }
                                acc.push(newProfessional)
                            })
                            return acc
                        }, []).sort((a, b) => {
                            return a.value.localeCompare(b.value);
                        })
                    setProfesionales(profesionales)
                }
                return profesionales
            } 
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        
        if(user && user.rol !== 'profesional')
            buscarProfesionales()
        else if(user)
        {

        console.log(user);
            buscarProfesionales(user.profesional.id)
        }
    }, [user, pathname])

    useEffect(() => {
        if(pathname.includes('agenda') && user)
            buscarTurnos( date, filtros.profesional ?? null )
    }, [date, filtros, pathname, user])

    useEffect(() => {
        if(date)
        {
            setTurnos((prev) => ({
                ...prev,
                fecha: date,
                turnos: prev.turnos
            }))
        }
    }, [date])

    useEffect(() => {
        if(filtros.profesional)
        {
            setDias((prev) => ({
                ...prev,
                profesional: filtros.profesional
            }))
            setTurnos((prev) => ({
                ...prev,
                profesional: filtros.profesional
            }))
        }
        else if(profesional)
        {
            setDias((prev) => ({
                ...prev,
                profesional: profesional
            }))
            setTurnos((prev) => ({
                ...prev,
                profesional: profesional
            }))
        }
        else
        {
            setDias((prev) => ({
                ...prev,
                profesional: null
            }))
            setTurnos((prev) => ({
                ...prev,
                profesional: null
            }))
        }
    }, [filtros, profesional])

    useEffect(() => {
        const buscarTurnosCalendario = async ( dia, profesional ) => {
            try {
                const response = await fetch(`${ process.env.SERVER_APP_BASE_URL ? process.env.SERVER_APP_BASE_URL : process.env.REACT_APP_BASE_URL}/calendario/disponibilidad/5?fecha=${dia.getFullYear()}-${dia.getMonth() + 1}-${dia.getDate()}${profesional ? `&profesionales=${profesional.id}` : ''}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            authorization: "Bearer " + user.token,
                        }
                    }
                )
                const json = await response.json()
                checkFetch(json, logOut)
                if (json.status === "SUCCESS") {
                    let option =  { weekday: 'long' };
                    let aux = json.data.map(day=>{
                        let [year,month,dia] = day.dia.split('-');
                        let fecha = new Date(year,parseInt(month)-1,dia,0,0,0);
                        const dayName = fecha.toLocaleDateString('es-ES',option)
                        return{
                            nombre:dayName,
                            fecha,
                            intervalos: day.list.map(ele => ({ ...ele })).sort((a, b) => {
                                if (a.hora < b.hora) return -1;
                                if (a.hora > b.hora) return 1;
                                // Si las horas son iguales, ordenamos por tipo
                                if (a.hora === b.hora) {
                                    if (a.tipo === 'turno' && b.tipo === 'sobreturno') return -1;
                                    if (a.tipo === 'sobreturno' && b.tipo === 'turno') return 1;
                                }
                                return 0;
                            })
                        }
                    });
                    setDias((prev) => ({
                        ...prev,
                        dias: aux,
                    }))
                }
                else
                    setDias('error')
            } catch (error) {
                console.log(error);
            }
        }

        if(pathname === '/' && user)
        {
            if(user.rol === 'profesional')
                buscarTurnosCalendario(date, null)
            else if(filtros.profesional)
                buscarTurnosCalendario(date, filtros.profesional)
            else
                setDias({dias: getWeekDays(date ?? new Date()), profesional: null})
        }
    },[date, filtros, pathname, user])

    useEffect(() => {
        if(window) 
        {
            window.sessionStorage.setItem('date-innova', date)
            window.sessionStorage.setItem('filtros-innova', JSON.stringify(filtros))
        }
    }, [date, filtros])

    useEffect(() => {
        if(!logged)
            reiniciarTurno()
    },  [logged])

    return (
        <TurnoContext.Provider value={{
            openCalendar,
            date,
            diasEspañol,
            diasIngles,
            mesesEspañol,
            mesesIngles,
            fechaFormateada,
            lenguaje,
            openTurno,
            loadingTurnos,
            turnos,
            turno,
            filtros,
            bloqueo,
            openBloqueo,
            cancelandoBloqueo,
            reprogramando,
            dias,
            profesionales,
            profesional,
            buscarProfesionales,
            compararTurnos,
            setProfesional,
            cancelarBloqueo,
            setReprogramando,
            setCancelandoBloqueo,
            setOpenBloqueo,
            setBloqueo,
            setFiltros,
            setDias,
            setTurnos,
            setTurno,
            setLoadingTurnos,
            setOpenCalendar,
            setDate,
            setOpenTurno,
            reiniciarTurno,
        }}>
            { children }
        </TurnoContext.Provider>
    )
}

const diasEspañol = [
    'Dom',
    'Lun',
    'Mar',
    'Mie',
    'Jue',
    'Vie',
    'Sab',
]

const diasIngles = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
]

const mesesEspañol = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

const mesesIngles = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const data = [{
        nombre: 'chulia, victor',
        horario: '08:00',
        telefono: '+54 266 400 4568',
        dni: '13.608.654',
        obraSocial: 'DOSEP - Inclusion Social',
        tipo: 'Consulta',
        practica: 'CONSULTA ODONTOLOGICA (INCLUYE FICHADO Y PRIMERA CONSULTA)',
        doctor: 'Portela, Judith Lilian',
        estado: 'ausente',
        ultimaModificacion: new Date(2024, 4, 16, 19, 18, 0)
    },
    {
        nombre: 'chulia, victor',
        horario: '08:00',
        telefono: '+54 266 400 4568',
        dni: '13.608.654',
        obraSocial: 'DOSEP - Inclusion Social',
        tipo: 'Consulta',
        practica: 'CONSULTA ODONTOLOGICA (INCLUYE FICHADO Y PRIMERA CONSULTA)',
        doctor: 'Portela, Judith Lilian',
        estado: 'ausente',
        ultimaModificacion: new Date(2024, 4, 16, 19, 18, 0)
    }
]
