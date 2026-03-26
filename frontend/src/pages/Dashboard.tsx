import { useDashboard } from '../hooks/useDashboard'
import { Link } from 'react-router-dom'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from 'recharts'
import {
    FolderKanban,
    Zap,
    FileText,
    Users,
    Plus,
    Activity,
    ArrowUpRight,
    ChevronRight
} from 'lucide-react'

// Premium color palette for charts matching our tokens
const COLORS = ['#06b6d4', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']

const statusColors: Record<string, string> = {
    active: 'badge-blue',
    completed: 'badge-green',
    paused: 'badge-amber',
}

const statusLabels: Record<string, string> = {
    active: 'Activo',
    completed: 'Completado',
    paused: 'Pausado',
}

const activityIcons: Record<string, React.ReactNode> = {
    calculation: <Zap className="w-4 h-4 text-amber-500" />,
    project: <FolderKanban className="w-4 h-4 text-blue-500" />,
    report: <FileText className="w-4 h-4 text-emerald-500" />,
    member: <Users className="w-4 h-4 text-violet-500" />,
}

export default function Dashboard() {
    const { data, isLoading, error } = useDashboard()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-zinc-400">Cargando métricas...</p>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="glass-card p-6 flex flex-col items-center text-center max-w-sm">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <Activity className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Error de conexión</h3>
                    <p className="text-sm text-zinc-400">No pudimos cargar los datos del dashboard. Por favor, intenta nuevamente más tarde.</p>
                </div>
            </div>
        )
    }

    const { stats, recentProjects, recentActivity, calculationsByType, projectsByMonth } = data

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">

            {/* ── Header ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Visión General</h1>
                    <p className="text-sm text-zinc-400">Métricas y actividad reciente de tu organización.</p>
                </div>
                <Link to="/projects/new" className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Nuevo Proyecto
                </Link>
            </div>

            {/* ── Stats Grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="badge badge-blue text-[10px]"><ArrowUpRight className="w-3 h-3" /> +14%</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.activeProjects}</p>
                        <p className="text-sm text-zinc-400 font-medium">Proyectos Activos</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="badge badge-violet text-[10px]"><ArrowUpRight className="w-3 h-3" /> +22%</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.calculationsThisMonth}</p>
                        <p className="text-sm text-zinc-400 font-medium">Cálculos (Mes)</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.reportsGenerated}</p>
                        <p className="text-sm text-zinc-400 font-medium">Reportes Emitidos</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.teamMembers}</p>
                        <p className="text-sm text-zinc-400 font-medium">Miembros de Equipo</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                </div>
            </div>

            {/* ── Charts Row ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Tendencia LineChart */}
                <div className="glass-card p-6 lg:col-span-2 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-white">Tendencia de Uso</h3>
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">ÚLTIMOS 6 MESES</span>
                    </div>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={projectsByMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ fontSize: '13px' }}
                                    labelStyle={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '8px' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                                <Line type="monotone" dataKey="projects" name="Proyectos" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#fff' }} />
                                <Line type="monotone" dataKey="calculations" name="Cálculos" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cálculos por Tipo PieChart */}
                <div className="glass-card p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-white">Distribución</h3>
                    </div>
                    <div className="flex-1 min-h-[250px] relative flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={calculationsByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {calculationsByType.map((_: any, index: any) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '12px',
                                    }}
                                    itemStyle={{ fontSize: '13px', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Metric */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-white">{stats.calculationsThisMonth}</span>
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Total</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Lists Row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Projects */}
                <div className="glass-card overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                        <h3 className="text-base font-semibold text-white">Proyectos Recientes</h3>
                        <Link to="/projects" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center">
                            Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="p-2 flex-1">
                        {recentProjects.map((project: any) => (
                            <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                                        <FolderKanban className="w-5 h-5 text-zinc-400 group-hover:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white mb-0.5">{project.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            {project.calculationsCount} {project.calculationsCount === 1 ? 'cálculo' : 'cálculos'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`badge ${statusColors[project.status] || 'badge-blue'}`}>
                                    {statusLabels[project.status] || project.status}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-card overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[var(--border-subtle)]">
                        <h3 className="text-base font-semibold text-white">Actividad Reciente</h3>
                    </div>
                    <div className="p-2 flex-1 space-y-1">
                        {recentActivity.map((activity: any) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-muted)] flex flex-shrink-0 items-center justify-center mt-0.5 border border-[var(--border-subtle)]">
                                    {activityIcons[activity.type] || <Activity className="w-4 h-4 text-zinc-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-300 mb-1 leading-snug">{activity.description}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-zinc-500">{activity.user}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                        <span className="text-xs text-zinc-600">
                                            {new Date(activity.timestamp).toLocaleDateString('es-MX', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    )
}
