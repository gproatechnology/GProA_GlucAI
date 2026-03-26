/// <reference types="vite/client" />
import axios from 'axios'
import { useNotificationStore } from '../store/notification'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const authData = localStorage.getItem('gecrai-auth')
        if (authData) {
            const { state } = JSON.parse(authData)
            if (state?.token) {
                config.headers.Authorization = `Bearer ${state.token}`
            }
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { addNotification } = useNotificationStore.getState()

        const message = error.response?.data?.detail || 'Ha ocurrido un error inesperado'
        const status = error.response?.status

        if (status === 401) {
            // Check if we are in bypass mode to avoid redirect
            const authData = localStorage.getItem('gecrai-auth')
            const isBypass = authData && authData.includes('bypass-token')

            if (!isBypass) {
                localStorage.removeItem('gecrai-auth')
                window.location.href = '/login'
            }
        } else if (status !== 404 || !error.config.url?.includes('auth/me')) {
            // Show toast for non-401 errors, except for auth/me 404s (which are expected for guests)
            addNotification({
                type: 'error',
                message: 'Error de Servidor',
                description: typeof message === 'string' ? message : JSON.stringify(message),
            })
        }

        return Promise.reject(error)
    }
)

// Auth API
export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', new URLSearchParams({ username: email, password })),

    register: (data: { email: string; password: string; full_name: string; organization_name: string }) =>
        api.post('/auth/register', data),

    getMe: () => api.get('/auth/me'),

    logout: () => api.post('/auth/logout'),
}

// Projects API
export const projectsApi = {
    list: (params?: { skip?: number; limit?: number; status?: string }) =>
        api.get('/projects', { params }),

    get: (id: string) => api.get(`/projects/${id}`),

    create: (data: {
        name: string
        description?: string
        project_type?: string
        voltage_level?: string
        system_type?: string
        location?: string
    }) => api.post('/projects', data),

    update: (id: string, data: Record<string, unknown>) =>
        api.patch(`/projects/${id}`, data),

    delete: (id: string) => api.delete(`/projects/${id}`),

    downloadReport: (id: string) => api.get(`/projects/${id}/report`, { responseType: 'blob' }),
}

// Calculations API
export const calculationsApi = {
    voltageDrop: (data: {
        conductor_material: string
        conductor_size: string
        length: number
        current: number
        power_factor: number
        voltage: number
        phases: number
    }) => api.post('/calculations/voltage-drop', data),

    conductorSizing: (data: {
        load_current: number
        ambient_temperature: number
        insulation_type: string
        conduit_type: string
        num_conductors: number
        voltage: number
    }) => api.post('/calculations/conductor-sizing', data),

    create: (data: {
        project_id: string
        name: string
        calculation_type: string
        description?: string
        input_data: Record<string, unknown>
    }) => api.post('/calculations', data),

    listByProject: (projectId: string) =>
        api.get(`/calculations/project/${projectId}`),

    get: (id: string) => api.get(`/calculations/${id}`),

    downloadReport: (id: string) => api.get(`/calculations/${id}/report`, { responseType: 'blob' }),
}

// Users API
export const usersApi = {
    getMe: () => api.get('/users/me'),

    updateMe: (data: { full_name?: string; avatar_url?: string }) =>
        api.patch('/users/me', data),

    list: (params?: { skip?: number; limit?: number }) =>
        api.get('/users', { params }),
}
