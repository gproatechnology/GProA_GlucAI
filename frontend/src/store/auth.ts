import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string
    email: string
    full_name: string | null
    role: string
    organization_id: string
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    setAuth: (user: User, token: string) => void
    logout: () => void
    updateUser: (user: Partial<User>) => void
    loginBypass: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setAuth: (user, token) =>
                set({
                    user,
                    token,
                    isAuthenticated: true,
                }),
            logout: () =>
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                }),
            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),
            loginBypass: () =>
                set({
                    user: {
                        id: 'bypass-user-id',
                        email: 'bypass@gecrai.com',
                        full_name: 'Debug User (Bypass)',
                        role: 'admin',
                        organization_id: 'bypass-org-id',
                    },
                    token: 'bypass-token',
                    isAuthenticated: true,
                }),
        }),
        {
            name: 'gecrai-auth',
        }
    )
)
