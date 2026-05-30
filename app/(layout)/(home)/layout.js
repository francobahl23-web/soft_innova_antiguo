'use client'

// Contexts
import { useTurnoContext } from '@/contexts/turno'
import { usePacienteContext } from "@/contexts/paciente"
import { useUserContext } from '@/contexts/user'

// Icons
import { IoMdClose } from "react-icons/io"

// Components
import Header from "@/components/Header"
import SidebarCalendar from "@/components/SidebarCalendar"
import Page from "@/components/Page"
import ProtectedPath from "@/components/ProtectedPath"
import NuevoTurno from "@/components/NuevoTurno"
import NuevoBloqueo from "@/components/NuevoBloqueo"
import NuevoPaciente from "@/components/NuevoPaciente"
import Overlay from "@/components_UI/Overlay"
import PopUp from '@/components_UI/PopUp'
import Button from '@/components_UI/Button'
import Loader from '@/components_UI/Loader'
import Reprogramar from '@/components/Reprogramar'


export default function RootLayout({ children }) {
  const { reprogramando, cancelandoBloqueo, setCancelandoBloqueo, cancelarBloqueo, filtros, profesional } = useTurnoContext()
  const { user, changePass, setChangePass } = useUserContext()
  const { openPaciente } = usePacienteContext()

  return (
    <ProtectedPath>
      <Header blocked={ reprogramando ? true : false }/>
      <NuevoTurno/>
      <NuevoBloqueo/>
      { 
        openPaciente && 
        <Overlay>
          <PopUp centered={true}>
            <NuevoPaciente toClose={true}/>
          </PopUp>
        </Overlay> 
      }
      { 
        changePass && 
        <Overlay>
          <PopUp centered={true}>
            <div className='u-1/1 u-p4--vertical u-p5--horizontal u-p1--horizontal@mobile u-flex-column-center-center'>
              <p className='u-text--2 u-color--primary u-m3--bottom'>¡Atencion!</p>
              <p>Has ingresado con la contraseña por defecto.</p>
              <p className='u-m3--bottom'>Por razones de seguridad, te pedimos que actualices tu contraseña en la seccion "Mi Perfil".</p>
              <Button text={'Continuar'} clickHandler={() => setChangePass(false)} url={`/usuario/crear/${user.id}`}/>
            </div>
          </PopUp>
        </Overlay> 
      }
      {
          cancelandoBloqueo &&
          <Overlay>
              <PopUp centered={true}>
                  <div className='u-1/1 u-flex-column-start-center u-p3--vertical'>
                    {
                      typeof cancelandoBloqueo === 'boolean' && cancelandoBloqueo ?
                        <div className='u-1/1 u-p5'><Loader text='Cancelando...'/></div>
                      :
                        <>
                          <p className='u-text--1 u-m2--bottom'>¿Seguro desea cancelar el bloqueo?</p>
                          <div className='u-1/1 u-flex-column-center-center u-text_align--start u-p4--vertical'>
                            <p className='u-1/1'>Profesional: {profesional ? profesional.apellido : filtros.profesional.apellido}, {profesional ? profesional.nombre : filtros.profesional.nombre}</p>
                            <p className='u-1/1'>Desde: {new Date(cancelandoBloqueo.start).getDate()}/{new Date(cancelandoBloqueo.start).getMonth() + 1}/{new Date(cancelandoBloqueo.start).getFullYear()} {new Date(cancelandoBloqueo.start).getHours().toString().padStart(2, '0')}:{new Date(cancelandoBloqueo.start).getMinutes().toString().padStart(2, '0')}</p>
                            <p className='u-1/1'>Hasta: {new Date(cancelandoBloqueo.end).getDate()}/{new Date(cancelandoBloqueo.end).getMonth() + 1}/{new Date(cancelandoBloqueo.end).getFullYear()} {new Date(cancelandoBloqueo.end).getHours().toString().padStart(2, '0')}:{new Date(cancelandoBloqueo.end).getMinutes().toString().padStart(2, '0')}</p>
                          </div>
                          <div className='u-1/1 u-flex-end-center'>
                              <Button 
                                  text={'Aceptar'} 
                                  clickHandler={
                                      () => {
                                          cancelarBloqueo(cancelandoBloqueo.id)
                                      }
                                  }
                              />
                              <Button text={'Cancelar'} clickHandler={() => setCancelandoBloqueo(null)}/>
                          </div>
                        </>
                    }
                  </div>
              </PopUp>
          </Overlay>
      }
      <Reprogramar/>
      <SidebarCalendar blocked={ reprogramando ? true : false }/>
      <Page>
        {children}
      </Page>
    </ProtectedPath>
  )
}
