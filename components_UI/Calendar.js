'use client'
// Next, React
import { useState } from 'react'

// Contexts
import { useTurnoContext } from '@/contexts/turno'

const Calendar = ( ) => {
    const { date, setDate, lenguaje, mesesEspañol, mesesIngles, diasEspañol, diasIngles } = useTurnoContext()
    const [view, setView] = useState('default')
    const currentMonthDays = new Date(date?.getFullYear(), date?.getMonth() + 1, 0).getDate();
    const currentMonthFirstDay = new Date(date?.getFullYear(), date?.getMonth(), 1).getDay();
    const prevMonthDays = new Date(date?.getFullYear(), date?.getMonth(), 0).getDate();
    
    // Función para obtener los días del mes anterior
    const getPreviousMonthDays = () => {
        const prevMonthDaysArray = [];
        for (let i = prevMonthDays - currentMonthFirstDay + 1; i <= prevMonthDays; i++) {
            prevMonthDaysArray.push(i);
        }
        return prevMonthDaysArray;
    }

    // Función para obtener los días del mes siguiente
    const getNextMonthDays = () => {
        const nextMonthDaysArray = [];
        for (let i = 1; i <= 7 - ((currentMonthDays + currentMonthFirstDay) % 7); i++) {
            nextMonthDaysArray.push(i);
        }
        return nextMonthDaysArray;
    }

    const getNameDays = () => {
        let option = lenguaje.toLowerCase()
        switch(option){
            case 'español':
                return( diasEspañol.map( (mes, index) =>  <span key={index} className='c-calendar__day'>{mes}</span> ))
            case 'ingles':
                return( diasIngles.map( (mes, index) =>  <span key={index} className='c-calendar__day'>{mes}</span> ))
            default:
                return( diasEspañol.map( (mes, index) =>  <span key={index} className='c-calendar__day'>{mes}</span> ))
        }
    }

    const getNameMonths = () => {
        let option = lenguaje.toLowerCase()
        switch(option){
            case 'español':
                return( 
                    mesesEspañol.map( 
                        (mes, index) => ( 
                            <span 
                                key={index} 
                                className='c-calendar__day' 
                                onClick={ () => {
                                        setDate(new Date(date.getFullYear(), index, 1))
                                        setView('default')
                                    } 
                                }
                            >
                                {mes}
                            </span> 
                        )
                    )
                )
            case 'ingles':
                return( 
                    mesesIngles.map( 
                        (mes, index) => ( 
                            <span 
                                key={index} 
                                className='c-calendar__day' 
                                onClick={ () => {
                                        setDate(new Date(date.getFullYear(), index, 1))
                                        setView('default')
                                    } 
                                }
                            >
                                {mes}
                            </span> 
                        )
                    )
                )
            default:
                return( 
                    mesesEspañol.map( 
                        (mes, index) => ( 
                            <span 
                                key={index} 
                                className='c-calendar__day' 
                                onClick={ () => {
                                        setDate(new Date(date.getFullYear(), index, 1))
                                        setView('default')
                                    } 
                                }
                            >
                                {mes}
                            </span> 
                        )
                    )
                )
        }
    }

    return (
        <div className='c-calendar'>
            <div className='c-calendar__header'>
                <div 
                    className='c-calendar__button' 
                    onClick={() => 
                        view === 'default' ?
                            setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
                        :
                            setDate(new Date(date.getFullYear() - 1, date.getMonth(), 1))
                    }
                >
                    {'<'}
                </div>
                {
                    view === 'default' ?
                        <div className={`c-calendar__dateWrapper u-cursor--pointer`} onClick={ () => setView('months') }>
                            <span className='c-calendar__date'>{ date?.toLocaleDateString('default', { month: 'long', year: 'numeric' }) }</span>
                        </div>
                    :
                        <div className={`c-calendar__dateWrapper u-cursor--drop`}>
                            <span className='c-calendar__date'>{ date?.getFullYear() }</span>
                        </div>
                }
                <div 
                    className='c-calendar__button' 
                    onClick={() => 
                        view === 'default' ?
                            setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
                        :
                            setDate(new Date(date.getFullYear() + 1, date.getMonth(), 1))
                    }
                >
                    {'>'}
                </div>
            </div>
            <div className={`c-calendar__body ${ view === 'default' ? '' : 'c-calendar__body--months' }`}>
                {
                    view === 'default' ?
                        <> 
                            {
                                getNameDays()
                            }
                            {getPreviousMonthDays().map((day, index) => (
                                <div 
                                    key={`empty-${index}`} 
                                    className={'c-calendar__day c-calendar__empty'}
                                    onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, day))}
                                >
                                    {day}
                                </div>
                            ))}
                            {[...Array(currentMonthDays).keys()].map((day) => (
                                <div 
                                    key={`day-${day + 1}`} 
                                    className={`c-calendar__day c-calendar__day ${ day + 1 === new Date().getDate() && date.getMonth() === new Date().getMonth() && 'c-calendar__day--actual' } ${ day + 1 === date.getDate() && 'c-calendar__day--selected' }`}
                                    onClick={() => setDate(new Date(date.getFullYear(), date.getMonth(), day + 1))}
                                >
                                    {day + 1}
                                </div>
                            ))}
                            {getNextMonthDays().map((day, index) => (
                                <div 
                                    key={`empty-${index}`} 
                                    className={'c-calendar__day c-calendar__empty'}
                                    onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, day))}
                                >
                                    {day}
                                </div>
                            ))}
                        </>
                    :
                        <> 
                            {
                                getNameMonths()
                            }
                        </>
                }
            </div>
        </div>
    )
}

export default Calendar