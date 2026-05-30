'use client'

/** 
 * option del tipo 
 * {
 *  id: valorNumerico,
 *  value: valorOpcion
 * }
 * 
**/

import {
    useState,
    useEffect,
    useRef
} from 'react'
import {
    AiOutlineArrowDown,
} from 'react-icons/ai'

const Select = ({ className, options = [], placeholder = null, defaultOption = null, handleChange }) => {
    const [open, set_open] = useState(false)
    const [selected, set_selected] = useState(
        defaultOption !== null ? 
            typeof defaultOption === 'object' && defaultOption.id ?
                options.find(el => parseInt(el.id) === parseInt(defaultOption.id)) 
            :
                options.find(el => String(el.value) === String(defaultOption.value))
        : 
            ''
    )
    const [indexToHover, setIndexTohover] = useState(-1)
    const [style, setStyle] = useState(null)
    const selectRef = useRef(null);
    const dropdownRef = useRef(null);

    const handleOpen = () => {
        if(!open)
        {
            let index = -1

            if(defaultOption !== null)
            {
                if(typeof defaultOption === 'object' && defaultOption.id)
                    index = options.findIndex(el => parseInt(el.id) === parseInt(defaultOption.id)) 
                else
                    index = options.findIndex(el => String(el.value) === String(defaultOption.value))
            } 
            setIndexTohover(index)
        }
        set_open(!open)
    }

    const handleClose = (e) => {
        const isSelect = e.target.closest('.c-select');
        if (!(isSelect && selectRef.current === isSelect)) {
            set_open(false)
        }
    }

    const handleSelect = (index) => {
        set_selected(options[index] ?? null)
        if(handleChange)
            handleChange(options[index] ?? null)
    }

    const handleKeyDown = (e) => {
        if(!open)
            set_open(true)
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
            case 'Tab':
                e.preventDefault();
                set_open(false); // Cerrar el elemento
                break;
            default:
                break
        }
    };

    const handleArrowUp = () => {
        setIndexTohover((prevIndex) => Math.max(prevIndex - 1, 0))
        if(dropdownRef.current)
            dropdownRef.current.scrollTop =  Math.max(dropdownRef.current.scrollTop - 49, 0);
    }

    const handleArrowDown = () => {
        setIndexTohover((prevIndex) =>  Math.min(prevIndex + 1, options.length - 1))
        if(dropdownRef.current && indexToHover > 0)
            dropdownRef.current.scrollTop += 49
    }

    const handleEnter = () => {
        if (indexToHover !== -1) {
            handleSelect(indexToHover)
            set_open(false)
        }
    }

    useEffect(() => {
        document.addEventListener('click', handleClose)
    
        return () => {
          document.removeEventListener('click', handleClose)
        }
    }, [])

    
    useEffect(() => {
        let index = -1

        if(defaultOption !== null)
        {
            if(typeof options === 'object')
                index = options.findIndex(el => parseInt(el.id) === parseInt(defaultOption.id)) 
            else
                index = options.findIndex(el => el.value === defaultOption)
        } 

        setIndexTohover(index)
    }, [options])

    useEffect(() => {
        const handleScroll = (event) => {
            if (!selectRef.current?.contains(event.target)) {
                set_open(false)
            }
        }

        document.addEventListener('scroll', handleScroll, true)
    
        return () => {
            // Limpiar el evento al desmontar el componente
            document.removeEventListener('scroll', handleScroll, true)
        }
    }, [selectRef.current, set_open])


    useEffect(() => {
        let aux = ''

        if(defaultOption)
        {
            if(typeof defaultOption === 'object' && defaultOption.id)
            {
                aux = options.find(el => parseInt(el.id) === parseInt(defaultOption.id))
            }
            else
            {
                aux = options.find(el => String(el.value) === String(defaultOption.value))
            }

        }

        if(aux !== selected)
            set_selected(aux)
    }, [defaultOption])
    
    return (
        <div 
            ref={selectRef}
            className={ 
                `c-select u-flex-center-space-between u-cursor ${placeholder ? `c-select--placeholder` : ''} ${className}` 
            } 
            onClick={handleOpen}
            onFocus={() => {
                if(open)
                    handleOpen()
            }}
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            {
                placeholder 
                ?
                    <span className={`c-select__placeholder`}>{placeholder}</span>
                :
                    ''
            }
            { selected !== null && selected !== undefined ? <span className={`c-select__text`}>{selected.value}</span> : ''}
            <AiOutlineArrowDown/>
            <div 
                ref={dropdownRef}
                className={`c-select__dropdown ${!open && 'u-display--none'}`}
                style={
                    style
                }
            >
                {
                    options && options.length > 0?
                        options.map( (value, index) => {
                            return(
                                <p 
                                    className={`c-select__options ${(selected !== null && selected !== undefined && ((value.id && selected.id === value.id) || (value.value && selected.value === value.value))) && 'c-select__options--active'} ${(selected !== null && selected !== undefined && index === indexToHover && selected.id !== value.id) && 'c-select__options--hover'}`} 
                                    key={index}
                                    onClick={() => handleSelect(index)}
                                >
                                    {value.value}
                                </p>
                            )
                        })
                    :
                        <p 
                            className={`c-select__options`} 
                        >
                            No hay opciones.
                        </p>
                }
            </div>
        </div>
    )
}

export default Select