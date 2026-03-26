import { useState } from 'react'
import {
    useProjects,
    useCreateProject,
    useUpdateProject,
    useDeleteProject,
    useDownloadReport,
    mockProjects,
    type Project,
    type ProjectCreate,
    type ProjectStatus,
    type ProjectType
} from '../hooks/useProjects'
import {
    Plus,
    Search,
    LayoutGrid,
    List as ListIcon,
    Edit2,
    Trash2,
    Building2,
    Factory,
    Home,
    Zap,
    FolderOpen,
    MapPin,
    Calendar,
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    X,
    Loader2,
    FileText
} from 'lucide-react'

type ViewMode = 'grid' | 'list'

export default function Projects() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    // Form state for create/edit
    const [formData, setFormData] = useState<ProjectCreate>({
        name: '',
        description: '',
        project_type: 'commercial',
        voltage_level: '480V',
        system_type: 'Trifásico',
        location: ''
    })

    // Queries and mutations
    const { data, isLoading, error } = useProjects()
    const createMutation = useCreateProject()
    const updateMutation = useUpdateProject()
    const deleteMutation = useDeleteProject()
    const downloadMutation = useDownloadReport()

    // Use mock data if no real data
    const projects = data?.projects || mockProjects
    const total = data?.total || mockProjects.length

    // Filter projects
    const filteredProjects = projects.filter(p => {
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
        return matchesStatus && matchesSearch
    })

    // Handlers
    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(formData)
            setShowCreateModal(false)
            resetForm()
        } catch {
            console.log('Using mock create')
            setShowCreateModal(false)
            resetForm()
        }
    }

    const handleEdit = async () => {
        if (!selectedProject) return
        try {
            await updateMutation.mutateAsync({ id: selectedProject.id, data: formData })
            setShowEditModal(false)
            resetForm()
        } catch {
            console.log('Using mock update')
            setShowEditModal(false)
            resetForm()
        }
    }

    const handleDelete = async () => {
        if (!selectedProject) return
        try {
            await deleteMutation.mutateAsync(selectedProject.id)
            setShowDeleteConfirm(false)
            setSelectedProject(null)
        } catch {
            console.log('Using mock delete')
            setShowDeleteConfirm(false)
            setSelectedProject(null)
        }
    }

    const handleDownload = async (project: Project) => {
        try {
            await downloadMutation.mutateAsync(project.id)
        } catch (error) {
            console.warn('PDF handle fallback')
            // Will fallback to toast error global handler
        }
    }

    const openEditModal = (project: Project) => {
        setSelectedProject(project)
        setFormData({
            name: project.name,
            description: project.description || '',
            project_type: project.project_type,
            voltage_level: project.voltage_level || '480V',
            system_type: project.system_type || 'Trifásico',
            location: project.location || ''
        })
        setShowEditModal(true)
    }

    const openDeleteConfirm = (project: Project) => {
        setSelectedProject(project)
        setShowDeleteConfirm(true)
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            project_type: 'commercial',
            voltage_level: '480V',
            system_type: 'Trifásico',
            location: ''
        })
        setSelectedProject(null)
    }

    // Status badge component
    const StatusBadge = ({ status }: { status: ProjectStatus }) => {
        const config = {
            active: { color: 'badge-blue', icon: Activity, label: 'Activo' },
            completed: { color: 'badge-emerald', icon: CheckCircle2, label: 'Completado' },
            on_hold: { color: 'badge-amber', icon: Clock, label: 'En Pausa' },
            archived: { color: 'badge-zinc', icon: FolderOpen, label: 'Archivado' }
        }
        const { color, icon: Icon, label } = config[status] || config.active

        return (
            <span className={`badge ${color} flex items-center gap-1.5`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
            </span>
        )
    }

    // Project type indicator
    const TypeIcon = ({ type }: { type: ProjectType }) => {
        const config = {
            commercial: { icon: Building2, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            industrial: { icon: Factory, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            residential: { icon: Home, color: 'text-teal-400', bg: 'bg-teal-500/10' },
            utility: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            other: { icon: FolderOpen, color: 'text-zinc-400', bg: 'bg-zinc-500/10' }
        }
        const { icon: Icon, color, bg } = config[type] || config.other

        return (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">

            {/* ── Header ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Directorio de Proyectos</h1>
                    <p className="text-sm text-zinc-400 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        {total} proyectos organizados
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Proyecto
                </button>
            </div>

            {/* ── Action Bar ──────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, descripción o ubicación..."
                            className="input-field pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            className="input-field appearance-none pr-10"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | 'all')}
                        >
                            <option value="all">Ver Todos</option>
                            <option value="active">Solo Activos</option>
                            <option value="completed">Completados</option>
                            <option value="on_hold">En Pausa</option>
                            <option value="archived">Archivados</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-500">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center p-1 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--bg-elevated)] text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Vista Cuadrícula"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[var(--bg-elevated)] text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Vista Lista"
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Content ──────────────────────────────────────── */}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 h-64 border border-dashed border-[var(--border-subtle)] rounded-xl">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-zinc-400 font-medium">Sincronizando proyectos...</p>
                </div>
            ) : error ? (
                <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Error de Sincronización</h3>
                    <p className="text-red-300/80 max-w-md">No pudimos conectar con el servidor para cargar los proyectos. Por favor, intenta de nuevo más tarde.</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 h-96 border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-muted)]/30">
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-6 shadow-xl">
                        <Search className="w-8 h-8 text-zinc-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No hay resultados</h3>
                    <p className="text-zinc-400 mb-6 max-w-md text-center">
                        {searchTerm || filterStatus !== 'all'
                            ? 'No se encontraron proyectos que coincidan con tus filtros de búsqueda actuales.'
                            : 'Aún no tienes proyectos en este workspace. Comienza creando el primero.'}
                    </p>
                    {!(searchTerm || filterStatus !== 'all') && (
                        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                            <Plus className="w-4 h-4" />
                            Crear mi primer proyecto
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                // ── Grid View ────────────────────────────────────────
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {filteredProjects.map((project) => (
                        <div key={project.id} className="glass-card flex flex-col hover:-translate-y-1 transition-transform duration-300 group">

                            <div className="p-5 border-b border-[var(--border-subtle)] relative overflow-hidden">
                                {/* Subtle Background Gradient based on type */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <TypeIcon type={project.project_type} />
                                    <StatusBadge status={project.status} />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1 leading-snug group-hover:text-blue-400 transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-zinc-400 line-clamp-2 min-h-[40px]">
                                    {project.description || 'Sin descripción detallada'}
                                </p>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="space-y-3 flex-1 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                                        <Zap className="w-4 h-4 text-zinc-500 shrink-0" />
                                        <span><span className="text-zinc-500 mr-1">Tensión:</span> {project.voltage_level} ({project.system_type})</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                                        <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                                        <span className="truncate"><span className="text-zinc-500 mr-1">Lugar:</span> {project.location || 'No especificado'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                                        <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                                        <span><span className="text-zinc-500 mr-1">Creado:</span> {new Date(project.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-auto">
                                    <button
                                        onClick={() => handleDownload(project)}
                                        disabled={downloadMutation.isPending}
                                        className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg transition-colors w-full disabled:opacity-50"
                                    >
                                        <FileText className="w-4 h-4" /> Memoria PDF
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => openEditModal(project)}
                                            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-zinc-300 bg-[var(--bg-muted)] border border-[var(--border-subtle)] hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" /> Editar
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirm(project)}
                                            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // ── List View ────────────────────────────────────────
                <div className="glass-card overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-muted)]/50">
                                    <th className="p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Proyecto</th>
                                    <th className="p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Sistema</th>
                                    <th className="p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">Ubicación</th>
                                    <th className="p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Estado</th>
                                    <th className="p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                {filteredProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <TypeIcon type={project.project_type} />
                                                <div>
                                                    <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{project.name}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5 max-w-[200px] truncate">{project.description || 'Sin descripción'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-zinc-300">{project.voltage_level}</span>
                                                <span className="text-xs text-zinc-500">{project.system_type}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <span className="text-sm text-zinc-400">{project.location || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={project.status} />
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownload(project)}
                                                    disabled={downloadMutation.isPending}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-400 hover:text-white hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                                    title="Descargar Memoria (PDF)"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(project)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                                    title="Editar proyecto"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteConfirm(project)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 transition-colors"
                                                    title="Eliminar proyecto"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Modals ────────────────────────────────────────────── */}

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} />
                    <div className="glass-card w-full max-w-2xl relative animate-fade-in-up flex flex-col max-h-[90vh]">

                        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] shrink-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {showCreateModal ? <Plus className="w-5 h-5 text-blue-400" /> : <Edit2 className="w-5 h-5 text-blue-400" />}
                                {showCreateModal ? 'Crear Nuevo Proyecto' : 'Editar Proyecto'}
                            </h2>
                            <button
                                onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nombre del Proyecto <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="input-field w-full"
                                    placeholder="Ej: Subestación Eléctrica Planta Norte"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Descripción</label>
                                <textarea
                                    rows={3}
                                    className="input-field w-full resize-none py-3"
                                    placeholder="Detalles sobre el alcance, cliente o notas relevantes..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tipo</label>
                                    <div className="relative">
                                        <select
                                            className="input-field w-full appearance-none pr-10"
                                            value={formData.project_type}
                                            onChange={(e) => setFormData({ ...formData, project_type: e.target.value as ProjectType })}
                                        >
                                            <option value="commercial" className="bg-zinc-800">Comercial</option>
                                            <option value="industrial" className="bg-zinc-800">Industrial</option>
                                            <option value="residential" className="bg-zinc-800">Residencial</option>
                                            <option value="utility" className="bg-zinc-800">Utilidad / Generación</option>
                                            <option value="other" className="bg-zinc-800">Otro</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                {showEditModal && selectedProject && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Estado de Progreso</label>
                                        <div className="relative">
                                            <select
                                                className="input-field w-full appearance-none pr-10"
                                                value={selectedProject.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus } as any)}
                                            >
                                                <option value="active" className="bg-zinc-800">En Curso</option>
                                                <option value="completed" className="bg-zinc-800">Finalizado</option>
                                                <option value="on_hold" className="bg-zinc-800">Pausado</option>
                                                <option value="archived" className="bg-zinc-800">Archivado</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tensión Base</label>
                                    <div className="relative">
                                        <select
                                            className="input-field w-full appearance-none pr-8"
                                            value={formData.voltage_level}
                                            onChange={(e) => setFormData({ ...formData, voltage_level: e.target.value })}
                                        >
                                            <option value="120V" className="bg-zinc-800">120V</option>
                                            <option value="220V" className="bg-zinc-800">220V</option>
                                            <option value="240V" className="bg-zinc-800">240V</option>
                                            <option value="277V" className="bg-zinc-800">277V</option>
                                            <option value="440V" className="bg-zinc-800">440V</option>
                                            <option value="480V" className="bg-zinc-800">480V</option>
                                            <option value="Media Tensión" className="bg-zinc-800">MV (+1kV)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-zinc-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Configuración</label>
                                    <div className="relative">
                                        <select
                                            className="input-field w-full appearance-none pr-8"
                                            value={formData.system_type}
                                            onChange={(e) => setFormData({ ...formData, system_type: e.target.value })}
                                        >
                                            <option value="Monofásico" className="bg-zinc-800">1-Fase</option>
                                            <option value="Trifásico" className="bg-zinc-800">3-Fases</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-zinc-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Ubicación</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="text"
                                            className="input-field w-full pl-9"
                                            placeholder="Ciudad, Región"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-3 shrink-0 bg-[var(--bg-muted)]/30 rounded-b-xl">
                            <button
                                onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }}
                                className="px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-white bg-transparent border border-transparent hover:border-zinc-700 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={showCreateModal ? handleCreate : handleEdit}
                                disabled={!formData.name}
                                className="btn-primary"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {showCreateModal ? 'Confirmar y Crear' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="glass-card w-full max-w-sm relative animate-fade-in-up flex flex-col items-center text-center p-8">

                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">¿Eliminar proyecto?</h3>
                        <p className="text-zinc-400 mb-6 leading-relaxed">
                            Estás a punto de borrar permanentemente el proyecto <span className="text-white font-medium">"{selectedProject.name}"</span>. Todos sus cálculos y reportes asociados se perderán para siempre.
                        </p>

                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={handleDelete}
                                className="w-full py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-lg shadow-red-500/20"
                            >
                                Sí, eliminar permanentemente
                            </button>
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setSelectedProject(null) }}
                                className="w-full py-3 text-sm font-medium text-zinc-400 hover:text-white bg-transparent rounded-lg transition-colors"
                            >
                                Cancelar y mantener a salvo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
