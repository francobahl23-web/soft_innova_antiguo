'use client'
import React, { createContext, useContext, useEffect } from 'react';

// Crear el contexto
const FocusContext = createContext();

// Proveedor de contexto
export const FocusProvider = ({ children }) => {
    useEffect(() => {
        const handleTabKeyPress = (event) => {
            if (event.key === 'Tab') {
                event.preventDefault();
                const activeElement = document.activeElement;
                let elements = Array.from(document.querySelectorAll('[class*="c-"]:not(span):not(p)')).filter(element => {
                    let parent = element.parentElement;
                    while (parent) {    
                        if (parent === activeElement) {
                            return false;
                        }
                        parent = parent.parentElement;
                    }
                    parent = element.parentElement;
                    while (parent) {
                        if (parent.classList.contains('c-sidebar') && parent.classList.contains('c-footer') && parent.classList.contains('c-headerAdmin')) { // Verifica si es un hijo de o-adminPage
                            return false;
                        }
                        parent = parent.parentElement;
                    }
                    return true;
                })
                elements = elements.filter(element => {
                    return ['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA'].includes(element.tagName) || element.hasAttribute('tabindex')
                })
                elements = elements.filter(element => !element.classList.contains('c-datepicker'))
                const index = Array.from(elements).findIndex(element => element === activeElement)
                if (event.shiftKey) {
                    // Si se presiona Shift + Tab, ir al elemento anterior
                    if (index !== -1 && index > 0)
                        elements[index - 1].focus();
                    else if (index === 0)
                        elements[elements.length - 1].focus();
                } else {
                    // Si solo se presiona Tab, ir al siguiente elemento
                    if (index !== -1 && index < elements.length - 1)
                        elements[index + 1].focus();
                    else if (index === elements.length - 1 && elements[0])
                        elements[0].focus();
                }
            }
        };

        document.addEventListener('keydown', handleTabKeyPress);

        return () => {
            document.removeEventListener('keydown', handleTabKeyPress);
        };
    }, []);

    return <FocusContext.Provider value={{}}>{children}</FocusContext.Provider>;
};

// Hook para acceder al contexto
export const useFocusContext = () => useContext(FocusContext);
