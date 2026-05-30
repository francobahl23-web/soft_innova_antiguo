'use client'
import {
  useEffect
} from 'react'

const ContextMenu = ({ children, x, y, rowData, setContextMenu }) => {

  const handleCloseContextMenu = (e) => {
    if (!e.target.closest('.c-context_menu')) {
      setContextMenu(null)
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleCloseContextMenu)

    return () => {
      document.removeEventListener('click', handleCloseContextMenu)
    }
  }, [])

  return (
    <div 
      className='c-context_menu'
      style={{
        top: y,
        left: x,
      }}
    > 
      {children}
    </div>
  )
}

export default ContextMenu