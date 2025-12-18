// API Configuration - Easy to reuse in other projects
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 10000,
}

// Generic API client
export const apiClient = {
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },
}

// Server health check - checks if server port is running
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)
    
    const response = await fetch(API_CONFIG.baseURL, {
      method: 'HEAD',
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    return response.ok || response.status === 404
  } catch (error) {
    console.error('Server health check failed:', error)
    return false
  }
}
