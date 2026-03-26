import { useAuthStore } from '../store/auth'

export default function Settings() {
    const { user } = useAuthStore()

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Configuración</h2>

            <div className="space-y-6">
                {/* Profile Section */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Perfil</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-gray-700 px-4 py-2 rounded opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Nombre</label>
                            <input
                                type="text"
                                value={user?.full_name || ''}
                                className="w-full bg-gray-700 px-4 py-2 rounded"
                            />
                        </div>
                        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition">
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* Organization Section */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Organización</h3>
                    <p className="text-gray-400">Información de la organización próximamente...</p>
                </div>

                {/* Security Section */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Seguridad</h3>
                    <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition">
                        Cambiar Contraseña
                    </button>
                </div>
            </div>
        </div>
    )
}
