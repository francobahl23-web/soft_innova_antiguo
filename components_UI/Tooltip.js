import { useTurnoContext } from '@/contexts/turno';
import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ children, text, className }) => {
    const [position, setPosition] = useState({ top: 0, left: 0, direction: 'up' });
    const { openCalendar } = useTurnoContext()
    const tooltipRef = useRef(null);
    const childRef = useRef(null);

    const showTooltip = () => {
        if (childRef.current && tooltipRef.current) 
        {
            const childRect = childRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            const childHeight = childRect.height;
            const tooltipHeight = tooltipRect.height;
            const childWidth = childRect.width;

            let top = childRect.top - tooltipHeight;
            let direction = 'up';

            if (top < 0) 
            {
                top = childRect.top - childHeight + 10;
                direction = 'down';
            }

            let left = childRect.left + (childWidth / 2) - (tooltipRect.width / 2);

            if(openCalendar)
            {
                if (left - 300 < 0) {
                    left = 300; 
                }
            }
            else if (left < 0)
                left = 10; 

            if (left + tooltipRect.width > window.innerWidth)
                left = window.innerWidth - tooltipRect.width - 10;

            setPosition({
                top: top + window.scrollY,
                left: left + window.scrollX,
                direction: direction
            });
        }
    };

    const hideTooltip = () => {
        setPosition({ top: 0, left: 0, direction: 'up' });
    };

    useEffect(() => {
        window.addEventListener('scroll', hideTooltip);
        return () => {
            window.removeEventListener('scroll', hideTooltip);
        };
    }, []);

    return (
        <div className={`c-tooltip ${className}`} onMouseOver={showTooltip} onMouseLeave={hideTooltip} ref={childRef}>
            {children}
            <span
                className={`c-tooltip__text ${position.direction === 'down' ? 'c-tooltip__text--down' : 'c-tooltip__text--up'}`}
                ref={tooltipRef}
                style={
                    position.direction === 'up'
                        ? {
                              top: `${position.top}px`,
                              left: `${position.left}px`,
                              visibility: position.top !== 0 ? 'visible' : 'hidden',
                              opacity: position.top !== 0 ? '1' : '0',
                              position: 'fixed' // Use fixed positioning
                          }
                        : {
                              top: `${position.top}px`,
                              left: `${position.left}px`,
                              transform: `translateY(${childRef.current.getBoundingClientRect().height + 10}px)`,
                              visibility: position.top !== 0 ? 'visible' : 'hidden',
                              opacity: position.top !== 0 ? '1' : '0',
                              position: 'fixed' // Use fixed positioning
                          }
                }
            >
                {text}
            </span>
        </div>
    );
};

export default Tooltip;
