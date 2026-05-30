// React
import { useState, useEffect } from 'react'

// Provincias
import { provincias } from './provincias'

// Components
import Select from '../Select'

const Provincia = ({ styleProvincia, styleLocalidad, defaultProvincia = null, defaultLocalidad = null, localidad = true, setProvincia, setLocalidad }) => {
    const [selected, setSelected] = useState(defaultProvincia ? provincias.find(val => val.value.trim().toLowerCase() === defaultProvincia.trim().toLowerCase()) : null)
    const [selectedLocalidad, setSelectedLocalidad] = useState(null)
    const [localidades, setLocalidades] = useState([])

    useEffect(() => {
        if(selected)
        {
            fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${selected.id}&campos=id,nombre&max=1000`)
            .then((data) => data.json())
            .then((json) => {
                let aux = json.municipios.map(localidad => {
                    if(localidad.nombre && defaultLocalidad && defaultLocalidad.trim().toLowerCase().includes(localidad.nombre.trim().toLowerCase()))
                    {
                        setSelectedLocalidad({id: localidad.id, value: localidad.nombre})
                        setLocalidad(localidad.nombre)
                    }
                    return ({id: localidad.id, value: localidad.nombre})
                })
                aux.sort((a, b) => {
                    return a.value.localeCompare(b.value)
                })
                setLocalidades(aux)
            })
        }
        else
        {
            setLocalidades([])
        }
    },[selected])

    return (
        <>
            <div className={`${styleProvincia}`}>
                <p className='u-m1--bottom'>Provincia:</p>
                <Select 
                    options={provincias} 
                    placeholder={'Provincia'} 
                    defaultOption={selected}
                    handleChange={
                        (val) => {
                            setLocalidades([])
                            setSelected(val)
                            setProvincia(val.value)
                        }
                    }
                />
            </div>
            {
                localidad && 
                <div className={`${styleLocalidad}`}>
                    <p className='u-m1--bottom'>Localidad:</p>
                    <Select 
                        options={localidades} 
                        placeholder={'Localidad'}
                        defaultOption={selectedLocalidad}
                        handleChange={
                            (val) => {
                                setLocalidad(val.value)
                                setSelectedLocalidad(val)
                            }
                        }
                    />
                </div>
            }
        </>
    )
}

export default Provincia