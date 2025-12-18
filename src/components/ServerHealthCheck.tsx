import { useEffect, useState } from 'react'
import { checkServerHealth } from '../config/api'

interface ServerHealthCheckProps {
  children: React.ReactNode
}

export function ServerHealthCheck({ children }: ServerHealthCheckProps) {
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkServerHealth()
      setIsServerHealthy(healthy)
      
      if (!healthy && retryCount < 3) {
        // Retry after 2 seconds
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
        }, 2000)
      }
    }

    checkHealth()
  }, [retryCount])

  if (isServerHealthy === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Connecting to server...</p>
        </div>
      </div>
    )
  }

  if (!isServerHealthy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Server Not Available</h2>
            <p className="text-gray-300 mb-6">
              Unable to connect to the backend server. Please make sure the server is running.
            </p>
            <button
              onClick={() => {
                setRetryCount(0)
                setIsServerHealthy(null)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
