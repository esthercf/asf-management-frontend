
import { SessionDto } from '../types/session.types'
import { client } from '../services/http.client'


export function useSessionApi() {

  async function login(email: string, password: string): Promise<SessionDto> {
    const { data } = await client.post<SessionDto>('/sessions', { email, password })
    console.log('roles:', data.roles)
    return data
  }

  function logout(): Promise<void> {
    return client.post('/sessions/logout').then(r => r.data)
  }

  function refresh(userId: string, refreshToken: string): Promise<SessionDto> {
    return client.post<SessionDto>(
      '/sessions/refresh',
      { userId, refreshToken }
    ).then(r => r.data)
  }


  return {
    login, logout, refresh,
    
  }
}

export function usePasswordApi() {
  // Request password reset (public)
  async function requestReset(email: string): Promise<void> {
    await client.post('/users/password/request', { email })
  }

  // Update password anonymously (public, after reset link/token)
  async function updateAnonymous(userId: string, token: string, newPassword: string): Promise<void> {
    await client.post('/users/password/update', {
      userId,
      token,
      password: newPassword,
    })
  }

  // Update password while logged in (protected)
  async function updateAuthenticated(newPassword: string): Promise<void> {
    await client.post('/users/password', { password: newPassword })
  }

  return {
    requestReset,
    updateAnonymous,
    updateAuthenticated,
  }
}
