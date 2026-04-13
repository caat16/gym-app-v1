import { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Send, ChevronRight } from 'lucide-react';

interface Message {
    from: 'bot' | 'user';
    text?: string;
    jsx?: React.ReactNode;
}

interface ChatbotFaqProps {
    adminPhone?: string;
}

const ADMIN_PHONE = '59172209791';

const GREETING_JSX = (
    <div className="space-y-2">
        <p className="font-semibold text-white">👋 ¡Hola! Soy el asistente de GymFlow Pro.</p>
        <p className="text-slate-300 text-xs">Selecciona una opción o escribe tu consulta:</p>
    </div>
);

const FLOWS: Record<string, { label: string; icon: string; message: React.ReactNode; waText: string }> = {
    reinscripcion: {
        label: 'Reinscripción',
        icon: '🔄',
        message: (
            <div className="space-y-1.5">
                <p className="font-semibold text-white">🔄 Reinscripción de plan</p>
                <ul className="text-xs text-slate-300 space-y-1 list-none">
                    <li>✅ Puedes renovar tu plan actual o cambiarlo</li>
                    <li>✅ El nuevo período inicia al vencer el actual</li>
                    <li>✅ Mantén tus sesiones acumuladas en Power Plate</li>
                </ul>
            </div>
        ),
        waText: 'Hola, quiero reinscribirme o renovar mi plan en GymFlow Pro.'
    },
    pago: {
        label: 'Pago',
        icon: '💳',
        message: (
            <div className="space-y-1.5">
                <p className="font-semibold text-white">💳 Métodos de pago</p>
                <ul className="text-xs text-slate-300 space-y-1 list-none">
                    <li>💵 Efectivo en instalaciones</li>
                    <li>📲 Transferencia bancaria (QR disponible en la app)</li>
                    <li>📩 Envía tu comprobante al administrador</li>
                </ul>
            </div>
        ),
        waText: 'Hola, quiero realizar un pago por mi membresía en GymFlow Pro.'
    },
    cambio: {
        label: 'Cambio de Plan',
        icon: '⚡',
        message: (
            <div className="space-y-1.5">
                <p className="font-semibold text-white">⚡ Cambio de plan</p>
                <ul className="text-xs text-slate-300 space-y-1 list-none">
                    <li>✅ Puedes cambiar de categoría en cualquier momento</li>
                    <li>⚠️ El entrenador ajustará tu rutina automáticamente</li>
                    <li>📋 Notifica con al menos 3 días de antelación</li>
                </ul>
            </div>
        ),
        waText: 'Hola, quiero cambiar mi plan o categoría en GymFlow Pro.'
    }
};

const FAQ_TEXT: Record<string, React.ReactNode> = {
    horario: (
        <div className="space-y-1">
            <p className="font-semibold text-white">⏰ Horarios</p>
            <p className="text-xs text-slate-300">Los horarios de Power Plate están en la sección <strong>Mis Clases</strong> de tu perfil. Puedes inscribirte a cualquier slot disponible.</p>
        </div>
    ),
    congel: (
        <div className="space-y-1">
            <p className="font-semibold text-white">❄️ Congelamiento de plan</p>
            <ul className="text-xs text-slate-300 space-y-0.5 list-none">
                <li>• Mínimo: 6 días de pausa</li>
                <li>• Máximo: 1 mes corrido</li>
                <li>• Inicio: mínimo 1 día de anticipación</li>
                <li>• Requiere aprobación del administrador</li>
            </ul>
        </div>
    ),
    pausa: (
        <div className="space-y-1">
            <p className="font-semibold text-white">❄️ Pausar membresía</p>
            <p className="text-xs text-slate-300">Ve a tu perfil → sección <strong>Pausar Membresía</strong>. Ingresa las fechas y justificación. El admin lo revisará.</p>
        </div>
    ),
    sesion: (
        <div className="space-y-1">
            <p className="font-semibold text-white">💪 Sesiones restantes</p>
            <p className="text-xs text-slate-300">Tu saldo de sesiones aparece en el resumen de tu perfil. Cuando queden 3 o menos, recibirás una alerta automática.</p>
        </div>
    ),
};

