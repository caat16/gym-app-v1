import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGymStore } from '../store/useStore';
import { ArrowRight, ShieldAlert, Check } from 'lucide-react';
import { cn } from '../components/layout/AppLayout';

export default function Register() {
    const { registerStudent, loginWithCI } = useGymStore();
    const navigate = useNavigate();
    const location = useLocation();
    const initialCi = location.state?.initialCi || '';

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        ci: initialCi,
        name: '',
        lastName: '',
        age: '',
        email: '',
        weight: '',
        height: ''
    });

    const [waiverSigned, setWaiverSigned] = useState(false);

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleFinishRegister = async () => {
        if (!waiverSigned) {
            alert('Debes aceptar el contrato de exoneración para continuar.');
            return;
        }

        await registerStudent({
            ci: formData.ci,
            name: formData.name,
            lastName: formData.lastName,
            age: parseInt(formData.age),
            email: formData.email
        });

        // Login directly after registration
        await loginWithCI(formData.ci);

        // Redirect to plans page to pick a plan
        navigate('/app/plans');
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#1e293b] border border-slate-700 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10 animate-fade-in">

                {/* Header Steps */}
                <div className="flex items-center mb-8 gap-4 px-2">
                    <div className="flex-1 space-y-2">
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className={cn("h-full bg-gradient-to-r transition-all duration-500", step === 1 ? "w-1/2 from-[#39ff14] to-green-500" : "w-full from-[#ff6a00] to-orange-500")}></div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            Paso {step} de 2: {step === 1 ? 'Datos Personales' : 'Módulo Legal'}
                        </p>
                    </div>
                </div>

                {step === 1 && (
                    <form onSubmit={handleNextStep} className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white">¡Regístrate en Gymflow!</h2>
                            <p className="text-slate-400 text-sm mt-1">Completa tu perfil biométrico base.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Carnet (CI)</label>
                                <input
                                    type="text"
                                    value={formData.ci}
                                    onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-slate-300"
                                    readOnly={!!initialCi}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-[#39ff14]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-[#39ff14]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Apellidos</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-[#39ff14]"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3 md:col-span-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Edad</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-[#39ff14]"
                                        required
                                        min="14"
                                        max="99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Peso (kg)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-[#39ff14]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Talla (cm)</label>
                                    <input
                                        type="number"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-[#39ff14]"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-8 bg-slate-100 hover:bg-white text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            Continuar al Contrato <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <div className="mx-auto w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                                <ShieldAlert className="w-6 h-6 text-[#ff6a00]" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Contrato de Exoneración</h2>
                            <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">Por tu seguridad y la de nuestros instructores, lee detenidamente los términos antes de continuar.</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 h-64 overflow-y-auto text-sm text-slate-400 space-y-4 shadow-inner custom-scrollbar">
                            <p><strong>Cláusula 1: Salud y Condición Física.</strong> El suscrito declara encontrarse en condiciones físicas adecuadas para realizar prácticas deportivas y levantamiento de pesas, asumiendo total responsabilidad sobre su salud.</p>
                            <p><strong>Cláusula 2: Exoneración de Responsabilidad.</strong> Gymflow Pro, sus entrenadores y personal administrativo no serán responsables por lesiones, esguinces, desgarros, fracturas o eventos cardiovasculares ocurridos dentro de las instalaciones, ya sea por negligencia propia, omisión de condiciones preexistentes o por no seguir rigurosamente las instrucciones del coach a cargo.</p>
                            <p><strong>Cláusula 3: Uso de Instalaciones.</strong> El usuario se compromete a usar correctamente el equipamiento. En caso de daño intencional, los costos de reparación correrán por cuenta del usuario.</p>
                            <p>Al aceptar estos términos y firmar digitalmente, confirmas haber entendido los riesgos implícitos en la actividad física de alta intensidad.</p>
                        </div>

                        <div className="flex items-start gap-4 p-4 border border-slate-700 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => setWaiverSigned(!waiverSigned)}>
                            <div className={cn("w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors", waiverSigned ? "bg-[#39ff14] border-[#39ff14]" : "border-slate-500 bg-slate-900")}>
                                {waiverSigned && <Check className="w-4 h-4 text-slate-900" />}
                            </div>
                            <div>
                                <p className="text-slate-200 font-medium">He leído, entiendo y acepto los términos de exoneración.</p>
                                <p className="text-xs text-slate-500 mt-1">Firma digital vinculante correspondiente al CI: <span className="font-mono text-slate-300">{formData.ci}</span></p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all"
                            >
                                Volver
                            </button>
                            <button
                                type="button"
                                onClick={handleFinishRegister}
                                disabled={!waiverSigned}
                                className="flex-1 bg-gradient-to-r from-[#ff6a00] to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg"
                            >
                                Aceptar y Elegir Plan
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
