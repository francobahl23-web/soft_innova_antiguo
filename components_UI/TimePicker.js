import React, { useState, useEffect, useRef } from 'react';

const TimePicker = ({ onTimeChange }) => {
    const [hour, setHour] = useState('00');
    const [minute, setMinute] = useState('00');
    const [showDropdown, setShowDropdown] = useState(false);
    const hourRef = useRef(null)
    const minuteRef = useRef(null)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        setHour(currentHour);
        setMinute(currentMinute);
        if(onTimeChange)
            onTimeChange(`${currentHour}:${currentMinute}`);
    }, [onTimeChange]);

    useEffect(() => {
        if (showDropdown) {
            // Ajusta el scroll para centrar la opción seleccionada
            if (hourRef.current) {
                const selectedHourIndex = parseInt(hour);
                hourRef.current.scrollTop = (selectedHourIndex * 32) - 64
            }
            if (minuteRef.current) {
                const selectedMinuteIndex = parseInt(minute);
                minuteRef.current.scrollTop = (selectedMinuteIndex * 32) - 64
            }
        }
    }, [showDropdown, hour, minute]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleHourChange = (event) => {
        const newHour = event.target.value;
        setHour(newHour);
        if(onTimeChange)
            onTimeChange(`${newHour}:${minute}`);
    };

    const handleMinuteChange = (event) => {
        const newMinute = event.target.value;
        setMinute(newMinute);
        if(onTimeChange)
            onTimeChange(`${hour}:${newMinute}`);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const generateOptions = (count) => {
        return [...Array(count).keys()].map(num => {
            const value = num.toString().padStart(2, '0');
            return <option key={value} value={value}>{value}</option>;
        });
    };

    return (
        <div className="time-picker" ref={dropdownRef}>
            <div className="time-picker-input" onClick={toggleDropdown}>
                {hour}:{minute}
            </div>
            {showDropdown && (
                <div className="time-picker-dropdown">
                    <select
                        className="time-picker-select"
                        value={hour}
                        onChange={handleHourChange}
                        size="5"
                        ref={hourRef}
                    >
                        {generateOptions(24)}
                    </select>
                    <select
                        className="time-picker-select"
                        value={minute}
                        onChange={handleMinuteChange}
                        size="5"
                        ref={minuteRef}
                    >
                        {generateOptions(60)}
                    </select>
                </div>
            )}
        </div>
    );
};

export default TimePicker;
