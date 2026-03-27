import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, ShieldCheck, ArrowLeft, Loader2, Download, Landmark, CalendarClock } from 'lucide-react';
import { useGymStore } from '../store/useStore';

export default function PaymentGateway() {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { plans, currentUser, subscribePlan, scheduleBlocks } = useGymStore();

    const [isVerifying, setIsVerifying] = useState(false);
    const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
    const [selectedSessions, setSelectedSessions] = useState<number | null>(null);

    // Verify User and Plan
    const plan = plans.find(p => p.id === planId);

    useEffect(() => {
        if (!currentUser || !plan) {
            navigate('/app/plans');
        }
    }, [currentUser, plan, navigate]);

    if (!plan || !currentUser) return null;

    const handleSimulatePayment = async () => {
        setIsVerifying(true);
        // Simulate network delay for verification
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Execute the subscription after "payment validation"
        // Pass selectedSessions if it's required for the plan
        await subscribePlan(plan.id, selectedBlocks, selectedSessions || undefined);

        alert('¡Pago Validado! Te has suscrito exitosamente al ' + plan.name);
        navigate('/app');
    };

    const handleDownloadQR = () => {
        alert('Se iniciará la descarga del código QR...');
    };

    // Session Pricing Logic
    const isPowerPlate = plan.name.toLowerCase().includes('power plate');
    const isHibrido = plan.name.toLowerCase().includes('híbrido') || plan.name.toLowerCase().includes('hibrido');
    const requiresSessions = isPowerPlate || isHibrido;

    const sessionOptions = isPowerPlate
        ? [{ count: 8, price: 360 }, { count: 12, price: 500 }]
        : isHibrido
            ? [{ count: 12, price: 350 }, { count: 20, price: 450 }]
            : [];

    const activePrice = requiresSessions
        ? (sessionOptions.find(o => o.count === selectedSessions)?.price || 0)
        : plan.price;

    const isReadyToPay = requiresSessions ? selectedSessions !== null : true;

    return (
        <div className="flex flex-col items-center justify-center py-10 px-4 animate-fade-in">
            <button
                onClick={() => navigate('/app/plans')}
                className="self-start ml-4 mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5" /> Volver a los planes
            </button>

            <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative header */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#39ff14] to-green-500"></div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Finalizar Suscripción</h2>
                    <p className="text-slate-400 text-sm">Escanea el código QR o transfiere a la cuenta bancaria para pagar el plan seleccionado.</p>
                </div>

                {/* Plan Summary Card */}
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-300 font-medium">Plan Seleccionado</span>
                        <span className="text-[#39ff14] font-bold">{plan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Monto a pagar</span>
                        <span className="text-2xl font-extrabold text-white">
                            ${activePrice > 0 ? activePrice : '--'}
                            {(!requiresSessions || selectedSessions) && <span className="text-sm text-slate-500 font-normal">/mes</span>}
                        </span>
                    </div>
                </div>

                {/* Session Choice Panel */}
                {requiresSessions && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 shadow-inner">
                        <h4 className="text-white font-medium mb-3 text-sm flex items-center gap-2">
                            <span>⚡</span> Elige tu paquete de sesiones
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {sessionOptions.map(opt => (
                                <button
                                    key={opt.count}
                                    onClick={() => setSelectedSessions(opt.count)}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedSessions === opt.count
                                        ? 'bg-[#39ff14]/10 border-[#39ff14] shadow-[0_0_15px_rgba(57,255,20,0.15)] ring-1 ring-[#39ff14]'
                                        : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                                        }`}
                                >
                                    <span className={`text-xl font-bold ${selectedSessions === opt.count ? 'text-[#39ff14]' : 'text-white'}`}>
                                        {opt.count}
                                    </span>
                                    <span className="text-xs text-slate-400 mb-1">sesiones</span>
                                    <span className="text-sm font-semibold text-white bg-slate-800 px-2 py-0.5 rounded-full mt-1">
                                        ${opt.price} bs
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selección de Horarios */}
                {(scheduleBlocks && scheduleBlocks.length > 0) && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-8 shadow-inner">
                        <h4 className="flex items-center gap-2 text-white font-medium mb-3 border-b border-slate-700 pb-2 text-sm">
                            <CalendarClock className="w-4 h-4 text-indigo-400" /> Elige tu horario base
                        </h4>
                        <p className="text-xs text-slate-400 mb-3">Puedes seleccionar los horarios en los que prevés asistir frecuentemente.</p>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {scheduleBlocks.map(block => {
                                const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                                const isSelected = selectedBlocks.includes(block.id);
                                return (
                                    <button
                                        key={block.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedBlocks(selectedBlocks.filter(id => id !== block.id));
                                            } else {
                                                setSelectedBlocks([...selectedBlocks, block.id]);
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSelected ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                                    >
                                        {days[block.dayOfWeek]} {block.startTime.slice(0, 5)} - {block.endTime.slice(0, 5)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* QR Code Mockup and Download */}
                <div className="flex flex-col items-center mb-6 gap-4">
                    <div className="bg-white p-6 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-[0_0_40px_rgba(57,255,20,0.1)] transition-transform hover:scale-105 duration-300 ease-in-out">
                        <div className="relative">
                            <QrCode className="w-full h-full text-slate-900" style={{ width: '150px', height: '150px' }} />
                            <div className="absolute inset-0 border-4 border-slate-100/50 mix-blend-overlay"></div>
                        </div>
                    </div>

                    <button onClick={handleDownloadQR} className="flex items-center gap-2 text-sm font-bold text-[#39ff14] hover:text-green-400 bg-[#39ff14]/10 hover:bg-[#39ff14]/20 px-4 py-2 rounded-full transition-colors">
                        <Download className="w-4 h-4" /> Descargar QR
                    </button>
                </div>

                {/* Bank Details */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-8 shadow-inner">
                    <h4 className="flex items-center gap-2 text-white font-medium mb-3 border-b border-slate-700 pb-2 text-sm">
                        <Landmark className="w-4 h-4 text-[#ff6a00]" /> Datos para Transferencia
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Banco</span>
                            <span className="font-semibold text-white">Banco Bisa</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Nro. de Cuenta</span>
                            <span className="font-mono text-[#39ff14] font-bold text-base">12222</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Titular</span>
                            <span className="font-semibold text-white">Gymflow Pro S.R.L.</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleSimulatePayment}
                        disabled={isVerifying || !isReadyToPay}
                        className="w-full relative py-4 px-6 rounded-xl font-bold bg-gradient-to-r from-[#39ff14] to-green-500 hover:from-green-500 hover:to-green-600 text-slate-900 shadow-lg shadow-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-2"
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Verificando Transferencia...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" /> He transferido el monto
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Pasarela de pagos segura simulada
                    </p>
                </div>
            </div>
        </div>
    );
}
