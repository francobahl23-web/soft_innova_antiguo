'use client';
import React from 'react';
import {useRouter} from 'next/navigation';

const Button = ({className, text, clickHandler = null, url = null}) => {
    const router = useRouter();
    return (
        url
            ?
            <button className={`c-button c-button--primary ${className}`} onClick={() => {
                if(clickHandler)
                    clickHandler()
                router.push(url);
            }}>
                {text}
            </button>
            :
            <button className={`c-button c-button--primary ${className}`} onClick={clickHandler}>
                {text}
            </button>
    )
}

export default Button