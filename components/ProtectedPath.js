'use client';
import Image from 'next/image'
import {redirect, usePathname} from 'next/navigation'
import {useUserContext} from '@/contexts/user'
import Loader from '@/components_UI/Loader'

const ProtectedPath = ({ permisos =  null, children }) => {
    const { waitChecking, user, logged  } = useUserContext()
    const pathname = usePathname()

    if(waitChecking ){
        return (
            <div className='u-1/1 u-flex-column-center-center u-p5--top'>
                <Image 
                    className='u-m4--bottom' 
                    style={
                        {
                            width: '150px',
                            height: 'auto'
                        }
                    }
                    src={"/innova/imagenes/iso.png"} 
                    width={1422} 
                    height={1661}
                    alt='logo'
                />
                <Loader/>
            </div>
        )
    }
    if (logged && user && user['permisos'])
    {  //Si la ruta tiene permisos
        if(permisos){
            // Si le falta alguno de los permisos lo mandamos al home segun el tipo
            if (permisos.filter(element => user['permisos'].includes(element)).length !== permisos.length && pathname !== '/')
            {
                redirect('/')
            }
        }
    }
    else
        redirect('/login')


    return children
}

export default ProtectedPath