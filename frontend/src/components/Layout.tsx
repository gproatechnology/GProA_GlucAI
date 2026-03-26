import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import {
    LayoutDashboard,
    FolderKanban,
    Zap,
    Settings,
    LogOut,
    ChevronRight,
    Bell,
    User,
} from 'lucide-react'

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Proyectos', icon: FolderKanban },
    { to: '/calculator', label: 'Calculadora', icon: Zap },
    { to: '/settings', label: 'Configuración', icon: Settings },
]

export default function Layout() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Extract initials for avatar
    const initials = user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : 'GC'

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

            {/* ── Sidebar ─────────────────────────────────── */}
            <aside
                className="w-60 flex-shrink-0 flex flex-col"
                style={{
                    background: 'var(--bg-surface)',
                    borderRight: '1px solid var(--border-subtle)',
                }}
            >
                {/* Logo */}
                <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--gradient-brand)' }}
                    >
                        <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>GECRAI</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>v1.2 Platform</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'nav-item-active'
                                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        className="w-4 h-4 flex-shrink-0 transition-colors"
                                        style={{ color: isActive ? 'var(--color-brand-primary)' : undefined }}
                                    />
                                    <span className="flex-1">{label}</span>
                                    {isActive && (
                                        <ChevronRight className="w-3 h-3 opacity-60" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                        {/* Avatar */}
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--gradient-brand)', color: 'white' }}
                        >
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.email}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Free Plan</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1 rounded-lg transition-colors hover:text-red-400"
                            style={{ color: 'var(--text-muted)' }}
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Area ───────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top Bar */}
                <header
                    className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                    style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'rgba(9,9,11,0.6)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                >
                    {/* Breadcrumb placeholder — pages can fill this via a context/slot */}
                    <div id="topbar-breadcrumb" />

                    <div className="flex items-center gap-2">
                        <button
                            className="btn-ghost p-2"
                            title="Notificaciones"
                        >
                            <Bell className="w-4 h-4" />
                        </button>
                        <button
                            className="btn-ghost p-2"
                            title="Perfil"
                        >
                            <User className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
