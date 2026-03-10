import { useState } from 'react';
import { useGymStore } from '../store/useStore';
import { differenceInDays } from 'date-fns';
import { AlertTriangle, Activity, Target, Dumbbell, Trophy, Medal, Plus, X } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StudentDashboard() {
    const { currentUser, addBiometrics, addPersonalRecord } = useGymStore();

    // Modals state
    const [showBiometricsModal, setShowBiometricsModal] = useState(false);
    const [showPrModal, setShowPrModal] = useState(false);

    // Forms state
    const [bioForm, setBioForm] = useState({ weight: '', height: '' });
    const [prForm, setPrForm] = useState({ exerciseName: '', value: '', unit: 'kg' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!currentUser) return null;

    const currentPlan = useGymStore(state =>
        state.plans.find(p => p.id === currentUser.subscription?.planId)
    );

    const subEndDate = currentUser.subscription?.endDate ? new Date(currentUser.subscription.endDate) : null;
    const daysRemaining = subEndDate ? differenceInDays(subEndDate, new Date()) : 0;
    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 5;

    // Format data for Recharts
    const chartData = [...(currentUser.biometrics || [])].reverse().map(record => ({
        date: new Date(record.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        weight: record.weight,
        bmi: record.bmi
    }));

    const latestBiometrics = currentUser.biometrics?.[0];

    // Routines & PRs
    const routines = useGymStore(state => state.routines);
    const myRoutines = routines.filter(r => r.assignedTo === currentUser.id);
    const myPrs = currentUser.personalRecords || [];

    // Handlers
    const handleSaveBiometrics = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const weight = parseFloat(bioForm.weight);
        const height = parseFloat(bioForm.height);
        const heightInMeters = height / 100;
        const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));

        await addBiometrics(currentUser.id, {
            date: new Date().toISOString(),
            weight,
            height,
            bmi
        });

        setIsSubmitting(false);
        setShowBiometricsModal(false);
        setBioForm({ weight: '', height: '' });
    };

    const handleSavePR = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        await addPersonalRecord(currentUser.id, {
            date: new Date().toISOString(),
            exerciseName: prForm.exerciseName,
            value: parseFloat(prForm.value),
            unit: prForm.unit
        });

        setIsSubmitting(false);
        setShowPrModal(false);
        setPrForm({ exerciseName: '', value: '', unit: 'kg' });
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">¡Hola, {currentUser.name}!</h2>
                <p className="text-slate-400">Aquí tienes tu progreso y estado actual.</p>
            </header>

            {/* Alerta de Vencimiento de Plan */}
            {isExpiringSoon && (
                <div className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-[#ff6a00] flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[#ff6a00] font-semibold">¡Tu plan vence pronto!</h4>
                        <p className="text-sm text-slate-300 mt-1">
                            Tu {currentPlan?.name || 'Suscripción'} termina en {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}. Asegúrate de renovarlo para no perder acceso.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tarjeta Plan Actual */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden group flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#39ff14] opacity-5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-slate-700/50 rounded-lg text-[#39ff14]">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-white">Plan Actual</h3>
                        </div>
                        {currentPlan ? (
                            <div>
                                <p className="text-2xl font-bold text-white mb-1">{currentPlan.name}</p>
                                <p className="text-sm text-slate-400 mb-2">Válido hasta {subEndDate?.toLocaleDateString('es-ES')}</p>
                                <div className={`mt-3 inline-block px-3 py-1 rounded-full text-sm font-bold ${daysRemaining <= 5 ? 'bg-orange-500/20 text-[#ff6a00]' : 'bg-green-500/20 text-[#39ff14]'}`}>
                                    Quedan {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400">No tienes un plan activo</p>
                        )}
                    </div>
                </div>

                {/* Tarjeta IMC / Biometría resumida */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl col-span-1 md:col-span-2 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#ff6a00] opacity-5 rounded-full blur-2xl"></div>
                    <div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-700/50 rounded-lg text-[#ff6a00]">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-white">Últimos Datos Biométricos</h3>
                            </div>
                            <button
                                onClick={() => setShowBiometricsModal(true)}
                                className="flex items-center gap-1.5 text-xs font-bold bg-[#ff6a00]/20 text-[#ff6a00] hover:bg-[#ff6a00] hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Actualizar
                            </button>
                        </div>

                        {latestBiometrics ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center md:text-left">
                                    <p className="text-sm text-slate-400">Peso</p>
                                    <p className="text-2xl font-bold text-white">{latestBiometrics.weight} <span className="text-sm text-slate-500 font-normal">kg</span></p>
                                </div>
                                <div className="text-center md:text-left border-l border-slate-700 pl-4 md:pl-0 md:border-l-0">
                                    <p className="text-sm text-slate-400">Estatura</p>
                                    <p className="text-2xl font-bold text-white">{latestBiometrics.height} <span className="text-sm text-slate-500 font-normal">cm</span></p>
                                </div>
                                <div className="text-center md:text-left border-l border-slate-700 pl-4 md:pl-0 md:border-l-0">
                                    <p className="text-sm text-slate-400">IMC</p>
                                    <p className="text-2xl font-bold text-white">{latestBiometrics.bmi}
                                        <span className={`text-xs ml-2 font-medium px-2 py-0.5 rounded-full ${latestBiometrics.bmi < 25 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                            {latestBiometrics.bmi < 25 ? 'Normal' : 'Sobrepeso'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400">No hay información biométrica registrada.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Gráfico de Evolución */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                <h3 className="font-semibold text-white mb-6">Evolución de Peso e IMC</h3>
                {chartData.length > 0 ? (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#39ff14" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff6a00" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ff6a00" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="weight" name="Peso (kg)" stroke="#39ff14" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                                <Area yAxisId="right" type="monotone" dataKey="bmi" name="IMC" stroke="#ff6a00" strokeWidth={3} fillOpacity={1} fill="url(#colorBmi)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center border border-dashed border-slate-700 rounded-xl">
                        <p className="text-slate-400">No hay datos suficientes para graficar</p>
                    </div>
                )}
            </div>

            {/* Nueva Sección: Rutina y PRs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Mis Rutinas */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-700/50 rounded-lg text-blue-400">
                            <Dumbbell className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-white">Mi Rutina Activa</h3>
                    </div>

                    {myRoutines.length > 0 ? (
                        <div className="space-y-4">
                            {myRoutines.map(routine => (
                                <div key={routine.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-5 rounded-bl-full translate-x-4 -translate-y-4"></div>
                                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-blue-500" />
                                        {routine.name}
                                    </h4>

                                    <div className="space-y-3">
                                        {routine.exercises.map((ex, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                                                <span className="font-medium text-slate-200">{ex.name}</span>
                                                <div className="flex gap-3 text-sm">
                                                    <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">
                                                        <span className="text-slate-500 mr-1">Sets</span>{ex.sets}
                                                    </span>
                                                    <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">
                                                        <span className="text-slate-500 mr-1">Reps</span>{ex.reps}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                            <Dumbbell className="w-12 h-12 text-slate-600 mb-3" />
                            <p className="text-slate-400">Tu entrenador aún no te ha asignado una rutina.</p>
                        </div>
                    )}
                </div>

                {/* Marcas Personales (PRs) */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-700/50 rounded-lg text-yellow-400">
                                <Medal className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-white">Mis Récords (PRs)</h3>
                        </div>
                        <button
                            onClick={() => setShowPrModal(true)}
                            className="flex items-center gap-1.5 text-xs font-bold bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Nuevo
                        </button>
                    </div>

                    {myPrs.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {[...myPrs].reverse().map(pr => (
                                <div key={pr.id} className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between group hover:border-yellow-500/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-yellow-500/10 p-2 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                                            <Trophy className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-lg">{pr.exerciseName}</p>
                                            <p className="text-xs text-slate-400">{new Date(pr.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-[#39ff14] group-hover:scale-110 inline-block transition-transform">
                                            {pr.value}
                                        </span>
                                        <span className="text-sm font-medium text-slate-500 ml-1">{pr.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                            <Trophy className="w-12 h-12 text-slate-600 mb-3" />
                            <p className="text-slate-400">Aún no tienes marcas registradas. ¡Sigue entrenando duro!</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Modal de Biometría */}
            {showBiometricsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-[#ff6a00]" /> Actualizar Biometría</h3>
                            <button onClick={() => setShowBiometricsModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveBiometrics} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Peso (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={bioForm.weight}
                                    onChange={e => setBioForm({ ...bioForm, weight: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-[#ff6a00]"
                                    placeholder="Ej: 75.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Estatura (cm)</label>
                                <input
                                    type="number"
                                    required
                                    value={bioForm.height}
                                    onChange={e => setBioForm({ ...bioForm, height: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-[#ff6a00]"
                                    placeholder="Ej: 175"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-4 py-3 rounded-xl font-bold bg-[#ff6a00] hover:bg-orange-500 text-white disabled:opacity-50"
                            >
                                {isSubmitting ? 'Guardando...' : 'Guardar Datos'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Personal Records */}
            {showPrModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-bold text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Nuevo Récord (PR)</h3>
                            <button onClick={() => setShowPrModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSavePR} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Ejercicio</label>
                                <input
                                    type="text"
                                    required
                                    value={prForm.exerciseName}
                                    onChange={e => setPrForm({ ...prForm, exerciseName: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-yellow-500"
                                    placeholder="Ej: Press de Banca"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Valor</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        required
                                        value={prForm.value}
                                        onChange={e => setPrForm({ ...prForm, value: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-yellow-500"
                                        placeholder="Ej: 100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Unidad</label>
                                    <select
                                        value={prForm.unit}
                                        onChange={e => setPrForm({ ...prForm, unit: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-yellow-500"
                                    >
                                        <option value="kg">kg</option>
                                        <option value="lb">lbs</option>
                                        <option value="reps">reps</option>
                                        <option value="km/h">km/h</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-4 py-3 rounded-xl font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-900 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Guardando...' : 'Registrar Marca'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
