import { useEffect, useRef } from 'react';
import { AlertTriangle, Zap } from 'lucide-react';

interface ExpiryAlertModalProps {
    isOpen: boolean;
    onAccept: () => void;
    daysRemaining?: number;
    sessionsRemaining?: number;
    planName?: string;
    isPowerPlate?: boolean;
}

export default function ExpiryAlertModal({
    isOpen,
    onAccept,
    daysRemaining,
    sessionsRemaining,
    planName,
    isPowerPlate,
}: ExpiryAlertModalProps) {
    const btnRef = useRef<HTMLButtonElement>(null);

    // Block Escape key from closing the modal
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') e.preventDefault();
        };
        document.addEventListener('keydown', handler, { capture: true });
        // Focus the accept button for accessibility
        setTimeout(() => btnRef.current?.focus(), 100);
        return () => document.removeEventListener('keydown', handler, { capture: true });
    }, [isOpen]);

    if (!isOpen) return null;

    const isSessionsAlert = isPowerPlate && sessionsRemaining !== undefined && sessionsRemaining <= 3;
    const title = isSessionsAlert
        ? '¡Pocas sesiones restantes!'
        : '¡Atención! Tu plan vence pronto';

    const subtitle = isSessionsAlert
        ? `Solo te quedan ${sessionsRemaining} sesión${sessionsRemaining !== 1 ? 'es' : ''} de ${planName || 'Power Plate'}.`
        : `Tu plan ${planName || ''} vence en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}.`;

    const accentColor = isSessionsAlert ? 'from-green-500/20 to-green-900/10 border-green-500/40' : 'from-orange-500/20 to-red-900/10 border-orange-500/40';
    const iconColor = isSessionsAlert ? 'text-[#39ff14]' : 'text-[#ff6a00]';
    const btnColor = isSessionsAlert
        ? 'bg-[#39ff14] hover:bg-green-400 text-slate-900'
        : 'bg-gradient-to-r from-[#ff6a00] to-orange-500 hover:from-orange-500 hover:to-[#ff6a00] text-white';

    return (
        // Backdrop: pointer-events & onMouseDown suppressed — strict modal, no close on backdrop click
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className={`relative w-full max-w-md rounded-3xl border bg-gradient-to-br ${accentColor} bg-slate-900 shadow-2xl overflow-hidden animate-fade-in`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative glow */}
                <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 ${isSessionsAlert ? 'bg-green-400' : 'bg-orange-500'}`} />
                <div className={`absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-10 ${isSessionsAlert ? 'bg-green-600' : 'bg-red-600'}`} />

                {/* Content */}
                <div className="relative z-10 p-8 flex flex-col items-center text-center gap-5">
                    {/* Icon */}
                    <div className={`p-4 rounded-2xl ${isSessionsAlert ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                        {isSessionsAlert
                            ? <Zap className={`w-10 h-10 ${iconColor}`} />
                            : <AlertTriangle className={`w-10 h-10 ${iconColor} animate-pulse`} />
                        }
                    </div>

                    {/* Title */}
                    <div>
                        <h2 className={`text-2xl font-black text-white mb-2`}>{title}</h2>
                        <p className="text-slate-300 text-base leading-relaxed">{subtitle}</p>
                        <p className="text-slate-400 text-sm mt-2">
                            {isSessionsAlert
                                ? 'Renueva tu paquete de sesiones para no perder tu progreso.'
                                : 'Renueva tu membresía para seguir entrenando sin interrupciones.'}
                        </p>
                    </div>

                    {/* Stats pill */}
                    <div className={`px-5 py-2 rounded-full border text-sm font-bold ${isSessionsAlert
                        ? 'bg-green-500/10 border-green-500/30 text-[#39ff14]'
                        : 'bg-orange-500/10 border-orange-500/30 text-[#ff6a00]'
                        }`}>
                        {isSessionsAlert
                            ? `${sessionsRemaining} sesión${sessionsRemaining !== 1 ? 'es' : ''} restante${sessionsRemaining !== 1 ? 's' : ''}`
                            : `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                        }
                    </div>

                    {/* Accept Button */}
                    <button
                        ref={btnRef}
                        onClick={onAccept}
                        className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all duration-200 active:scale-[0.97] ${btnColor}`}
                    >
                        Aceptar y continuar
                    </button>

                    <p className="text-xs text-slate-600">
                        No se mostrará de nuevo en esta sesión
                    </p>
                </div>
            </div>
        </div>
    );
}
