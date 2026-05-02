import { useState, useMemo } from 'react';
import { useGymStore } from '../store/useStore';
import { differenceInDays } from 'date-fns';
import { AlertTriangle, Activity, Target, Dumbbell, Trophy, Plus, X, BarChart3, TrendingUp, Snowflake, CheckCircle2, MessageCircle, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ChatbotFaq from '../components/ChatbotFaq';
import ExpiryAlertModal from '../components/ExpiryAlertModal';
import WhatsAppContactButton from '../components/WhatsAppContactButton';

export default function StudentDashboard() {
    const {
        currentUser, addBiometrics, addPersonalRecord,
        requestFreeze, confirmAttendance, scheduleBlocks,
        enrollScheduleBlock, cancelScheduleBlock, confirmScheduleBlock
    } = useGymStore();

    // Tabs
    const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'agenda'>('overview');

    // Modals state
    const [showBiometricsModal, setShowBiometricsModal] = useState(false);
    const [showPrModal, setShowPrModal] = useState(false);

    // Forms state
    const [bioForm, setBioForm] = useState({ weight: '', height: '' });
    const [prForm, setPrForm] = useState({ exerciseName: '', value: '', unit: 'kg' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Freeze Modal State
    const [showFreezeModal, setShowFreezeModal] = useState(false);
    const [freezeForm, setFreezeForm] = useState({ start: '', end: '', justification: '' });
    const [isFreezingSubmitting, setIsFreezingSubmitting] = useState(false);

    if (!currentUser) return null;

    const currentPlan = useGymStore(state =>
        state.plans.find(p => p.id === currentUser.subscription?.planId)
    );

    const subEndDate = currentUser.subscription?.endDate ? new Date(currentUser.subscription.endDate) : null;
    const daysRemaining = subEndDate ? differenceInDays(subEndDate, new Date()) : 0;
    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 5;
    const isPowerPlatePlan = (
        currentPlan?.name?.toLowerCase().includes('power plate') ||
        currentPlan?.name?.toLowerCase().includes('híbrido') ||
        currentPlan?.name?.toLowerCase().includes('hibrido')
    ) || false;
    const sessionsTotal = currentUser.subscription?.sessions || 0;
    const sessionsUsed = 0; // would come from subscription.sessions_used
    const sessionsRemaining = Math.max(0, sessionsTotal - sessionsUsed);
    const isSessionsAlert = isPowerPlatePlan && sessionsTotal > 0 && sessionsRemaining <= 3;

    // --- Blocking Expiry Modal Logic (localStorage per-day key) ---
    const today = new Date().toISOString().split('T')[0]; // e.g. '2026-04-05'
    const lsKey = `alertaVencimiento_${currentUser.id}_${today}`;
    const alreadyAcknowledgedToday = typeof localStorage !== 'undefined' && localStorage.getItem(lsKey) === 'true';
    const shouldShowExpiryModal = (isExpiringSoon || isSessionsAlert) && !alreadyAcknowledgedToday;
    const [showExpiryModal, setShowExpiryModal] = useState(shouldShowExpiryModal);

    const handleAcceptExpiry = () => {
        localStorage.setItem(lsKey, 'true');
        setShowExpiryModal(false);
    };

    // Biometrics Chart Data
    const bioChartData = [...(currentUser.biometrics || [])].reverse().map(record => ({
        date: new Date(record.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        weight: record.weight,
        bmi: record.bmi,
        rawDate: new Date(record.date).getTime()
    })).sort((a, b) => a.rawDate - b.rawDate);

    const latestBiometrics = currentUser.biometrics?.[0];

    // Routines & PRs
    const routines = useGymStore(state => state.routines);
    const now = new Date();
    const myRoutines = routines.filter(r => {
        const isMyRoutine = r.assignedTo === currentUser.id || (r.planId && currentPlan && r.planId === currentPlan.id);
        if (!isMyRoutine) return false;
        // 24h visibility: only show routines assigned in the last 24 hours
        if (r.assignedAt) {
            const assignedTime = new Date(r.assignedAt);
            const hoursSince = (now.getTime() - assignedTime.getTime()) / 3600000;
            return hoursSince <= 48;
        }
        return true; // legacy routines without assignedAt are always shown
    });
    const myPrs = currentUser.personalRecords || [];
    const classes = useGymStore(state => state.classes);
    const myEnrolledClasses = classes.filter(c => c.enrolledStudents?.includes(currentUser.id));

    // PR Chart Data & Filters
    const uniquePrExercises = Array.from(new Set(myPrs.map(pr => pr.exerciseName)));
    const [selectedPrExercise, setSelectedPrExercise] = useState(uniquePrExercises[0] || '');

    const prChartData = useMemo(() => {
        return myPrs
            .filter(pr => pr.exerciseName === selectedPrExercise)
            .map(pr => ({
                date: new Date(pr.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                value: pr.value,
                unit: pr.unit,
                rawDate: new Date(pr.date).getTime()
            }))
            .sort((a, b) => a.rawDate - b.rawDate); // Ascending order
    }, [myPrs, selectedPrExercise]);

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
        if (!selectedPrExercise) setSelectedPrExercise(prForm.exerciseName);
    };

    return (
        <div className="space-y-6 animate-fade-in relative pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-700/50 pb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">¡Hola, {currentUser.name}!</h2>
                    <p className="text-slate-400">Aquí tienes tu progreso y estado actual.</p>
                </div>

                <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1 w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'overview' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Target className="w-4 h-4" /> Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab('evolution')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'evolution' ? 'bg-[#ff6a00] text-white shadow-lg shadow-orange-900/20' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <TrendingUp className="w-4 h-4" /> Mi Evolución
                    </button>
                    {isPowerPlatePlan && (
                        <button
                            onClick={() => setActiveTab('agenda')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'agenda' ? 'bg-[#39ff14] text-slate-900 shadow-lg shadow-[#39ff14]/20' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Calendar className="w-4 h-4" /> Mi Agenda
                        </button>
                    )}
                </div>
            </header>

            {/* Alerta de Sesiones Power Plate */}
            {isSessionsAlert && (
                <div className="bg-[#39ff14]/5 border border-[#39ff14]/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-[#39ff14] flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-[#39ff14] font-semibold">¡Pocas sesiones restantes!</h4>
                            <p className="text-sm text-slate-300 mt-1">Te quedan <strong>{sessionsRemaining}</strong> de {sessionsTotal} sesiones de Power Plate. Considera renovar tu paquete.</p>
                        </div>
                    </div>
                    <WhatsAppContactButton
                        userName={`${currentUser.name} ${currentUser.lastName}`}
                        planName={currentPlan?.name || 'Power Plate'}
                    />
                </div>
            )}

            {/* Alerta de Vencimiento de Plan */}
            {isExpiringSoon && (
                <div className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-[#ff6a00] flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-[#ff6a00] font-semibold">¡Tu plan vence pronto!</h4>
                            <p className="text-sm text-slate-300 mt-1">
                                Tu {currentPlan?.name || 'Suscripción'} termina en {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}. Renuévalo para no perder acceso.
                            </p>
                        </div>
                    </div>
                    {currentUser.phone && (
                        <a href={`https://wa.me/${currentUser.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola! Mi plan ' + (currentPlan?.name || '') + ' vence en ' + daysRemaining + ' días, ¿cómo puedo renovarlo?')}`}
                            target="_blank" rel="noreferrer"
                            className="ml-4 flex-shrink-0 flex items-center gap-1.5 text-xs font-bold bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-3 py-2 rounded-lg transition-colors">
                            <MessageCircle className="w-4 h-4" /> Contactar
                        </a>
                    )}
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        <div className={`mt-3 inline-block px-3 py-1 rounded-full text-sm font-bold border ${daysRemaining <= 5 ? 'bg-orange-500/10 text-[#ff6a00] border-[#ff6a00]/30' : 'bg-green-500/10 text-[#39ff14] border-[#39ff14]/30'}`}>
                                            Quedan {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-400">No tienes un plan activo</p>
                                )}
                            </div>
                        </div>

                        {/* Mis Rutinas */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Dumbbell className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-white">Mi Rutina Activa</h3>
                            </div>

                            {myRoutines.length > 0 ? (
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {myRoutines.map(routine => (
                                        <div key={routine.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 opacity-5 rounded-bl-full translate-x-2 -translate-y-2 group-hover:scale-150 transition-transform"></div>
                                            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                                <Target className="w-4 h-4 text-blue-500" />
                                                {routine.name}
                                            </h4>

                                            <div className="space-y-2">
                                                {routine.exercises.map((ex, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-slate-800 border border-slate-700 p-2 rounded-lg text-sm">
                                                        <span className="font-medium text-slate-200">{ex.name}</span>
                                                        <div className="flex gap-2 text-xs">
                                                            <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                                                                <span className="text-slate-500">Sets </span>{ex.sets}
                                                            </span>
                                                            <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                                                                <span className="text-slate-500">Reps </span>{ex.reps}
                                                            </span>
                                                            {ex.weight && (
                                                                <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                                                                    <span className="text-indigo-400/70">Peso </span>{ex.weight}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                                    <Dumbbell className="w-10 h-10 text-slate-600 mb-3" />
                                    <p className="text-sm text-slate-400">Tu entrenador aún no te ha asignado una rutina.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tarjeta de Congelamiento */}
            {currentUser.subscription && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Snowflake className="w-5 h-5" /></div>
                            <div>
                                <h3 className="font-semibold text-white">Pausar Membresía</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Congela tu plan por inasistencia justificada (mín. 6 días)</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFreezeModal(true)}
                            className="text-sm font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-lg transition-colors">
                            Solicitar
                        </button>
                    </div>
                </div>
            )}

            {/* Mis Clases — Confirmación de Asistencia (Power Plate) */}
            {isPowerPlatePlan && myEnrolledClasses.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><CheckCircle2 className="w-5 h-5" /></div>
                        <h3 className="font-semibold text-white">Confirmar Asistencia</h3>
                    </div>
                    <div className="space-y-2">
                        {myEnrolledClasses.map(cls => {
                            const classStart = new Date(cls.startTime);
                            const hoursUntil = differenceInDays(classStart, new Date()) * 24;
                            const canConfirm = hoursUntil <= 24 && hoursUntil > 0;
                            const myEnrollment = cls.enrollments?.find(e => e.studentId === currentUser.id);
                            const alreadyConfirmed = myEnrollment?.isConfirmed;
                            return (
                                <div key={cls.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                                    <div>
                                        <p className="font-medium text-white text-sm">{cls.name}</p>
                                        <p className="text-xs text-slate-400">{classStart.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                    {alreadyConfirmed ? (
                                        <span className="flex items-center gap-1 text-xs text-[#39ff14] font-bold"><CheckCircle2 className="w-4 h-4" /> Confirmado</span>
                                    ) : canConfirm ? (
                                        <button
                                            onClick={async () => {
                                                await confirmAttendance(cls.id);
                                                alert('¡Asistencia confirmada!');
                                            }}
                                            className="text-xs font-bold bg-purple-500/20 text-purple-400 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                                            Confirmar
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-500">Disponible 24h antes</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'agenda' && isPowerPlatePlan && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[#39ff14]" /> Agenda Power Plate
                        </h3>
                        <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                            Próxima semana
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(() => {
                            // Use string comparison (YYYY-MM-DD) to avoid UTC timezone offset issues
                            const todayStr = new Date().toISOString().split('T')[0];
                            const sortedBlocks = [...scheduleBlocks]
                                .filter(b => b.date && b.date >= todayStr)
                                .sort((a, b) => {
                                    const dateCompare = a.date!.localeCompare(b.date!);
                                    return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
                                });

                            // Grouping by date for better UI
                            const grouped: Record<string, typeof sortedBlocks> = {};
                            sortedBlocks.forEach(b => {
                                if (!grouped[b.date!]) grouped[b.date!] = [];
                                grouped[b.date!].push(b);
                            });

                            return Object.keys(grouped).map(date => ( // All days in generated week
                                <div key={date} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-lg">
                                    <h4 className="text-sm font-bold text-[#39ff14] mb-4 uppercase tracking-wider flex items-center justify-between">
                                        <span>{new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                                        {date === new Date().toISOString().split('T')[0] && <span className="text-[10px] bg-[#39ff14]/20 px-2 py-0.5 rounded text-[#39ff14]">Hoy</span>}
                                    </h4>
                                    <div className="space-y-3">
                                        {grouped[date].map(block => {
                                            const myEnrollment = block.enrolledStudents?.find(e => e.id === currentUser.id);
                                            const isEnrolled = !!myEnrollment;
                                            const isConfirmed = myEnrollment?.isConfirmed;
                                            const enrolledCount = block.enrolledStudents?.length || 0;
                                            const isFull = enrolledCount >= block.capacity;

                                            // Logic for 24h confirmation
                                            const blockDateTime = new Date(`${block.date}T${block.startTime}`);
                                            const hoursToStart = (blockDateTime.getTime() - new Date().getTime()) / 3600000;
                                            const canConfirm = isEnrolled && !isConfirmed && hoursToStart <= 24 && hoursToStart > 0;

                                            return (
                                                <div key={block.id} className={`p-3 rounded-xl border transition-all ${isEnrolled ? 'bg-[#39ff14]/5 border-[#39ff14]/30' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-bold text-white">{block.startTime}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isFull && !isEnrolled ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                                                            {enrolledCount}/{block.capacity} Cupos
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {!isEnrolled ? (
                                                            <button
                                                                onClick={() => enrollScheduleBlock(block.id)}
                                                                disabled={isFull}
                                                                className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${isFull ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14] hover:text-slate-900'}`}
                                                            >
                                                                Reservar
                                                            </button>
                                                        ) : (
                                                            <div className="flex-1 flex flex-col gap-2">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => cancelScheduleBlock(block.id)}
                                                                        className="flex-1 text-xs font-bold py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                    {canConfirm && (
                                                                        <button
                                                                            onClick={() => confirmScheduleBlock(block.id)}
                                                                            className="flex-1 text-xs font-bold py-2 bg-blue-600 text-white hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/20 transition-all animate-pulse"
                                                                        >
                                                                            Confirmar
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {isConfirmed ? (
                                                                    <span className="text-[10px] text-center font-bold text-[#39ff14] bg-[#39ff14]/10 py-1 rounded">✓ Confirmado</span>
                                                                ) : hoursToStart <= 0 ? (
                                                                    <span className="text-[10px] text-center font-bold text-slate-500 bg-slate-800 py-1 rounded">Sesión Finalizada</span>
                                                                ) : !canConfirm && (
                                                                    <span className="text-[10px] text-center font-medium text-slate-400 italic">Confirma 24h antes</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            {activeTab === 'evolution' && (
                <div className="space-y-6 animate-fade-in">

                    {/* Tarjeta IMC / Biometría resumida */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#ff6a00] opacity-5 rounded-full blur-2xl"></div>
                        <div>
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-700/50 rounded-lg text-[#ff6a00]">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-white">Mi Estado Físico (Peso e IMC)</h3>
                                </div>
                                <button
                                    onClick={() => setShowBiometricsModal(true)}
                                    className="flex items-center gap-1.5 text-xs font-bold bg-[#ff6a00]/20 text-[#ff6a00] hover:bg-[#ff6a00] hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Nuevo Registro Biométrico
                                </button>
                            </div>

                            {latestBiometrics ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                        <p className="text-sm text-slate-400 mb-1">Último Peso Registrado</p>
                                        <p className="text-3xl font-bold text-white max-w-[150px] truncate">{latestBiometrics.weight} <span className="text-lg text-slate-500 font-normal">kg</span></p>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                        <p className="text-sm text-slate-400 mb-1">Estatura</p>
                                        <p className="text-3xl font-bold text-white">{latestBiometrics.height} <span className="text-lg text-slate-500 font-normal">cm</span></p>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                        <p className="text-sm text-slate-400 mb-1">Índice de Masa Corporal</p>
                                        <div className="flex items-end gap-3">
                                            <p className="text-3xl font-bold text-white">{latestBiometrics.bmi}</p>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-md mb-1 border ${latestBiometrics.bmi < 25 ? 'bg-green-500/10 text-[#39ff14] border-green-500/30' : 'bg-orange-500/10 text-[#ff6a00] border-orange-500/30'}`}>
                                                {latestBiometrics.bmi < 25 ? 'Normal' : 'Sobrepeso'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-400 mb-6">No hay información biométrica registrada.</p>
                            )}

                            {/* Chart Biometria */}
                            {bioChartData.length > 0 && (
                                <div className="h-[250px] w-full border border-slate-700 bg-slate-900/50 rounded-xl p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={bioChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#39ff14" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ff6a00" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#ff6a00" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                            <Area yAxisId="left" type="monotone" dataKey="weight" name="Peso (kg)" stroke="#39ff14" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                                            <Area yAxisId="right" type="monotone" dataKey="bmi" name="IMC" stroke="#ff6a00" strokeWidth={3} fillOpacity={1} fill="url(#colorBmi)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Evolución PRs (Gráficos por Ejercicio) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Tabla Listado de PRs */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl lg:col-span-1 h-fit">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-white">Historial de Marcas</h3>
                                </div>
                                <button
                                    onClick={() => setShowPrModal(true)}
                                    className="p-2 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {myPrs.length > 0 ? (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {[...myPrs].reverse().map(pr => (
                                        <div key={pr.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 flex items-center justify-between group hover:border-yellow-500/30 transition-colors">
                                            <div>
                                                <p className="font-bold text-white text-sm">{pr.exerciseName}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(pr.date).toLocaleDateString('es-ES')}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-black text-[#39ff14] inline-block">
                                                    {pr.value}
                                                </span>
                                                <span className="text-xs font-medium text-slate-500 ml-1">{pr.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm text-center py-6">Registra tus récords de fuerza para poder ver tu evolución aquí.</p>
                            )}
                        </div>

                        {/* Chart PRs */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl lg:col-span-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-white">Evolución de Fuerza</h3>
                                </div>
                                {uniquePrExercises.length > 0 && (
                                    <select
                                        value={selectedPrExercise}
                                        onChange={(e) => setSelectedPrExercise(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-blue-500 text-sm"
                                    >
                                        {uniquePrExercises.map(ex => (
                                            <option key={ex} value={ex}>{ex}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {uniquePrExercises.length > 0 ? (
                                <div className="h-[300px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={prChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPr" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                            <Area type="monotone" dataKey="value" name="Marca" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPr)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center border border-dashed border-slate-700 rounded-xl">
                                    <p className="text-slate-500">Aún no hay múltiples registros de un mismo PR para graficar</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}


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
                                className="w-full mt-4 py-3 rounded-xl font-bold bg-[#ff6a00] hover:bg-orange-500 text-white disabled:opacity-50 transition-colors"
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
                                className="w-full mt-4 py-3 rounded-xl font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-900 disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? 'Guardando...' : 'Registrar Marca'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Solicitar Congelamiento */}
            {showFreezeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-bold text-white flex items-center gap-2"><Snowflake className="w-5 h-5 text-blue-400" /> Solicitar Pausa</h3>
                            <button onClick={() => setShowFreezeModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const start = new Date(freezeForm.start);
                            const end = new Date(freezeForm.end);
                            const minEnd = new Date(start);
                            minEnd.setDate(minEnd.getDate() + 6);
                            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                            if (start < tomorrow) { alert('La fecha de inicio debe ser al menos mañana.'); return; }
                            if (end < minEnd) { alert('La duración mínima del congelamiento es de 6 días.'); return; }
                            if (!freezeForm.justification.trim()) { alert('Debes ingresar una justificación.'); return; }
                            setIsFreezingSubmitting(true);
                            const ok = await requestFreeze({ freezeStart: freezeForm.start, freezeEnd: freezeForm.end, justificationText: freezeForm.justification });
                            setIsFreezingSubmitting(false);
                            if (ok) { alert('¡Solicitud de pausa enviada! El administrador la revisará.'); setShowFreezeModal(false); }
                        }} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Inicio de Pausa</label>
                                    <input type="date" required value={freezeForm.start} onChange={e => setFreezeForm({ ...freezeForm, start: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Fin de Pausa</label>
                                    <input type="date" required value={freezeForm.end} onChange={e => setFreezeForm({ ...freezeForm, end: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Justificación</label>
                                <textarea required rows={3} value={freezeForm.justification} onChange={e => setFreezeForm({ ...freezeForm, justification: e.target.value })}
                                    placeholder="Ej: Viaje de trabajo, lesión, etc."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-blue-500 resize-none" />
                            </div>
                            <p className="text-xs text-slate-500">Reglas: mín. 6 días · inicio con 1 día de antelación · duración máx. 1 mes</p>
                            <button type="submit" disabled={isFreezingSubmitting}
                                className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors">
                                {isFreezingSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Blocking Expiry Alert Modal */}
            <ExpiryAlertModal
                isOpen={showExpiryModal}
                onAccept={handleAcceptExpiry}
                daysRemaining={daysRemaining}
                sessionsRemaining={sessionsRemaining}
                planName={currentPlan?.name}
                isPowerPlate={isPowerPlatePlan}
            />

            {/* Chatbot FAQ flotante */}
            <ChatbotFaq adminPhone="591XXXXXXXX" />
        </div>
    );
}
