import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

// Types
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived'
export type ProjectType = 'commercial' | 'industrial' | 'residential' | 'utility' | 'other'

export interface Project {
    id: string
    name: string
    description: string | null
    project_type: ProjectType
    status: ProjectStatus
    voltage_level: string | null
    system_type: string | null
    location: string | null
    created_at: string
    updated_at: string
    organization_id: string
    created_by: string | null
}

export interface ProjectCreate {
    name: string
    description?: string
    project_type?: ProjectType
    voltage_level?: string
    system_type?: string
    location?: string
}

export interface ProjectUpdate {
    name?: string
    description?: string
    project_type?: ProjectType
    voltage_level?: string
    system_type?: string
    location?: string
    status?: ProjectStatus
}

export interface ProjectListResponse {
    projects: Project[]
    total: number
}

// API functions
const getProjects = async (skip = 0, limit = 20): Promise<ProjectListResponse> => {
    try {
        const response = await api.get(`/projects?skip=${skip}&limit=${limit}`)
        return response.data
    } catch (error) {
        console.warn('Projects API failed, using mock data:', error)
        return getMockProjects()
    }
}

const getProject = async (id: string): Promise<Project> => {
    try {
        const response = await api.get(`/projects/${id}`)
        return response.data
    } catch (error) {
        console.warn(`Project API (${id}) failed, using mock data:`, error)
        const mock = mockProjects.find(p => p.id === id) || mockProjects[0]
        return mock
    }
}

const createProject = async (data: ProjectCreate): Promise<Project> => {
    const response = await api.post('/projects', data)
    return response.data
}

const updateProject = async ({ id, data }: { id: string; data: ProjectUpdate }): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data)
    return response.data
}

const deleteProject = async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`)
}

const downloadProjectReport = async (id: string): Promise<void> => {
    try {
        const response = await api.get(`/projects/${id}/report`, { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        let filename = `memoria_calculo_proyecto.pdf`
        const disposition = response.headers['content-disposition']
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '')
            }
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
    } catch (error) {
        console.warn('PDF download failed:', error)
        throw error
    }
}

// Hooks
export function useProjects(skip = 0, limit = 20) {
    return useQuery({
        queryKey: ['projects', skip, limit],
        queryFn: () => getProjects(skip, limit),
    })
}

export function useProject(id: string | undefined) {
    return useQuery({
        queryKey: ['project', id],
        queryFn: () => getProject(id!),
        enabled: !!id,
    })
}

export function useCreateProject() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        },
    })
}

export function useUpdateProject() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateProject,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['project', variables.id] })
        },
    })
}

export function useDeleteProject() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        },
    })
}

export function useDownloadReport() {
    return useMutation({
        mutationFn: downloadProjectReport,
    })
}

// Mock data for development
export const mockProjects: Project[] = [
    {
        id: '1',
        name: 'Centro Comercial Plaza Mayor',
        description: 'Instalación eléctrica para centro comercial de 3 niveles',
        project_type: 'commercial',
        status: 'active',
        voltage_level: '480V',
        system_type: 'Trifásico',
        location: 'Ciudad de México',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T15:30:00Z',
        organization_id: 'org-1',
        created_by: 'user-1'
    },
    {
        id: '2',
        name: 'Planta Manufacturera Automotriz',
        description: 'Sistema eléctrico para línea de producción',
        project_type: 'industrial',
        status: 'active',
        voltage_level: '480V',
        system_type: 'Trifásico',
        location: 'Guanajuato',
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2024-01-18T12:00:00Z',
        organization_id: 'org-1',
        created_by: 'user-1'
    },
    {
        id: '3',
        name: 'Hospital Regional',
        description: 'Sistema eléctrico hospitalario con respaldo',
        project_type: 'commercial',
        status: 'completed',
        voltage_level: '480V',
        system_type: 'Trifásico',
        location: 'León, Gto',
        created_at: '2023-11-01T09:00:00Z',
        updated_at: '2024-01-05T17:00:00Z',
        organization_id: 'org-1',
        created_by: 'user-1'
    },
    {
        id: '4',
        name: 'Condominios Residenciales',
        description: 'Instalación eléctrica para complejo residencial',
        project_type: 'residential',
        status: 'on_hold',
        voltage_level: '220V',
        system_type: 'Monofásico',
        location: 'San Miguel de Allende',
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2024-01-10T14:00:00Z',
        organization_id: 'org-1',
        created_by: 'user-1'
    },
    {
        id: '5',
        name: 'Data Center Tier III',
        description: 'Infraestructura eléctrica para centro de datos',
        project_type: 'commercial',
        status: 'active',
        voltage_level: '480V',
        system_type: 'Trifásico',
        location: 'Querétaro',
        created_at: '2024-01-20T11:00:00Z',
        updated_at: '2024-01-22T16:00:00Z',
        organization_id: 'org-1',
        created_by: 'user-1'
    }
]

export const getMockProjects = (): ProjectListResponse => ({
    projects: mockProjects,
    total: mockProjects.length
})