import React from 'react'
import { useNotificationStore, NotificationType } from '../store/notification'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const icons: Record<NotificationType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
}

const styles: Record<NotificationType, string> = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
}

export function ToastContainer() {
    const { notifications, removeNotification } = useNotificationStore()

    if (notifications.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className={cn(
                        'pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-4 fade-in duration-300',
                        styles[n.type]
                    )}
                >
                    <div className="mt-0.5">{icons[n.type]}</div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold">{n.message}</h4>
                        {n.description && <p className="mt-1 text-xs opacity-80">{n.description}</p>}
                    </div>
                    <button
                        onClick={() => removeNotification(n.id)}
                        className="mt-0.5 text-current opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
