import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

// Types
export interface VoltageDropInput {
    conductor_material: 'copper' | 'aluminum'
    conductor_size: string
    length: number
    current: number
    power_factor?: number
    voltage: number
    phases?: 1 | 3
}

export interface ConductorSizingInput {
    load_current: number
    ambient_temperature?: number
    insulation_type?: string
    conduit_type?: string
    num_conductors?: number
    voltage?: number
}

export interface CalculationResult {
    voltage_drop_volts?: number
    voltage_drop_percent?: number
    final_voltage?: number
    minimum_conductor_size?: string
    required_ampacity?: number
    temperature_correction_factor?: number
    compliance_status: 'compliant' | 'warning' | 'non_compliant'
    violations: Array<{
        code: string
        message: string
        severity: 'error' | 'warning'
    }>
    recommendations: string[]
    standards_referenced: string[]
}

export interface Calculation {
    id: string
    name: string
    calculation_type: string
    description: string | null
    input_data: Record<string, unknown>
    results: CalculationResult
    compliance_status: string | null
    violations: unknown[]
    recommendations: unknown[]
    created_at: string
    project_id: string
}

// API functions
const calculateVoltageDrop = async (data: VoltageDropInput): Promise<CalculationResult> => {
    const response = await api.post('/calculations/voltage-drop', data)
    return response.data
}

const calculateConductorSizing = async (data: ConductorSizingInput): Promise<CalculationResult> => {
    const response = await api.post('/calculations/conductor-sizing', data)
    return response.data
}

const getProjectCalculations = async (projectId: string): Promise<{ calculations: Calculation[]; total: number }> => {
    try {
        const response = await api.get(`/calculations/project/${projectId}`)
        return response.data
    } catch (error) {
        console.warn(`Calculations API for project ${projectId} failed, using mock data:`, error)
        return { calculations: [], total: 0 }
    }
}

const getCalculation = async (calculationId: string): Promise<Calculation> => {
    try {
        const response = await api.get(`/calculations/${calculationId}`)
        return response.data
    } catch (error) {
        console.warn(`Calculation API (${calculationId}) failed, using mock data:`, error)
        // Return a mock calculation object if needed
        throw error // Or return mock data
    }
}

const downloadCalculationReport = async (id: string): Promise<void> => {
    try {
        const response = await api.get(`/calculations/${id}/report`, { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        let filename = `memoria_calculo_${id}.pdf`
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
export function useVoltageDropCalculation() {
    return useMutation({
        mutationFn: calculateVoltageDrop,
        onSuccess: (data) => {
            console.log('Voltage drop calculation completed:', data)
        },
        onError: (error) => {
            console.error('Voltage drop calculation failed:', error)
        }
    })
}

export function useConductorSizingCalculation() {
    return useMutation({
        mutationFn: calculateConductorSizing,
        onSuccess: (data) => {
            console.log('Conductor sizing calculation completed:', data)
        },
        onError: (error) => {
            console.error('Conductor sizing calculation failed:', error)
        }
    })
}

export function useProjectCalculations(projectId: string | undefined) {
    return useQuery({
        queryKey: ['calculations', 'project', projectId],
        queryFn: () => getProjectCalculations(projectId!),
        enabled: !!projectId,
    })
}

export function useCalculation(calculationId: string | undefined) {
    return useQuery({
        queryKey: ['calculation', calculationId],
        queryFn: () => getCalculation(calculationId!),
        enabled: !!calculationId,
    })
}

export function useDownloadCalculationReport() {
    return useMutation({
        mutationFn: downloadCalculationReport,
    })
}

// Mock data for development
export const mockVoltageDropResult: CalculationResult = {
    voltage_drop_volts: 8.42,
    voltage_drop_percent: 2.21,
    final_voltage: 471.58,
    compliance_status: 'compliant',
    violations: [],
    recommendations: [],
    standards_referenced: ['NOM-001-SEDE-2012', 'NEC-2020 Article 210.19'],
}

export const mockConductorSizingResult: CalculationResult = {
    minimum_conductor_size: '4 AWG',
    required_ampacity: 87.5,
    temperature_correction_factor: 1.0,
    compliance_status: 'compliant',
    violations: [],
    recommendations: [],
    standards_referenced: ['NOM-001-SEDE-2012', 'NEC-2020 Table 310.16'],
}
