import { useParams, Link } from 'react-router-dom'
import { useProject } from '../hooks/useProjects'
import { useProjectCalculations, useDownloadCalculationReport } from '../hooks/useCalculations'
import { FileText, Download, ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function ProjectDetail() {
    const { id } = useParams()
    const { data: project, isLoading: isProjectLoading } = useProject(id)
    const { data: calcData, isLoading: isCalcLoading } = useProjectCalculations(id)
    const { mutate: downloadReport, isPending: isDownloading } = useDownloadCalculationReport()

    if (isProjectLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-100 mb-4">Proyecto no encontrado</h2>
                <Link to="/projects" className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Proyectos
                </Link>
            </div>
        )
    }

    const formatType = (type: string) => type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/projects" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm mb-4 transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Proyectos
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{project.name}</h1>
                    {project.description && (
                        <p className="text-gray-400 mt-2 text-lg">{project.description}</p>
                    )}
                </div>
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4 shadow-xl">
                    <div className="text-sm text-gray-400 mb-1">Estado</div>
                    <div className="flex items-center gap-2 text-emerald-400 font-medium capitalize">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {project.status.replace('_', ' ')}
                    </div>
                </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Tipo de Proyecto</div>
                    <div className="font-medium text-white capitalize">{project.project_type || 'No especificado'}</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Nivel de Tensión</div>
                    <div className="font-medium text-white">{project.voltage_level || 'No especificado'}</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Sistema</div>
                    <div className="font-medium text-white">{project.system_type || 'No especificado'}</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Ubicación</div>
                    <div className="font-medium text-white">{project.location || 'No especificada'}</div>
                </div>
            </div>

            {/* Calculations List */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-700/50 flex justify-between items-center bg-gray-900/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Memorias de Cálculo</h2>
                    </div>
                    {calcData && (
                        <div className="text-sm text-gray-400">
                            Total: {calcData.total}
                        </div>
                    )}
                </div>

                <div className="p-6">
                    {isCalcLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : !calcData?.calculations?.length ? (
                        <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg bg-gray-900/20">
                            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-300">No hay cálculos aún</h3>
                            <p className="text-gray-500 mt-2">Realiza cálculos eléctricos para asociarlos a este proyecto.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {calcData.calculations.map(calc => (
                                <div key={calc.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-gray-900/40 border border-gray-700/50 rounded-xl hover:bg-gray-800/60 transition-colors group">
                                    <div className="space-y-1 mb-4 sm:mb-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-medium text-white text-lg">{calc.name}</h3>
                                            {calc.compliance_status === 'compliant' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Conforme
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {calc.compliance_status === 'warning' ? 'Revisar' : 'No Conforme'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span>{formatType(calc.calculation_type)}</span>
                                            <span>•</span>
                                            <span>{new Date(calc.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {calc.description && (
                                            <p className="text-sm text-gray-500 mt-2">{calc.description}</p>
                                        )}
                                    </div>

                                    <div className="w-full sm:w-auto">
                                        <button
                                            onClick={() => downloadReport(calc.id)}
                                            disabled={isDownloading}
                                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30"
                                        >
                                            {isDownloading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            Descargar Memoria (PDF)
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
