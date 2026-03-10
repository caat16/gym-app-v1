import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useGymStore } from '../store/useStore';

export default function PaymentGateway() {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { plans, currentUser, subscribePlan } = useGymStore();

    const [isVerifying, setIsVerifying] = useState(false);

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
        await subscribePlan(plan.id);

        alert('¡Pago Validado! Te has suscrito exitosamente al ' + plan.name);
        navigate('/app');
    };

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
                    <p className="text-slate-400 text-sm">Escanea el código QR para transferir el pago del plan seleccionado.</p>
                </div>

                {/* Plan Summary Card */}
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-300 font-medium">Plan Seleccionado</span>
                        <span className="text-[#39ff14] font-bold">{plan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Monto a pagar</span>
                        <span className="text-2xl font-extrabold text-white">${plan.price}<span className="text-sm text-slate-500 font-normal">/mes</span></span>
                    </div>
                </div>

                {/* QR Code Mockup */}
                <div className="bg-white p-6 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-[0_0_40px_rgba(57,255,20,0.1)] mb-8 transition-transform hover:scale-105 duration-300 ease-in-out">
                    <div className="relative">
                        <QrCode className="w-full h-full text-slate-900" style={{ width: '150px', height: '150px' }} />
                        <div className="absolute inset-0 border-4 border-slate-100/50 mix-blend-overlay"></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleSimulatePayment}
                        disabled={isVerifying}
                        className="w-full relative py-4 px-6 rounded-xl font-bold bg-gradient-to-r from-[#39ff14] to-green-500 hover:from-green-500 hover:to-green-600 text-slate-900 shadow-lg shadow-green-900/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-2"
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