export default function ChatbotFaq({ adminPhone = ADMIN_PHONE }: ChatbotFaqProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([{ from: 'bot', jsx: GREETING_JSX }]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addBotMessage = (jsx: React.ReactNode) => {
        setMessages(prev => [...prev, { from: 'bot', jsx }]);
    };

    const handleFlow = (key: keyof typeof FLOWS) => {
        const flow = FLOWS[key];
        const responseJsx = (
            <div className="space-y-2">
                {flow.message}
                <a href={`https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(flow.waText)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors mt-1">
                    <MessageCircle className="w-3.5 h-3.5" /> Contactar Admin por WhatsApp
                </a>
            </div>
        );
        addBotMessage(responseJsx);
    };

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setMessages(prev => [...prev, { from: 'user', text: trimmed }]);
        setInput('');
        const lower = trimmed.toLowerCase();

        setTimeout(() => {
            const matchedFaq = Object.entries(FAQ_TEXT).find(([key]) => lower.includes(key));
            if (matchedFaq) {
                addBotMessage(matchedFaq[1]);
            } else if (lower.includes('renov') || lower.includes('reinscr')) {
                handleFlow('reinscripcion');
            } else if (lower.includes('pago') || lower.includes('transfere') || lower.includes('qr')) {
                handleFlow('pago');
            } else if (lower.includes('cambio') || lower.includes('cambiar') || lower.includes('plan')) {
                handleFlow('cambio');
            } else {
                addBotMessage(
                    <div className="space-y-2">
                        <p className="text-slate-300 text-xs">No encontré respuesta exacta. Contacta directamente al administrador:</p>
                        <a href={`https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, tengo una consulta: ' + trimmed)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                            <MessageCircle className="w-3.5 h-3.5" /> Abrir WhatsApp
                        </a>
                    </div>
                );
            }
        }, 350);
    };

    const QuickActionButton = ({ flowKey }: { flowKey: keyof typeof FLOWS }) => {
        const flow = FLOWS[flowKey];
        return (
            <button onClick={() => {
                setMessages(prev => [...prev, { from: 'user', text: `${flow.icon} ${flow.label}` }]);
                setTimeout(() => handleFlow(flowKey), 300);
            }}
                className="flex items-center justify-between w-full bg-slate-900 hover:bg-slate-700 border border-slate-700 hover:border-[#39ff14]/30 text-white rounded-xl px-3 py-2.5 text-xs font-medium transition-all group">
                <span className="flex items-center gap-2">
                    <span>{flow.icon}</span>
                    <span>{flow.label}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#39ff14] transition-colors" />
            </button>
        );
    };

    return (
        <>
            {/* Floating Bubble */}
            <button onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#39ff14] to-green-600 text-slate-900 shadow-lg shadow-green-900/30 flex items-center justify-center hover:scale-110 transition-transform"
                title="Asistente FAQ">
                <MessageCircle className="w-7 h-7" />
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-80 max-h-[520px] bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[#39ff14] text-lg">🤖</span>
                            <span className="text-white font-semibold text-sm">Asistente GymFlow</span>
                            <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.from === 'user'
                                        ? 'bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/20'
                                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                                    }`}>
                                    {msg.jsx || msg.text}
                                </div>
                            </div>
                        ))}

                        {/* Quick Action Buttons — show after greeting only */}
                        {messages.length <= 1 && (
                            <div className="space-y-2 mt-1">
                                {(Object.keys(FLOWS) as (keyof typeof FLOWS)[]).map(key => (
                                    <QuickActionButton key={key} flowKey={key} />
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-700 flex gap-2 bg-slate-800/50 flex-shrink-0">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe tu consulta..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#39ff14]" />
                        <button onClick={handleSend}
                            className="bg-[#39ff14] text-slate-900 rounded-xl px-3 py-2 hover:bg-green-400 transition-colors flex items-center">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
