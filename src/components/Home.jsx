import { useAuth } from '../contexts/AuthContext'
import AudioTranscriber from './AudioTranscriber'

const Home = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Transcriptor de Audio
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Bienvenido, {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transcripción de Audio en Tiempo Real
          </h2>
          <p className="text-lg text-gray-600">
            Graba tu voz y obtén la transcripción instantáneamente
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <AudioTranscriber />
        </div>
      </main>
    </div>
  )
}

export default Home