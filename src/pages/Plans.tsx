import { useGymStore } from '../store/useStore';
import { Check, ShieldCheck } from 'lucide-react';
import { cn } from '../components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';

export default function Plans() {
    const { plans, currentUser, subscribePlan } = useGymStore();
    const navigate = useNavigate();

    const handleSubscribe = (planId: string) => {
        if (currentUser?.role === 'trainer') {
            alert('Los entrenadores no pueden suscribirse a planes.');
            return;
        }
        subscribePlan(planId);
        alert('¡Te has suscrito al plan exitosamente!');
        navigate('/app');
    };

    const currentPlanId = currentUser?.subscription?.planId;

    return (
        <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-4xl font-bold tracking-tight text-white mb-4">Elige tu Nivel de <span className="text-[#39ff14]">Energía</span></h2>
                <p className="text-slate-400 text-lg">Nuestros planes están diseñados para adaptarse a tus objetivos, seas principiante o atleta de élite.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {plans.map((plan) => {
                    const isCurrent = plan.id === currentPlanId && currentUser?.role !== 'trainer';
                    // Make Plan Híbrido and Power Plate pop out more as premium options
                    const isPremium = plan.name.includes('Híbrido') || plan.name.includes('Power');

                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative flex flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2",
                                isPremium
                                    ? "bg-gradient-to-b from-slate-800 to-slate-900 border border-[#ff6a00]/50 shadow-[0_0_30px_rgba(255,106,0,0.1)]"
                                    : "bg-slate-800 border border-slate-700 shadow-xl",
                                isCurrent && "border-[#39ff14] shadow-[0_0_30px_rgba(57,255,20,0.15)] ring-1 ring-[#39ff14]"
                            )}
                        >
                            {isPremium && !isCurrent && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <span className="bg-gradient-to-r from-[#ff6a00] to-orange-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Destacado
                                    </span>
                                </div>
                            )}
                            {isCurrent && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <span className="bg-gradient-to-r from-[#39ff14] to-green-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" />
                                        Tu Plan
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className={cn("text-xl font-bold mb-2", isPremium ? "text-[#ff6a00]" : "text-white")}>{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                                    <span className="text-slate-400 text-sm font-medium">/mes</span>
                                </div>
                                <p className="text-sm text-slate-400 mt-4 leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="flex-1">
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className={cn("w-5 h-5 flex-shrink-0", isPremium ? "text-[#ff6a00]" : "text-[#39ff14]")} />
                                            <span className="text-sm text-slate-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={isCurrent || currentUser?.role === 'trainer'}
                                className={cn(
                                    "w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                    isCurrent
                                        ? "bg-slate-700 text-slate-300"
                                        : isPremium
                                            ? "bg-gradient-to-r from-[#ff6a00] to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-lg shadow-orange-900/20"
                                            : "bg-slate-700 hover:bg-slate-600 text-white hover:text-[#39ff14] border border-slate-600"
                                )}
                            >
                                {isCurrent ? 'Plan Actual' : 'Seleccionar'}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
