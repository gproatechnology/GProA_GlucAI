import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { authApi } from '../services/api'
import { Zap, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await authApi.login(email, password)
            const { access_token, user } = response.data
            setAuth(user, access_token)
            navigate('/dashboard')
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } }
            setError(error.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.')
        } finally {
            setLoading(false)
        }
    }

    const handleBypass = () => {
        setAuth({
            id: 'dev-user-1',
            email: 'dev@gecrai.local',
            full_name: 'Developer Bypass',
            organization_id: 'org-dev-1',
            role: 'admin',
        }, 'bypass-token')
        navigate('/dashboard')
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" style={{ background: 'var(--bg-base)' }}>

            {/* Background decorations */}
            <div className="absolute top-1/4 -left-64 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'var(--gradient-brand)', boxShadow: 'var(--glow-blue)' }}>
                        <Zap className="w-8 h-8 text-white animate-pulse" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        Bienvenido a <span className="text-gradient">GECRAI</span>
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Plataforma inteligente para ingenieria eléctrica
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        Iniciar Sesión
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="tu@empresa.com"
                                    required
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Contraseña
                                </label>
                                <a href="#" className="text-xs transition-colors hover:text-white" style={{ color: 'var(--color-brand-primary)' }}>
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verificando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Acceder a mi cuenta
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            ¿No tienes cuenta?{' '}
                            <Link to="/register" className="font-medium transition-colors hover:text-white" style={{ color: 'var(--color-brand-primary)' }}>
                                Solicita acceso
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    <p>GECRAI version 1.2.0 • Protegido por encriptación de grado militar</p>
                    <button
                        onClick={handleBypass}
                        className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700"
                    >
                        [Modo Desarrollo] Entrar sin credenciales
                    </button>
                </div>
            </div>
        </div>
    )
}
