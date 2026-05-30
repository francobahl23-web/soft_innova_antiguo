'use client';
// React
import { useEffect, useState } from 'react';

// Util
import { v4 as uuidv4 } from 'uuid';

const Checkbox = ({ defaultValue = false, className, text, checkState = null}) => {
    const [checked, setChecked] = useState(defaultValue)
    const uniqueId = uuidv4();

    const handleChange = () => {
        setChecked((prev) => {
            if(checkState)
                checkState(!prev)
            return !prev
        })
    }

    useEffect(() => {
        if(defaultValue !== checked)
        setChecked(defaultValue)
    }, [defaultValue])

    return (
        <div className={`${className} u-flex-center-center`}>
            <input checked={checked} onChange={handleChange} id={uniqueId} type='checkbox' className={`u-m1--right u-cursor--pointer`}/>
            <label className={`u-cursor--pointer`} htmlFor={uniqueId}>{text}</label>
        </div>
    )
}

export default Checkbox