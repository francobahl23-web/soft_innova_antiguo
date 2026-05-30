'use client'
import { useEffect, useRef, useState } from 'react'

const Input = ({ type, className, placeholder = false, defaultValue = undefined, defaultChecked = undefined, handleChange = null, list = null, OnKeyUp = null, isReadOnly = false, ...props }) => {
    const [value, setValue] = useState({
        focus: defaultValue !== "",
        value: defaultValue ? String(defaultValue) : '',
        checked: defaultChecked || false
    })
    const [password, setPassword] = useState(type === "password" ? false : true)
    const input = useRef(null)

    const setDateInputValue = (dateTimeString) => {
        let date = null

        if (typeof dateTimeString === 'string') {
            date = dateTimeString.includes('-') ? dateTimeString.split('-') : dateTimeString.split('/')
            if (date[0].length > 2)
                date = new Date(date[0], parseInt(date[1]) - 1, date[2].slice(0, 2))
            else
                date = new Date(date[2].slice(0, 4), parseInt(date[1]) - 1, date[2])
        } else
            date = new Date(dateTimeString)

        var year = date.getFullYear()
        var month = String(date.getMonth() + 1).padStart(2, '0')
        var day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    useEffect(() => {
        const handleWheel = (event) => {
            if (document.activeElement === input.current && event.deltaY !== 0) {
                event.preventDefault()
            }
        };

        input.current?.addEventListener("wheel", handleWheel)

        return () => {
            input.current?.removeEventListener("wheel", handleWheel)
        }
    }, [])

    useEffect(() => {
        const handleFocusChange = () => {
            if (input.current === document.activeElement) {
                if (!input.current.hasFocus) {
                    setValue({ value: value.value, focus: value.value && typeof value.value !== "number" && value.value.trim() === "" ? !value.focus : true })
                    input.current.focus()
                    if (type !== 'number' && type !== 'date' && type !== 'time' && type !== 'checkbox')
                        input.current.setSelectionRange(0, input.current.value.length)
                }
            }
        };
        input.current.addEventListener('focus', handleFocusChange)

        return () => {
            if (input.current)
                input.current.removeEventListener('focus', handleFocusChange)
        }
    }, [])

    // Para actualizar el valor del checkbox cuando defaultChecked cambia externamente
    useEffect(() => {
        setValue((prev) => ({
            ...prev,
            checked: defaultChecked
        }));
    }, [defaultChecked]);

    return (
        <>
            {
                placeholder ?
                    <>
                        <div
                            className={`c-input c-input--placeholder c-input--primary ${value.focus || value.value !== '' ? 'c-input--focused' : ''} ${className}`}
                            onClick={() => {
                                setValue({ ...value, focus: value.value && typeof value.value !== "number" && value.value.trim() === "" ? !value.focus : true })
                                input.current.focus()
                            }}
                        >
                            <span>{placeholder}</span>
                            <input
                                type={type !== "password" ? type : password ? "text" : "password"}
                                ref={input}
                                value={defaultValue !== undefined && defaultValue !== null ? type === 'date' ? setDateInputValue(defaultValue) : defaultValue : value.value}
                                className={`${!value.focus ? 'u-hidden' : ''} u-m2--horizontal ${className && className.includes('c-input--secondary') ? 'c-input--secondary' : ''}`}
                                onKeyUp={(e) => {
                                    if (OnKeyUp)
                                        OnKeyUp(e);
                                }}
                                onChange={(e) => {
                                    setValue({
                                        value: type === 'date' ? new Date(e.target.value.split('-')[0], e.target.value.split('-')[1] - 1, e.target.value.split('-')[2].split('T')[0]) : e.target.value,
                                        focus: value.value && typeof value.value !== "number" && value.value.trim() === "" ? false : true
                                    })
                                    if (handleChange)
                                        handleChange(type === 'date' ? new Date(e.target.value.split('-')[0], e.target.value.split('-')[1] - 1, e.target.value.split('-')[2].split('T')[0]) : e.target.value)
                                }}
                                onClick={(e) => {
                                    if (!isReadOnly && (type === "date"))
                                        e.target.showPicker();
                                }}
                                readOnly={isReadOnly}
                                {...props}
                            />
                        </div>
                    </>
                    :
                    <>
                        <input
                            type={type !== "password" ? type : password ? "text" : "password"}
                            ref={input}
                            value={defaultValue !== undefined && defaultValue !== null ? type === 'date' ? setDateInputValue(defaultValue) : defaultValue : value.value}
                            className={`c-input c-input--primary ${className}`}
                            checked={type === 'checkbox' ? value.checked : undefined}
                            onClick={(e) => {
                                if (!isReadOnly && (type === "date"))
                                    e.target.showPicker();
                            }}
                            onChange={(e) => {
                                e.target.value
                                setValue({
                                    value: type === 'date' ? new Date(e.target.value.split('-')[0], e.target.value.split('-')[1] - 1, e.target.value.split('-')[2].split('T')[0]) : e.target.value,
                                    focus: value.value && (typeof value.value !== "number" && type !== 'date') && value.value?.trim() === "" ? false : true,
                                    checked: type === 'checkbox' ? e.target.checked : value.checked
                                })
                                if (handleChange)
                                    handleChange(
                                        type === 'date' ?
                                            new Date(e.target.value.split('-')[0], e.target.value.split('-')[1] - 1, e.target.value.split('-')[2].split('T')[0])
                                            :
                                            type === 'checkbox' ?
                                                e.target.checked
                                                :
                                                e.target.value
                                    )
                            }}
                            onKeyUp={(e) => {
                                if (OnKeyUp)
                                    OnKeyUp(e);
                            }}
                            readOnly={isReadOnly}
                            {...props}
                        />
                    </>
            }
            {
                type === "password"
                &&
                <div className="u-flex-center-center u-m1--vertical u-color--white u-cursor--pointer">
                    <input
                        type={"checkbox"}
                        checked={password}
                        id='mostrarPassword'
                        onChange={() => {
                            setPassword((prevState) => !prevState)
                        }}
                        {...props}
                    />
                    <label className="u-cursor--pointer u-color--black" htmlFor={'mostrarPassword'}>Mostrar contraseña</label><br />
                </div>
            }
        </>
    )
}

export default Input

