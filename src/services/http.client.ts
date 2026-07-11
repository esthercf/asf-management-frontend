import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/auth.store";
import { useToastStore } from "../stores/toast.store";
import { extractErrorMessage } from "../utiles/error.utiles";


export const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true,
})
/**interceptor:without interceptor this should be done manually in every single API call
 * Attach access token to every request*/
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = useAuthStore();

  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

// On 401 → try refresh once, queue concurrent requests, redirect on failure
let isRefreshing = false
let queue: Array<() => void> = []

client.interceptors.response.use(
  (res) => res,// request succeeded → just pass it through, do nothing
  async (error) => {// request failed → run this
    const auth = useAuthStore();
    const toast = useToastStore();
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }// the original request that failed

    if (error.response?.status === 401 && !original._retry) {// unauthorized, token expired && we haven't already tried once (prevents infinite loops)
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(client(original)))
        })
      }

      isRefreshing = true
      try {
        await auth.refresh()
        queue.forEach(fn => fn())
        queue = []
        return client(original)
      } catch {
        auth.clear() // delete tokens from store + localStorage
        window.location.href = '/login'// kick user back to login page
      } finally {
        isRefreshing = false // always reset the flag, success or failure
      }
    }
    if (error.response?.status !== 401) {
      toast.show(extractErrorMessage(error))
    }
    return Promise.reject(error)
  }
)

