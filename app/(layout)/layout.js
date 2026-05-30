'use client'
// Contexts
import { FocusProvider } from '@/contexts/navegacion'
import { PacienteContextProvider } from '@/contexts/paciente'
import { ProfesionalContextProvider } from '@/contexts/profesional'
import { TurnoContextProvider } from '@/contexts/turno';
import { WebSocketProvider } from '@/contexts/webSocket';

// Toast
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({ children }) {
  return (
    <FocusProvider>
      <TurnoContextProvider>
        <PacienteContextProvider>
          <ProfesionalContextProvider>
            <WebSocketProvider>
              <ToastContainer />
                {children}
            </WebSocketProvider>
          </ProfesionalContextProvider>
        </PacienteContextProvider>
      </TurnoContextProvider>
    </FocusProvider>
  )
}
