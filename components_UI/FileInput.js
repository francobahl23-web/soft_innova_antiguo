'use client'
// React
import {
    useState,
    useRef,
    useEffect
} from 'react'

// Icons
import { 
    FaUpload,
    FaFileUpload,
    FaTrashAlt
  } from 'react-icons/fa'

const DEFAULT_MAX_FILE_SIZE_IN_BYTES = 600000;
const KILO_BYTES_PER_BYTE = 1000;

const FileInput = ({
        label,
        setExternalState,
        maxFileSizeInBytes = DEFAULT_MAX_FILE_SIZE_IN_BYTES,
        ...otherProps
    }) => {
    const [files, setFiles] = useState([])
    const fileInputField = useRef(null);

    const removeFile = () => {
        setFiles({});
        if(setExternalState)
            setExternalState(null);
    }

    const handleUploadBtnClick = e => {
        fileInputField.current.click();
    };

    const handleNewFileUpload = (e) => {
        const file = e.target.files;
        if (file.length) {
            //let updatedFiles = addNewFiles(file[0]);
            setFiles({file: file[0]})
            if(setExternalState)
                setExternalState({file: file[0]});
        }
    }

    function dragOverHandler(ev) {
        ev.preventDefault();
    }

    useEffect(() => {
        if(files && setExternalState)
            setExternalState(files)
        else if(setExternalState)
            setExternalState(null)            
    }, [])

    return (
        <section className='c-fileUpload' onDragOver={dragOverHandler}>
            <label>{label}</label>
            {
                files && Object.keys(files).length === 0
                ?
                    <>
                        <p className='u-m2--bottom'>Arrastre sus archivos aqui o</p>
                        <button className='c-button c-button--primary c-fileUpload__button u-flex-center-space between' type="button" onClick={handleUploadBtnClick}>
                            <FaUpload className='u-m2--right'/>
                            <span>Suba un archivo</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputField}
                            onChange={handleNewFileUpload}
                            className='c-fileUpload__input'
                            {...otherProps}
                        />
                    </>
                :
                    <>
                        <FaTrashAlt className='c-fileUpload__deleteIcon' onClick={removeFile}/>
                        <FaFileUpload className='c-fileUpload__fileIcon u-m2--bottom'/>
                        <p>{ files ? files.file.name : '' }</p>
                    </>
            }
        </section>  
    )
}

export default FileInput