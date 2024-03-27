import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import Login from '../components/Login'
import Logout from '../components/Logout'
import TeleporterKey from '@/components/TeleporterKey'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) {
    return <div className="h-screen flex flex-col justify-center items-center text-2xl">
      
      <div className='items-center justify-center border-1 flex flex-col'>
      <img className="mb-8 rounded-full w-48 h-48" src="https://oclock.io/wp-content/uploads/2023/11/logo-noir-blanc-rouge-768x768_centre-rond720px.png" alt="Logo O'clock"></img>
      <div>Bienvenue, {session.user?.name}.</div>
      <div><TeleporterKey/></div>
      </div>
      </div>
  }
  return (
    <div className="h-screen flex flex-col justify-center items-center text-2xl">
      <img className="mb-8 rounded-full w-48 h-48" src="https://oclock.io/wp-content/uploads/2023/11/logo-noir-blanc-rouge-768x768_centre-rond720px.png" alt="Logo O'clock"></img>
      <div className='mt-2'>Bienvenue sur Keyring, l&apos;outil de génération de clés et de fichiers de configuration.</div>
      <div className='mb-8'>Pour obtenir votre clé d&apos;activation pour le Téléporteur V8, merci de vous identifier sur Keycloak.</div>
      <Login />
    </div>
  )
}