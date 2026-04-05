import { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';

interface Message {
    from: 'bot' | 'user';
    text: string;
}

interface ChatbotFaqProps {
    adminPhone?: string;
}

const FAQ_RESPONSES: Record<string, string> = {
    horario: '⏰ Los horarios de Power Plate están disponibles en la sección de "Mis Clases". Puedes inscribirte a cualquier clase activa desde ahí.',
    schedule: '⏰ Los horarios de Power Plate están disponibles en la sección de "Mis Clases". Revisa las clases disponibles ahí.',
    congel: '❄️ Para congelar tu plan: ve al inicio de tu perfil → "Pausar Membresía". Las condiciones son: inicio con 1 día de antelación, mínimo 6 días de pausa y máximo 1 mes. El administrador aprueba la solicitud.',
    pausa: '❄️ Para pausar tu membresía, usa el botón "Pausar Membresía" en tu perfil. Debes justificar tu solicitud y respetar los mínimos de 6 días de inasistencia.',
    cancel: '🚫 Política de cancelación: el congelamiento de plan es la vía oficial para ausencias. Para cancelar una clase inscrita, contacta directamente al administrador con al menos 24h de anticipación.',
    precio: '💰 Los precios de los planes están disponibles en la sección de "Planes". Para actualizar tu paquete de sesiones, visita esa sección.',
    sesion: '💪 Tu saldo de sesiones aparece en el resumen de tu perfil. Cuando queden 3 o menos, recibirás una alerta automática.',
    renovar: '🔄 Para renovar tu plan visita la sección "Planes" y selecciona el mismo plan u otro que prefieras.',
    pago: '💸 Los pagos se realizan vía transferencia bancaria. Escanea el QR en la pasarela de pago o transfiere a los datos indicados.',
};

const GREETING = '👋 ¡Hola! Soy el asistente de GymFlow Pro. Escribe tu consulta y te ayudaré.\n\nPuedo orientarte sobre *horarios*, *congelamiento de plan*, *cancelaciones*, *precios*, *sesiones* y *pagos*.';

export default function ChatbotFaq({ adminPhone }: ChatbotFaqProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([{ from: 'bot', text: GREETING }]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        const userMsg: Message = { from: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        const lower = trimmed.toLowerCase();
        const matchKey = Object.keys(FAQ_RESPONSES).find(k => lower.includes(k));

        setTimeout(() => {
            if (matchKey) {
                setMessages(prev => [...prev, { from: 'bot', text: FAQ_RESPONSES[matchKey] }]);
            } else {
                const fallback: Message = {
                    from: 'bot',
                    text: '🤔 No encontré una respuesta exacta para eso. Puedes contactar directamente al administrador para resolver tu duda:'
                };
                setMessages(prev => [...prev, fallback]);
                if (adminPhone) {
                    const waMsg: Message = {
                        from: 'bot',
                        text: `💬 [Abrir WhatsApp con el Admin](https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, tengo una consulta sobre GymFlow Pro: ' + trimmed)})`
                    };
                    setMessages(prev => [...prev, waMsg]);
                }
            }
        }, 400);
    };

    return (
        <>
            {/* Floating Bubble */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#39ff14] to-green-600 text-slate-900 shadow-lg shadow-green-900/30 flex items-center justify-center hover:scale-110 transition-transform"
                title="Asistente FAQ"
            >
                <MessageCircle className="w-7 h-7" />
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-80 max-h-[500px] bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="text-[#39ff14] text-lg">🤖</span>
                            <span className="text-white font-semibold text-sm">Asistente GymFlow</span>
                            <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse"></span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.from === 'user'
                                        ? 'bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/20'
                                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                                    }`}>
                                    {msg.text.includes('](https://') ? (
                                        // Render markdown-style links
                                        msg.text.split(/(\[.*?\]\(https?:\/\/[^)]+\))/g).map((part, j) => {
                                            const match = part.match(/\[(.*?)\]\((https?:\/\/[^)]+)\)/);
                                            if (match) {
                                                return <a key={j} href={match[2]} target="_blank" rel="noreferrer"
                                                    className="text-green-400 underline hover:text-green-300">{match[1]}</a>;
                                            }
                                            return <span key={j}>{part}</span>;
                                        })
                                    ) : msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-700 flex gap-2 bg-slate-800/50">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe tu consulta..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#39ff14]"
                        />
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
