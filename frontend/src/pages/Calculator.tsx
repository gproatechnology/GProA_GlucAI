import { useState } from 'react'
import {
    useVoltageDropCalculation,
    useConductorSizingCalculation,
    mockVoltageDropResult,
    mockConductorSizingResult,
    type CalculationResult,
    type VoltageDropInput,
    type ConductorSizingInput
} from '../hooks/useCalculations'
import {
    Zap,
    Activity,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    BookOpen,
    Loader2,
    Settings2,
    ArrowRight
} from 'lucide-react'

type CalculationType = 'voltage-drop' | 'conductor' | 'short-circuit'

export default function Calculator() {
    const [calcType, setCalcType] = useState<CalculationType>('voltage-drop')
    const [result, setResult] = useState<CalculationResult | null>(null)
    const [isCalculating, setIsCalculating] = useState(false)

    // Form states for voltage drop
    const [vdForm, setVdForm] = useState<VoltageDropInput>({
        conductor_material: 'copper',
        conductor_size: '4 AWG',
        length: 100,
        current: 50,
        power_factor: 0.85,
        voltage: 480,
        phases: 3
    })

    // Form states for conductor sizing
    const [csForm, setCsForm] = useState<ConductorSizingInput>({
        load_current: 70,
        ambient_temperature: 30,
        insulation_type: 'THHN',
        conduit_type: 'PVC',
        num_conductors: 3,
        voltage: 480
    })

    const voltageDropMutation = useVoltageDropCalculation()
    const conductorSizingMutation = useConductorSizingCalculation()

    // Available options
    const conductorSizes = [
        '14 AWG', '12 AWG', '10 AWG', '8 AWG', '6 AWG', '4 AWG', '2 AWG', '1 AWG',
        '1/0 AWG', '2/0 AWG', '3/0 AWG', '4/0 AWG', '250 kcmil', '300 kcmil',
        '350 kcmil', '400 kcmil', '500 kcmil'
    ]

    const handleVoltageDropCalc = async () => {
        setIsCalculating(true)
        try {
            const res = await voltageDropMutation.mutateAsync(vdForm)
            setResult(res)
        } catch {
            console.log('Using mock data for voltage drop')
            setResult(mockVoltageDropResult)
        } finally {
            setIsCalculating(false)
        }
    }

    const handleConductorSizingCalc = async () => {
        setIsCalculating(true)
        try {
            const res = await conductorSizingMutation.mutateAsync(csForm)
            setResult(res)
        } catch {
            console.log('Using mock data for conductor sizing')
            setResult(mockConductorSizingResult)
        } finally {
            setIsCalculating(false)
        }
    }

    const handleCalculate = () => {
        if (calcType === 'voltage-drop') {
            handleVoltageDropCalc()
        } else if (calcType === 'conductor') {
            handleConductorSizingCalc()
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'compliant': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />
            case 'non_compliant': return <XCircle className="w-5 h-5 text-red-400" />
            default: return <Info className="w-5 h-5 text-zinc-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'compliant': return 'text-emerald-400'
            case 'warning': return 'text-amber-400'
            case 'non_compliant': return 'text-red-400'
            default: return 'text-zinc-400'
        }
    }

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'compliant': return 'bg-emerald-500/10 border-emerald-500/30'
            case 'warning': return 'bg-amber-500/10 border-amber-500/30'
            case 'non_compliant': return 'bg-red-500/10 border-red-500/30'
            default: return 'bg-zinc-500/10 border-zinc-500/30'
        }
    }

    const renderInput = (
        label: string,
        value: string | number,
        onChange: (val: string) => void,
        type: string = 'text',
        options?: { value: string | number, label: string }[],
        step?: string,
        min?: string,
        max?: string
    ) => (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
            {options ? (
                <div className="relative">
                    <select
                        className="input-field w-full appearance-none pr-10"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    >
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-zinc-800">{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            ) : (
                <input
                    type={type}
                    className="input-field w-full"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    step={step}
                    min={min}
                    max={max}
                />
            )}
        </div>
    )

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Motor de Cálculo</h1>
                    <p className="text-sm text-zinc-400 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Alineado con NOM-001-SEDE-2012 y NEC-2020
                    </p>
                </div>
            </div>

            {/* Type Selector Tabs */}
            <div className="flex gap-2 p-1 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)] w-fit">
                <button
                    onClick={() => { setCalcType('voltage-drop'); setResult(null) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === 'voltage-drop'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Zap className="w-4 h-4" />
                    Caída de Tensión
                </button>
                <button
                    onClick={() => { setCalcType('conductor'); setResult(null) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === 'conductor'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Settings2 className="w-4 h-4" />
                    Dimensionamiento
                </button>
                <button
                    onClick={() => { setCalcType('short-circuit'); setResult(null) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === 'short-circuit'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }`}
                >
                    <Activity className="w-4 h-4" />
                    Cortocircuito <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Beta</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── Input Panel ────────────────────────────────────── */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="glass-card p-6 flex-1">

                        {calcType === 'voltage-drop' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">Parámetros del Sistema</h3>
                                    <Zap className="w-5 h-5 text-blue-400" />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    {renderInput('Material', vdForm.conductor_material, (v) => setVdForm({ ...vdForm, conductor_material: v as 'copper' | 'aluminum' }), 'text', [
                                        { value: 'copper', label: 'Cobre' },
                                        { value: 'aluminum', label: 'Aluminio' }
                                    ])}
                                    {renderInput('Calibre', vdForm.conductor_size, (v) => setVdForm({ ...vdForm, conductor_size: v }), 'text', conductorSizes.map(s => ({ value: s, label: s })))}
                                    {renderInput('Corriente (A)', vdForm.current, (v) => setVdForm({ ...vdForm, current: parseFloat(v) || 0 }), 'number')}
                                    {renderInput('Longitud (m)', vdForm.length, (v) => setVdForm({ ...vdForm, length: parseFloat(v) || 0 }), 'number')}
                                    {renderInput('Tensión (V)', vdForm.voltage, (v) => setVdForm({ ...vdForm, voltage: parseFloat(v) }), 'text', [
                                        { value: '120', label: '120 V' }, { value: '208', label: '208 V' }, { value: '220', label: '220 V' },
                                        { value: '240', label: '240 V' }, { value: '277', label: '277 V' }, { value: '440', label: '440 V' },
                                        { value: '480', label: '480 V' }, { value: '600', label: '600 V' }
                                    ])}
                                    {renderInput('Fases', vdForm.phases ?? 3, (v) => setVdForm({ ...vdForm, phases: parseInt(v) as 1 | 3 }), 'text', [
                                        { value: '1', label: 'Monofásico' }, { value: '3', label: 'Trifásico' }
                                    ])}
                                </div>
                                {renderInput('Factor de Potencia', vdForm.power_factor ?? 0.85, (v) => setVdForm({ ...vdForm, power_factor: parseFloat(v) || 0.85 }), 'number', undefined, '0.01', '0', '1')}
                            </div>
                        )}

                        {calcType === 'conductor' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">Configuración de Carga</h3>
                                    <Settings2 className="w-5 h-5 text-blue-400" />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    {renderInput('Corriente de Carga (A)', csForm.load_current, (v) => setCsForm({ ...csForm, load_current: parseFloat(v) || 0 }), 'number')}
                                    {renderInput('Temp. Ambiente (°C)', csForm.ambient_temperature ?? 30, (v) => setCsForm({ ...csForm, ambient_temperature: parseFloat(v) || 30 }), 'number')}
                                    {renderInput('Aislamiento', csForm.insulation_type ?? '', (v) => setCsForm({ ...csForm, insulation_type: v }), 'text', [
                                        { value: 'THHN', label: 'THHN' }, { value: 'THWN', label: 'THWN' }, { value: 'THWN-2', label: 'THWN-2' },
                                        { value: 'XHHW', label: 'XHHW' }, { value: 'XHHW-2', label: 'XHHW-2' }
                                    ])}
                                    {renderInput('Ducto', csForm.conduit_type ?? '', (v) => setCsForm({ ...csForm, conduit_type: v }), 'text', [
                                        { value: 'PVC', label: 'PVC' }, { value: 'EMT', label: 'EMT' }, { value: 'RMC', label: 'RMC' }, { value: 'FMC', label: 'FMC' }
                                    ])}
                                    {renderInput('Número Conductores', csForm.num_conductors ?? 3, (v) => setCsForm({ ...csForm, num_conductors: parseInt(v) || 3 }), 'number', undefined, '1', '1', '10')}
                                    {renderInput('Tensión (V)', csForm.voltage ?? 480, (v) => setCsForm({ ...csForm, voltage: parseFloat(v) }), 'text', [
                                        { value: '120', label: '120 V' }, { value: '208', label: '208 V' }, { value: '240', label: '240 V' },
                                        { value: '277', label: '277 V' }, { value: '480', label: '480 V' }, { value: '600', label: '600 V' }
                                    ])}
                                </div>
                            </div>
                        )}

                        {calcType === 'short-circuit' && (
                            <div className="space-y-4 animate-fade-in">
                                <h3 className="text-lg font-semibold text-white">Cortocircuito</h3>
                                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 flex items-start gap-3">
                                    <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-amber-400 font-medium text-sm">Próximamente</p>
                                        <p className="text-amber-400/80 text-xs mt-1">Este módulo está actualmente en desarrollo y se liberará en la próxima actualización majeure.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCalculate}
                        disabled={isCalculating || calcType === 'short-circuit'}
                        className="btn-primary w-full py-4 text-lg shadow-xl shadow-blue-500/20 disabled:shadow-none"
                    >
                        {isCalculating ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Procesando...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                Ejecutar Análisis
                                <ArrowRight className="w-5 h-5" />
                            </span>
                        )}
                    </button>
                </div>

                {/* ── Output Panel ────────────────────────────────────── */}
                <div className="lg:col-span-7">
                    <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden">

                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-semibold text-white">Resultados y Diagnóstico</h3>
                            {result && (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-opacity-30 ${getStatusBg(result.compliance_status)}`}>
                                    {getStatusIcon(result.compliance_status)}
                                    <span className={`text-sm font-semibold uppercase tracking-wider ${getStatusColor(result.compliance_status)}`}>
                                        {result.compliance_status === 'compliant' ? 'Conforme' :
                                            result.compliance_status === 'warning' ? 'Advertencia' : 'No Conforme'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {!result ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                                <div className="w-20 h-20 rounded-full bg-[var(--bg-muted)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">
                                    <Zap className="w-8 h-8 text-zinc-500" strokeWidth={1} />
                                </div>
                                <h4 className="text-zinc-300 font-medium text-lg mb-2">Ingresa los parámetros</h4>
                                <p className="text-zinc-500 text-sm max-w-sm">
                                    Define la configuración en el panel izquierdo y presiona "Ejecutar Análisis" para obtener dimensionamiento y validación normativa.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in z-10">

                                {/* Metrics Grid */}
                                {calcType === 'voltage-drop' && result.voltage_drop_volts !== undefined && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="stat-card">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Caída Tensión</p>
                                            <p className="text-2xl font-bold text-blue-400">{result.voltage_drop_volts}<span className="text-sm font-normal text-zinc-500 ml-1">V</span></p>
                                        </div>
                                        <div className="stat-card">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Porcentaje</p>
                                            <p className="text-2xl font-bold text-blue-400">{result.voltage_drop_percent}<span className="text-sm font-normal text-zinc-500 ml-1">%</span></p>
                                        </div>
                                        <div className="stat-card">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Tensión Final</p>
                                            <p className="text-2xl font-bold text-white">{result.final_voltage}<span className="text-sm font-normal text-zinc-500 ml-1">V</span></p>
                                        </div>
                                        <div className="stat-card">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Límite NEC</p>
                                            <p className="text-2xl font-bold text-zinc-300">3%</p>
                                        </div>
                                    </div>
                                )}

                                {calcType === 'conductor' && result.minimum_conductor_size && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="stat-card">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Calibre Mín</p>
                                            <p className="text-xl font-bold text-blue-400">{result.minimum_conductor_size}</p>
                                        </div>
                                        <div className="stat-card">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Ampacidad</p>
                                            <p className="text-2xl font-bold text-blue-400">{result.required_ampacity}<span className="text-sm font-normal text-zinc-500 ml-1">A</span></p>
                                        </div>
                                        <div className="stat-card">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Factor (T)</p>
                                            <p className="text-2xl font-bold text-white">{result.temperature_correction_factor}</p>
                                        </div>
                                        <div className="stat-card">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Temp Amb.</p>
                                            <p className="text-2xl font-bold text-zinc-300">{csForm.ambient_temperature}<span className="text-sm font-normal text-zinc-500 ml-1">°C</span></p>
                                        </div>
                                    </div>
                                )}

                                {/* Feedback Blocks */}
                                {(result.violations.length > 0 || result.recommendations.length > 0) && (
                                    <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
                                        {result.violations.length > 0 && (
                                            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                                                <h4 className="flex items-center gap-2 font-semibold text-red-400 mb-3 text-sm uppercase tracking-wide">
                                                    <AlertTriangle className="w-4 h-4" /> Infracciones Normativas
                                                </h4>
                                                <ul className="space-y-2">
                                                    {result.violations.map((v, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                                                            <span className="font-mono bg-red-500/20 px-1.5 py-0.5 rounded mt-0.5 text-[10px] shrink-0">{v.code}</span>
                                                            <span className="leading-snug">{v.message}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {result.recommendations.length > 0 && (
                                            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                                <h4 className="flex items-center gap-2 font-semibold text-emerald-400 mb-3 text-sm uppercase tracking-wide">
                                                    <Info className="w-4 h-4" /> Recomendaciones de Diseño
                                                </h4>
                                                <ul className="space-y-2">
                                                    {result.recommendations.map((r, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-emerald-300">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                                            <span className="leading-snug">{r}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Standards */}
                                {result.standards_referenced.length > 0 && (
                                    <div className="pt-4 flex items-center gap-3 flex-wrap">
                                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
                                            <BookOpen className="w-3.5 h-3.5" /> Referencias:
                                        </span>
                                        {result.standards_referenced.map((s, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-md text-xs font-mono text-zinc-300">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
