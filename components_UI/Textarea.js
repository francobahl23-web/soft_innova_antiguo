'use client'
import { useState } from 'react'

const Textarea = ({ className, defaultValue = null, placeholder, bordered, handleChange, parentRef = null }) => {
  const [value, setValue] = useState(defaultValue ?? '')

  const defaultChange = (e) => {
    setValue(e.target.value)
    handleChange(e.target.value)
  }

  return (
    <textarea 
      ref={parentRef}
      value={ defaultValue ?? value } 
      onChange={defaultChange} 
      onFocus={(e) => {
        e.target.setSelectionRange(0, e.target.value.length)
      }}
      className={`c-textarea ${bordered && 'c-textarea--bordered'} u-p2--horizontal ${className}`} 
      placeholder={placeholder}
    />
  )
}

export default Textarea