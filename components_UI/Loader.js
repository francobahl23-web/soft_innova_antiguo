import React from "react"
import {
    FaSpinner
} from "react-icons/fa";


const Loader = ({ children, text = 'Cargando...' }) => {
    return (
        <div className="u-flex-column-center-center">
            <FaSpinner 
                className='c-loader__spinner'
            />
            <p className="c-loader__text">
                {text}
            </p>
            {children}
        </div>
    )
}

export default Loader