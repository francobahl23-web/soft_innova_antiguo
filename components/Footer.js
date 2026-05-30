'use client'
// Context
import { useSideBarContext } from '@/contexts/sidebar'  

const Footer = () => {
  const { open } = useSideBarContext()
    return (
      <footer className={`c-footer ${open && 'c-footer--active'}`}>
      </footer>
    )
}

export default Footer