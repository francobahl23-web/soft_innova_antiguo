'use client'
// Next

// COMPONENT
import { useTurnoContext } from "@/contexts/turno"

const Page = ({ children, className }) => {
    const { openCalendar } = useTurnoContext()

    return (
        <div className={`o-page ${ openCalendar ? 'o-page--open' : ''} ${className ? className : ''}`}>
            <div className='o-page__scroll'>
                {children}
            </div>
        </div>
    )
}

export default Page