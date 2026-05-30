import React from 'react'

// Components
import TableAux from './tableaux'
import Button from '@/components_UI/Button'
import ProtectedPath from '@/components/ProtectedPath'

const page = () => {
  return (
    <ProtectedPath permisos={['ver_profesionales']}>
      <div className='u-1/1 u-flex-column-center-end u-p4'>
        <div className='u-1/1 u-flex-center-space-between u-m4--bottom'>
          <h1>Profesionales</h1>
          <Button className={'u-m2--bottom'} text={'Nuevo Profesional'} url={'/profesional/crear'}/>
        </div>
        <TableAux/>
      </div>
    </ProtectedPath>
  )
}

export default page