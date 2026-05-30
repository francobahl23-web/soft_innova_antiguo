import React, { useEffect, useState } from 'react';

const ToggleSwitch = ({ text, setEstado, className, estado }) => {
  const [isActive, setIsActive] = useState(estado ? estado : false);

  const toggleSwitch = () => {
    let aux = !isActive
    setIsActive(aux);
    if(setEstado)
      setEstado(aux)
  }

  useEffect(() => {
    setIsActive(estado ? estado : false)
  },[estado])

  return (
    <div className={`u-flex-column-center-center u-flex--noGap ${className}`}>
      <label className={`c-switch ${ text ? 'u-m2--bottom' : ''}`}>
        <input className='c-switch__input' type="checkbox" checked={isActive} onChange={toggleSwitch} />
        <span className="c-switch__slider"></span>
      </label>
      <p>{text}</p>
    </div>
  );
};

export default ToggleSwitch;
