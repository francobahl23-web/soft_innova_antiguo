// Fonts
import { Open_Sans } from 'next/font/google'

// Context
import { UserContextProvider } from '@/contexts/user'

// SASS
import './styles.scss'
import { TurnoContextProvider } from '@/contexts/turno'

export const metadata = {
  title: "Turnero Innova",
  description: "Turnero Innova",
}
const openSans = Open_Sans({ weight: ['400'], subsets: ['cyrillic']})

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google" content="notranslate"/>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description}/>
        <link rel="icon" href={metadata.icon}/>
      </head>
      <body translate='no' className={openSans.className}>
        <UserContextProvider>
          {children}
        </UserContextProvider>
      </body>
    </html>
  )
}
