'use client';
import React from 'react';

//DatePicker
import DatePicker, { registerLocale } from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
registerLocale('es', es)

const DatepickerComponent = ({ dateFormat="dd/MM/yyyy", datePicker, setDatePicker, minDate, maxDate, className ,...props }) => {

    return (
        <DatePicker
            className='c-datepicker'
            dateFormat={dateFormat}
            closeOnScroll={true}
            selected={datePicker}
            locale={"es"}
            onChange={date => setDatePicker(date)}
            minDate={minDate ? minDate : null}
            maxDate={maxDate ? maxDate : null}
            {...props}
        />
    )
}

export default DatepickerComponent