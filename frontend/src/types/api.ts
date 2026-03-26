/**
 * GECRAI 1.2 - API Type Definitions (CODE-005)
 * Central repository for all TypeScript types that mirror the backend API contracts.
 * Import from this file instead of manually typing API responses.
 */

// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserResponse {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    is_active: boolean;
    organization_id: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: UserResponse;
}

export interface RegisterPayload {
    email: string;
    password: string;
    full_name?: string;
    organization_name: string;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'archived' | 'completed';

export interface ProjectResponse {
    id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    org_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectCreate {
    name: string;
    description?: string;
}

export interface ProjectUpdate {
    name?: string;
    description?: string;
    status?: ProjectStatus;
}

// ─── Calculations ─────────────────────────────────────────────────────────────

export type CalculationType = 'voltage_drop' | 'conductor_sizing' | 'short_circuit' | 'load_flow';

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'warning';

export interface Violation {
    code: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface CalculationResponse {
    id: string;
    name: string;
    calculation_type: CalculationType;
    description?: string;
    input_data: Record<string, unknown>;
    results: Record<string, unknown>;
    compliance_status: ComplianceStatus | null;
    violations: Violation[];
    recommendations: string[];
    created_at: string;
    project_id: string;
    _cache?: 'hit' | 'miss';
}

export interface VoltageDropInput {
    voltage: number;
    current: number;
    phases: 1 | 3;
    conductor_material: 'copper' | 'aluminum';
    conductor_size: string;
    length: number;
}

export interface ConductorSizingInput {
    load_current: number;
    ambient_temperature: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

// ─── Feature Flags ───────────────────────────────────────────────────────────

export interface FeatureFlags {
    pdf_reports: boolean;
    api_access: boolean;
    priority_support: boolean;
    advanced_analytics: boolean;
    multi_user: boolean;
    max_users: number;        // -1 = unlimited
    max_projects: number;     // -1 = unlimited
    calculations_per_month: number;  // -1 = unlimited
}

export interface FeatureFlagsResponse {
    features: FeatureFlags;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export type ServiceStatus = 'healthy' | 'unhealthy' | 'unavailable' | 'degraded';

export interface ServiceHealth {
    status: ServiceStatus;
    latency_ms?: number;
    note?: string;
    error?: string;
}

export interface DetailedHealthResponse {
    status: ServiceStatus;
    version: string;
    environment: string;
    services: {
        database: ServiceHealth;
        redis?: ServiceHealth;
    };
}

// ─── Generic API Error ───────────────────────────────────────────────────────

export interface APIError {
    detail: string | { msg: string; loc: string[] }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check if a feature is available, with a friendly infinite check for -1 */
export const isUnlimited = (limit: number): boolean => limit === -1;

/** Check if user has a specific feature flag */
export const hasFeature = (features: FeatureFlags, flag: keyof FeatureFlags): boolean => {
    const value = features[flag];
    return typeof value === 'boolean' ? value : (typeof value === 'number' && value !== 0);
};
