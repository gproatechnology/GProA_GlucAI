import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export interface DashboardStats {
    totalProjects: number
    activeProjects: number
    totalCalculations: number
    calculationsThisMonth: number
    reportsGenerated: number
    teamMembers: number
}

export interface RecentProject {
    id: string
    name: string
    status: 'active' | 'completed' | 'paused'
    createdAt: string
    calculationsCount: number
}

export interface RecentActivity {
    id: string
    type: 'calculation' | 'project' | 'report' | 'member'
    description: string
    timestamp: string
    user?: string
}

export interface DashboardData {
    stats: DashboardStats
    recentProjects: RecentProject[]
    recentActivity: RecentActivity[]
    calculationsByType: { name: string; value: number }[]
    projectsByMonth: { month: string; projects: number; calculations: number }[]
}

// Mock data para desarrollo (sin backend)
const mockDashboardData: DashboardData = {
    stats: {
        totalProjects: 12,
        activeProjects: 5,
        totalCalculations: 156,
        calculationsThisMonth: 23,
        reportsGenerated: 34,
        teamMembers: 3,
    },
    recentProjects: [
        {
            id: '1',
            name: 'Planta Industrial Monterrey',
            status: 'active',
            createdAt: '2026-02-20',
            calculationsCount: 45,
        },
        {
            id: '2',
            name: 'Centro Comercial Reforma',
            status: 'active',
            createdAt: '2026-02-18',
            calculationsCount: 32,
        },
        {
            id: '3',
            name: 'Hospital Regional Norte',
            status: 'completed',
            createdAt: '2026-02-10',
            calculationsCount: 67,
        },
        {
            id: '4',
            name: 'Edificio Corporativo Delta',
            status: 'paused',
            createdAt: '2026-01-28',
            calculationsCount: 12,
        },
    ],
    recentActivity: [
        {
            id: '1',
            type: 'calculation',
            description: 'Cálculo de caída de tensión - Planta Industrial Monterrey',
            timestamp: '2026-02-24T10:30:00',
            user: 'Juan Abel',
        },
        {
            id: '2',
            type: 'report',
            description: 'Reporte PDF generado - Centro Comercial Reforma',
            timestamp: '2026-02-24T09:15:00',
            user: 'Israel',
        },
        {
            id: '3',
            type: 'project',
            description: 'Nuevo proyecto creado: Nave Industrial Sur',
            timestamp: '2026-02-23T16:45:00',
            user: 'Juan Abel',
        },
        {
            id: '4',
            type: 'calculation',
            description: 'Dimensionamiento de conductor - Hospital Regional Norte',
            timestamp: '2026-02-23T14:20:00',
            user: 'Israel',
        },
        {
            id: '5',
            type: 'member',
            description: 'Nuevo miembro agregado al equipo',
            timestamp: '2026-02-22T11:00:00',
            user: 'Juan Abel',
        },
    ],
    calculationsByType: [
        { name: 'Caída de Tensión', value: 45 },
        { name: 'Dimensionamiento', value: 38 },
        { name: 'Cortocircuito', value: 25 },
        { name: 'Arco Eléctrico', value: 18 },
        { name: 'Factor de Potencia', value: 30 },
    ],
    projectsByMonth: [
        { month: 'Sep', projects: 2, calculations: 15 },
        { month: 'Oct', projects: 3, calculations: 28 },
        { month: 'Nov', projects: 2, calculations: 22 },
        { month: 'Dic', projects: 4, calculations: 45 },
        { month: 'Ene', projects: 3, calculations: 38 },
        { month: 'Feb', projects: 5, calculations: 52 },
    ],
}

export function useDashboard() {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: async (): Promise<DashboardData> => {
            try {
                // Intentar llamar al backend
                const response = await api.get('/dashboard')
                return response.data
            } catch {
                // Si el backend no está disponible, usar mock data
                console.log('Backend no disponible, usando datos de demostración')
                await new Promise(resolve => setTimeout(resolve, 500))
                return mockDashboardData
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api.get('/projects')
            return response.data
        },
    })
}
