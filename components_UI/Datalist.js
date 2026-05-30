'use client'
import { useState, useEffect, useRef } from 'react'

const Datalist = ({ className, list, setBlank = false, defaultOption = null, setter = null, auxRef = null, autoSelect = false, filter = true }) => {
    const [value, setValue] = useState(
        !defaultOption?
            {
                text: '',
                object: ''
            }
        :
            {
                text: defaultOption.value,
                object: defaultOption
            }
    )
    const [isDatalistVisible, setDatalistVisibility] = useState(false)
    const [filteredOptions, setFilteredOptions] = useState([])
    const [hasAutoSelected, setHasAutoSelected] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [style, setStyle] = useState(null)
    const inputRef = useRef(null)
    const divRef = useRef(null) // Referencia al elemento fijo
    const datalistRef = useRef(null) // Referencia al contenedor .c-datalist

    const handleOptionClick = (option) => {
        if(setBlank)
            setValue(
                {
                    text: '',
                    object: ''
                }
            )
        else
            setValue(
                {
                    text: option.value,
                    object: option
                }
            )
        if(setter)
            setter(option)
        setDatalistVisibility(false)
        setHasAutoSelected(true)
    }

    
    const handleKeyDown = (e) => {
        if(!isDatalistVisible)
            setDatalistVisibility(true)
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault()
                handleArrowUp()
                break;
            case 'ArrowDown':
                e.preventDefault()
                handleArrowDown()
                break;
            case 'Enter':
                e.preventDefault()
                handleEnter()
                break
            default:
                break
        }
    };

    const handleArrowUp = () => {
        setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0))
        if(divRef.current)
            divRef.current.scrollTop =  Math.max(divRef.current.scrollTop - 49, 0);
    }

    const handleArrowDown = () => {
        setHighlightedIndex((prevIndex) =>
            Math.min(prevIndex + 1, filteredOptions.length - 1)
        )
        if(divRef.current && highlightedIndex > 0)
            divRef.current.scrollTop += 49
    }

    const handleEnter = () => {
        if (highlightedIndex !== -1) {
            if(setBlank)
                setValue('')
            else
                setValue(filteredOptions[highlightedIndex].value)
            if(setter)
                setter(filteredOptions[highlightedIndex])
            setDatalistVisibility(false)
            setHasAutoSelected(true);
        }
    }

    const handleInputBlur = () => {
        // Use setTimeout para permitir que el clic en la opción ocurra antes de ocultar el datalist
        setTimeout(() => {
            setDatalistVisibility(false)
        }, 200)
    };

    useEffect(() => {
        const handleScroll = (event) => {
            if (!datalistRef.current.contains(event.target)) {
                setDatalistVisibility(false)
            }
        }

        document.addEventListener('scroll', handleScroll, true)
    
        return () => {
            // Limpiar el evento al desmontar el componente
            document.removeEventListener('scroll', handleScroll, true)
        }
    }, [datalistRef.current, setDatalistVisibility])
    
    useEffect(() => {
        if (auxRef) {
            auxRef.current = inputRef.current
        }
    }, [auxRef]);

    
    useEffect(() => {
        // Filtrar opciones cuando el valor del input cambia
        if(value.text === '' || !filter)
            setFilteredOptions(list)
        else if(value.text)
        {
            const filtered = list?.filter((option) =>
                option?.value?.toLowerCase().includes(value.text?.toLowerCase())
            )
            setFilteredOptions(filtered)
            if(autoSelect)
            {
                if(filtered && filtered.length === 1 && !hasAutoSelected)
                {
                    if(setBlank)
                        setValue({
                            text: '',
                            object: ''
                        })
                    else
                        setValue({
                            text: filtered[0].value,
                            object: filtered[0]
                        })
                    if(setter)
                        setter(filtered[0])
                    setDatalistVisibility(false)
                    setHasAutoSelected(true)
                } else if(filtered && filtered.length > 1) {
                    setHasAutoSelected(false)
                }
            }
        }
    }, [value, list])

    useEffect(() => {
        let aux = {}

        if(defaultOption)
            aux = {
                text: defaultOption.value,
                object: defaultOption
            }
        else
            aux = {
                text: '',
                object: ''
            }
        
        setValue(aux)
    }, [defaultOption])

    return (
        <div 
            ref={datalistRef}
            className={`c-datalist ${className}`}
            onBlur={handleInputBlur}
            onClick={() =>  setDatalistVisibility(true)}
            onFocus={() =>  {
                setDatalistVisibility(true)
                inputRef.current.focus()
            }}
            tabIndex={0}
        >
            <input 
                ref={inputRef}
                className={'u-1/1 c-input'} 
                value={value.text} 
                onChange={e => {
                    setValue({
                        text: e.target.value,
                        object: null
                    })
                    if(setter)
                        setter(e.target.value)
                }} 
                onFocus={() => setDatalistVisibility(true)}
                onKeyDown={handleKeyDown}
            />
            {
                list && list[0]?.value && isDatalistVisible &&
                <ul 
                    className="c-datalist__list"
                    ref={divRef}
                    style={
                        style
                    }
                >
                    {        
                        filteredOptions && filteredOptions.length > 0 ?   
                            filteredOptions.map((option, index) => (
                                <li 
                                    className={`c-datalist__li ${highlightedIndex === index ? 'c-datalist__li--highlighted' : ''}`}
                                    key={index} 
                                    onClick={() => handleOptionClick(option)}
                                >
                                    {option.value}
                                </li>
                            ))
                        :
                            <li 
                                className={`c-datalist__li`}
                                onClick={() => handleOptionClick(option)}
                            >
                                No se encontraron datos.
                            </li>
                    }
                </ul>
            }
        </div>
    )
}

export default Datalist