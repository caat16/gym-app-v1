import { useState, useEffect } from 'react';
import { useGymStore } from '../store/useStore';
import { ShieldAlert, UserPlus, Users, DollarSign, Activity, Trash2, CalendarDays, Dumbbell, Clock, Eye, X, PlusCircle, Snowflake, MessageCircle, Edit2, Layers, Zap, BarChart2, Filter } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function AdminDashboard() {
    const {
        users, plans, classes, routines, scheduleBlocks, membershipFreezes,
        registerTrainer, deleteUser, deleteClass, deleteRoutine,
        createScheduleBlocks, deleteScheduleBlock, assignRoutine,
        approveFreeze, rejectFreeze, getUserFreezes, updateUserProfile,
        assignTrainerDiscipline, trainerDisciplines, getTrainerDisciplines, removeTrainerDiscipline
    } = useGymStore();

    // Formularios
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [ci, setCi] = useState('');

    // Formulario de Bloques de Horario
    const [blockDays, setBlockDays] = useState<number[]>([]);
    const [blockStart, setBlockStart] = useState('06:00');
    const [blockEnd, setBlockEnd] = useState('07:00');
    const [blockCapacity, setBlockCapacity] = useState(10);
    // Duplicate Routine Modal State
    const [previewRoutine, setPreviewRoutine] = useState<typeof routines[0] | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateTarget, setDuplicateTarget] = useState<'student' | 'plan'>('student');
    const [duplicateStudent, setDuplicateStudent] = useState('');
    const [duplicatePlan, setDuplicatePlan] = useState('');
    const [duplicateName, setDuplicateName] = useState('');

    // Profile Edit State
    const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Freeze Panel Loading
    const [freezeLoading, setFreezeLoading] = useState(false);

    useEffect(() => {
        getUserFreezes('all' as unknown as string);
        getTrainerDisciplines('all' as unknown as string);
    }, []);

    // --- Retention Filter State ---
    const [retentionDays, setRetentionDays] = useState(5);
    const [showChurn, setShowChurn] = useState(false);

    // --- Staff Assignment State ---
    const [staffTrainerId, setStaffTrainerId] = useState('');
    const [staffPlanId, setStaffPlanId] = useState('');
    const [staffSaving, setStaffSaving] = useState(false);

    // --- Power Plate Auto-Schedule Generator ---
    const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

    const handleGeneratePowerPlateSchedule = async () => {
        const confirmed = window.confirm(
            '¿Confirmar generación de horarios Power Plate para las próximas 4 semanas?\n' +
            'Se crearán slots de 30 min de L-V (6:00-10:30 y 16:00-20:00) y Sábados (7:00-11:30).\n' +
            'Cupo máximo: 3 personas por slot. Total estimado: ~376 slots.'
        );
        if (!confirmed) return;
        setIsGeneratingSchedule(true);
        const blocks: { dayOfWeek: number; startTime: string; endTime: string; capacity: number }[] = [];
        const today = new Date();
        // L-V morning (6:00-10:30), L-V afternoon (16:00-20:00), Sat (7:00-11:30)
        const weekdayMorningSlots: [string, string][] = [
            ['06:00', '06:30'], ['06:30', '07:00'], ['07:00', '07:30'], ['07:30', '08:00'],
            ['08:00', '08:30'], ['08:30', '09:00'], ['09:00', '09:30'], ['09:30', '10:00'], ['10:00', '10:30']
        ];
        const weekdayAfternoonSlots: [string, string][] = [
            ['16:00', '16:30'], ['16:30', '17:00'], ['17:00', '17:30'], ['17:30', '18:00'],
            ['18:00', '18:30'], ['18:30', '19:00'], ['19:00', '19:30'], ['19:30', '20:00']
        ];
        const saturdaySlots: [string, string][] = [
            ['07:00', '07:30'], ['07:30', '08:00'], ['08:00', '08:30'], ['08:30', '09:00'],
            ['09:00', '09:30'], ['09:30', '10:00'], ['10:00', '10:30'], ['10:30', '11:00'], ['11:00', '11:30']
        ];
        for (let week = 0; week < 4; week++) {
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const d = new Date(today);
                d.setDate(today.getDate() + week * 7 + dayOffset);
                const dow = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
                if (dow >= 1 && dow <= 5) {
                    weekdayMorningSlots.forEach(([s, e]) => blocks.push({ dayOfWeek: dow, startTime: s, endTime: e, capacity: 3 }));
                    weekdayAfternoonSlots.forEach(([s, e]) => blocks.push({ dayOfWeek: dow, startTime: s, endTime: e, capacity: 3 }));
                } else if (dow === 6) {
                    saturdaySlots.forEach(([s, e]) => blocks.push({ dayOfWeek: 6, startTime: s, endTime: e, capacity: 3 }));
                }
            }
        }
        const success = await createScheduleBlocks(blocks);
        setIsGeneratingSchedule(false);
        if (success) alert(`✅ Horarios generados exitosamente. ${blocks.length} slots creados para las próximas 4 semanas.`);
        else alert('❌ Error al generar horarios. Por favor intenta de nuevo.');
    };
    const [duplicateExercises, setDuplicateExercises] = useState<any[]>([]);

    const openDuplicateModal = (routine: typeof routines[0]) => {
        setDuplicateName(`Copia de ${routine.name}`);
        setDuplicateExercises(routine.exercises.map(ex => ({ ...ex })));
        setDuplicateTarget('student');
        setDuplicateStudent('');
        setDuplicatePlan('');
        setShowDuplicateModal(true);
    };

    const handleDuplicateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (duplicateTarget === 'student' && !duplicateStudent) return alert('Seleccione un alumno');
        if (duplicateTarget === 'plan' && !duplicatePlan) return alert('Seleccione un plan');

        await assignRoutine({
            name: duplicateName,
            assignedTo: duplicateTarget === 'student' ? duplicateStudent : null,
            planId: duplicateTarget === 'plan' ? duplicatePlan : null,
            exercises: duplicateExercises
        });

        alert('Rutina duplicada y asignada exitosamente.');
        setShowDuplicateModal(false);
    };

    const trainers = users.filter(u => u.role === 'trainer');
    const students = users.filter(u => u.role === 'student');

    // Panel Financiero
    const activeStudents = students.filter(s => {
        if (!s.subscription) return false;
        const days = differenceInDays(new Date(s.subscription.endDate), new Date());
        return days > 0;
    });

    const expiringStudents = students.filter(s => {
        if (!s.subscription) return false;
        const days = differenceInDays(new Date(s.subscription.endDate), new Date());
        return days > 0 && days <= 5;
    });

    const revenue = activeStudents.reduce((sum, student) => {
        const plan = plans.find(p => p.id === student.subscription?.planId);
        return sum + (plan?.price || 0);
    }, 0);

    const planCounts = plans.map(plan => ({
        ...plan,
        count: activeStudents.filter(s => s.subscription?.planId === plan.id).length
    }));

    const handleRegisterTrainer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !lastName || !email || !ci) return;

        const exists = users.find(u => u.ci === ci);
        if (exists) {
            alert('Ya existe un usuario con ese Carnet de Identidad en el sistema.');
            return;
        }

        registerTrainer({ name, lastName, email, ci, age: 30 });
        alert(`Entrenador ${name} ${lastName} registrado exitosamente. Puede ingresar con el CI: ${ci}`);

        setName('');
        setLastName('');
        setEmail('');
        setCi('');
    };

    const handleCreateBlocks = async (e: React.FormEvent) => {
        e.preventDefault();

        if (blockDays.length === 0) {
            alert('Por favor, selecciona al menos un día de la semana.');
            return;
        }

        const blocksToCreate = blockDays.map(day => ({
            dayOfWeek: day,
            startTime: blockStart,
            endTime: blockEnd,
            capacity: blockCapacity
        }));

        const success = await createScheduleBlocks(blocksToCreate);
        if (success) {
            alert(`¡Se crearon ${blockDays.length} bloques exitosamente!`);
            setBlockDays([]); // Reset selection
        }
    };

    const confirmDeleteBlock = (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este bloque de horario?')) {
            deleteScheduleBlock(id);
        }
    };

    const confirmDeleteUser = (id: string, name: string) => {
        if (window.confirm(`¿Seguro que deseas ELIMINAR al usuario ${name}? Esta acción es irreversible.`)) {
            deleteUser(id);
        }
    };

    const confirmDeleteClass = (id: string, name: string) => {
        if (window.confirm(`¿Seguro que deseas ELIMINAR la clase ${name} y desuscribir a todos?`)) {
            deleteClass(id);
        }
    };

    const confirmDeleteRoutine = (id: string, name: string) => {
        if (window.confirm(`¿Seguro que deseas ELIMINAR la rutina ${name}?`)) {
            deleteRoutine(id);
        }
    };

    const formatShortDateTime = (iso: string) => {
        return new Date(iso).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <div className="space-y-8 animate-fade-in relative pb-12">
                <header className="flex items-center gap-3 mb-8 border-b border-slate-700/50 pb-6">
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                        <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Centro de Comando Admin</h2>
                        <p className="text-slate-400">Poder de Super Usuario: Finanzas, Operaciones y Gestión General.</p>
                    </div>
                </header>

                {/* Alertas de Vencimiento de Pagos */}
                {expiringStudents.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                        <ShieldAlert className="w-8 h-8 text-[#ff6a00] flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="text-[#ff6a00] font-bold text-lg">Atención: {expiringStudents.length} {expiringStudents.length === 1 ? 'Alumno' : 'Alumnos'} por vencer</h4>
                            <div className="mt-2 space-y-1">
                                {expiringStudents.map(s => (
                                    <div key={s.id} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-300">{s.name} {s.lastName}</span>
                                        {s.phone && (
                                            <a href={`https://wa.me/${s.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + s.name + '! Tu plan en GymFlow Pro vence pronto. Renuévalo para seguir entrenando.')}`}
                                                target="_blank" rel="noreferrer"
                                                className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-2 py-1 rounded-lg transition-colors">
                                                <MessageCircle className="w-3 h-3" /> WhatsApp
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Panel de Solicitudes de Congelamiento */}
                {membershipFreezes.filter(f => f.status === 'pending').length > 0 && (
                    <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-5">
                        <h4 className="font-bold text-white flex items-center gap-2 mb-4"><Snowflake className="w-5 h-5 text-blue-400" /> Solicitudes de Pausa de Membresía</h4>
                        <div className="space-y-3">
                            {membershipFreezes.filter(f => f.status === 'pending').map(freeze => {
                                const student = users.find(u => u.id === freeze.userId);
                                return (
                                    <div key={freeze.id} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-800 border border-slate-700 rounded-xl p-4 gap-3">
                                        <div>
                                            <p className="font-semibold text-white">{student?.name} {student?.lastName}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Periodo: <span className="text-slate-300">{freeze.freezeStart}</span> → <span className="text-slate-300">{freeze.freezeEnd}</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">«{freeze.justificationText}»</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={async () => { setFreezeLoading(true); await approveFreeze(freeze.id); setFreezeLoading(false); alert('Pausa aprobada.'); }}
                                                disabled={freezeLoading}
                                                className="text-xs font-bold bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                                                Aprobar
                                            </button>
                                            <button onClick={async () => { setFreezeLoading(true); await rejectFreeze(freeze.id); setFreezeLoading(false); alert('Pausa rechazada.'); }}
                                                disabled={freezeLoading}
                                                className="text-xs font-bold bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                                                Rechazar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ─── Power Plate: Generador de Horarios ─── */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#39ff14]/10 rounded-lg text-[#39ff14]"><Zap className="w-5 h-5" /></div>
                        <div>
                            <h3 className="font-semibold text-white">Generador de Horarios Power Plate</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Crea todos los slots de las próximas 4 semanas (L-V 6-10:30, 16-20h · Sáb 7-11:30h · cupo máx. 3)</p>
                        </div>
                    </div>
                    <button onClick={handleGeneratePowerPlateSchedule} disabled={isGeneratingSchedule}
                        className="flex-shrink-0 flex items-center gap-2 bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14] hover:text-slate-900 font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
                        <Zap className="w-4 h-4" />
                        {isGeneratingSchedule ? 'Generando...' : 'Generar 4 Semanas'}
                    </button>
                </div>

                {/* ─── Filtros de Retención ─── */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><Filter className="w-5 h-5" /></div>
                        <h3 className="font-semibold text-white">Filtros de Retención</h3>
                    </div>
                    <div className="flex gap-3 flex-wrap mb-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400 font-medium">Vencen en</label>
                            <input type="number" min={1} max={60} value={retentionDays}
                                onChange={e => setRetentionDays(Number(e.target.value))}
                                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:ring-1 focus:ring-orange-500" />
                            <label className="text-xs text-slate-400 font-medium">días o menos</label>
                        </div>
                        <button onClick={() => setShowChurn(false)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${!showChurn ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                            Por Vencer
                        </button>
                        <button onClick={() => setShowChurn(true)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${showChurn ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                            Churn (No renovaron)
                        </button>
                    </div>
                    {showChurn ? (
                        /* Churn Report */
                        <div>
                            <p className="text-xs text-slate-500 mb-2 font-medium">Alumnos con plan vencido que no han renovado:</p>
                            {students.filter(s => {
                                if (!s.subscription) return true;
                                return differenceInDays(new Date(s.subscription.endDate), new Date()) < 0;
                            }).length === 0 ? (
                                <p className="text-slate-400 text-sm italic">¡No hay alumnos en churn!</p>
                            ) : (
                                <div className="space-y-2">
                                    {students.filter(s => {
                                        if (!s.subscription) return true;
                                        return differenceInDays(new Date(s.subscription.endDate), new Date()) < 0;
                                    }).map(s => {
                                        const daysLate = s.subscription ? Math.abs(differenceInDays(new Date(s.subscription.endDate), new Date())) : 999;
                                        return (
                                            <div key={s.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5">
                                                <div>
                                                    <p className="text-white font-medium text-sm">{s.name} {s.lastName}</p>
                                                    <p className="text-xs text-red-400 mt-0.5">Vencido hace {daysLate} día{daysLate !== 1 ? 's' : ''}</p>
                                                </div>
                                                {s.phone && (
                                                    <a href={`https://wa.me/${s.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + s.name + '! Tu plan en GymFlow Pro venció hace ' + daysLate + ' días. ¿Puedo ayudarte a renovarlo?')}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-2 py-1 rounded-lg transition-colors">
                                                        <MessageCircle className="w-3 h-3" /> Re-activar
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Retention: Vencen en X días */
                        <div>
                            <p className="text-xs text-slate-500 mb-2 font-medium">Alumnos con plan que vence en los próximos {retentionDays} días:</p>
                            {students.filter(s => {
                                if (!s.subscription) return false;
                                const d = differenceInDays(new Date(s.subscription.endDate), new Date());
                                return d >= 0 && d <= retentionDays;
                            }).length === 0 ? (
                                <p className="text-slate-400 text-sm italic">Ningún alumno vence en ese rango.</p>
                            ) : (
                                <div className="space-y-2">
                                    {students.filter(s => {
                                        if (!s.subscription) return false;
                                        const d = differenceInDays(new Date(s.subscription.endDate), new Date());
                                        return d >= 0 && d <= retentionDays;
                                    }).map(s => {
                                        const d = differenceInDays(new Date(s.subscription!.endDate), new Date());
                                        return (
                                            <div key={s.id} className="flex items-center justify-between bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-2.5">
                                                <div>
                                                    <p className="text-white font-medium text-sm">{s.name} {s.lastName}</p>
                                                    <p className="text-xs text-orange-400 mt-0.5">Vence en {d} día{d !== 1 ? 's' : ''}</p>
                                                </div>
                                                {s.phone && (
                                                    <a href={`https://wa.me/${s.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + s.name + '! Tu plan en GymFlow Pro vence en ' + d + ' días. Renuévalo para seguir entrenando.')}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-2 py-1 rounded-lg transition-colors">
                                                        <MessageCircle className="w-3 h-3" /> WhatsApp
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Asignación de Disciplinas a Entrenadores ─── */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Layers className="w-5 h-5" /></div>
                        <h3 className="font-semibold text-white">Asignar Entrenador a Disciplina</h3>
                    </div>
                    <div className="flex gap-3 flex-wrap items-end">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Entrenador</label>
                            <select value={staffTrainerId} onChange={e => setStaffTrainerId(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:ring-1 focus:ring-purple-500">
                                <option value="">Seleccionar entrenador...</option>
                                {trainers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Disciplina (Plan)</label>
                            <select value={staffPlanId} onChange={e => setStaffPlanId(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:ring-1 focus:ring-purple-500">
                                <option value="">Seleccionar plan...</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <button disabled={!staffTrainerId || !staffPlanId || staffSaving}
                            onClick={async () => {
                                setStaffSaving(true);
                                const ok = await assignTrainerDiscipline(staffTrainerId, staffPlanId);
                                setStaffSaving(false);
                                if (ok) { setStaffTrainerId(''); setStaffPlanId(''); }
                            }}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 text-sm flex items-center gap-2">
                            <Layers className="w-4 h-4" /> {staffSaving ? 'Asignando...' : 'Asignar'}
                        </button>
                    </div>
                    {/* Current Assignments */}
                    {trainerDisciplines.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {trainerDisciplines.map(d => {
                                const trainer = trainers.find(t => t.id === d.trainerId);
                                const plan = plans.find(p => p.id === d.planId);
                                return (
                                    <div key={d.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                                        <span className="text-white">{trainer?.name} {trainer?.lastName} — <span className="text-purple-400">{plan?.name}</span></span>
                                        <button onClick={() => removeTrainerDiscipline(d.id)} className="text-slate-500 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ─── Notificaciones Power Plate (Confirmaciones de hoy) ─── */}
                {(() => {
                    const todayStr = new Date().toDateString();
                    const todayConfirmed = classes.filter(c => {
                        const cDate = new Date(c.startTime).toDateString();
                        return cDate === todayStr && c.enrollments?.some(e => e.isConfirmed);
                    });
                    if (todayConfirmed.length === 0) return null;
                    return (
                        <div className="bg-[#39ff14]/5 border border-[#39ff14]/30 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-[#39ff14]/10 rounded-lg text-[#39ff14]"><BarChart2 className="w-5 h-5" /></div>
                                <h3 className="font-semibold text-white">Confirmaciones Power Plate — Hoy</h3>
                            </div>
                            <div className="space-y-2">
                                {todayConfirmed.map(cls => {
                                    const confirmed = cls.enrollments?.filter(e => e.isConfirmed) || [];
                                    return (
                                        <div key={cls.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5">
                                            <div>
                                                <p className="text-white font-medium text-sm">{cls.name}</p>
                                                <p className="text-xs text-slate-400">{new Date(cls.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <span className="text-xs font-bold text-[#39ff14] bg-[#39ff14]/10 px-2.5 py-1 rounded-full">{confirmed.length} confirmado{confirmed.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Panel Financiero */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#39ff14] opacity-5 rounded-bl-full translate-x-8 -translate-y-8"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-5 h-5 text-[#39ff14]" />
                            <h3 className="font-semibold text-slate-300">Revenue (Activo)</h3>
                        </div>
                        <p className="text-4xl font-black text-white group-hover:text-[#39ff14] transition-colors">{revenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}<span className="text-lg text-slate-500 ml-1">Bs</span></p>
                        <p className="text-xs text-slate-400 mt-2">Acumulado por planes vigentes</p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 rounded-bl-full translate-x-8 -translate-y-8"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <h3 className="font-semibold text-slate-300">Alumnos Activos</h3>
                        </div>
                        <p className="text-4xl font-black text-white group-hover:text-blue-400 transition-colors">{activeStudents.length}</p>
                        <p className="text-xs text-slate-400 mt-2">De un total de {students.length} registrados</p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
                        <h3 className="font-semibold text-slate-300 mb-3 text-sm">Distribución por Planes</h3>
                        <div className="space-y-2">
                            {planCounts.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">{p.name}</span>
                                    <span className="font-bold text-white bg-slate-700 px-2 py-0.5 rounded-md">{p.count} alu.</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Columna Izquierda: Entrenadores */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Registro */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-white">Añadir Entrenador</h3>
                            </div>

                            <form onSubmit={handleRegisterTrainer} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-purple-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Apellido</label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-purple-500" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Correo</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-purple-500" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Carnet Identidad (Clave login)</label>
                                    <input type="text" value={ci} onChange={(e) => setCi(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-purple-500 font-mono" required />
                                </div>
                                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors mt-2">
                                    Crear Staff
                                </button>
                            </form>
                        </div>

                        {/* Lista Entrenadores */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-5 h-5 text-purple-400" />
                                <h3 className="font-semibold text-white">Staff ({trainers.length})</h3>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {trainers.map(t => (
                                    <div key={t.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-white text-sm">{t.name} {t.lastName}</p>
                                            <p className="text-xs text-slate-500 font-mono">CI: {t.ci}</p>
                                        </div>
                                        <button onClick={() => confirmDeleteUser(t.id, t.name)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Alumnos, Clases y Rutinas */}
                    <div className="space-y-6 lg:col-span-2">

                        {/* Alumnos */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-5 h-5 text-blue-400" />
                                <h3 className="font-semibold text-white">Gestión de Alumnos</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/50 text-slate-400 font-medium">
                                        <tr>
                                            <th className="px-3 py-2">Nombre</th>
                                            <th className="px-3 py-2">CI</th>
                                            <th className="px-3 py-2">Plan</th>
                                            <th className="px-3 py-2 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {students.slice(0, 10).map(s => {
                                            const plan = plans.find(p => p.id === s.subscription?.planId);
                                            const isActive = s.subscription && differenceInDays(new Date(s.subscription.endDate), new Date()) > 0;
                                            return (
                                                <tr key={s.id} className="hover:bg-slate-700/20 group">
                                                    <td className="px-3 py-2 font-medium text-white">{s.name} {s.lastName}</td>
                                                    <td className="px-3 py-2 font-mono text-xs">{s.ci}</td>
                                                    <td className="px-3 py-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                                            {plan ? plan.name : 'Sin Plan'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => { setEditingUser(s); setEditName(s.name); setEditEmail(s.email); setEditPhone(s.phone || ''); }}
                                                                className="text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => confirmDeleteUser(s.id, s.name)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                {students.length > 10 && <p className="text-xs text-center text-slate-500 mt-2 italic">Mostrando últimos 10 alumnos. Utiliza un buscador para el resto (en desarrollo).</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Clases */}
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <CalendarDays className="w-5 h-5 text-[#ff6a00]" />
                                    <h3 className="font-semibold text-white">Clases Programadas</h3>
                                </div>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {classes.map(c => {
                                        const instructor = users.find(u => u.id === c.instructor);
                                        return (
                                            <div key={c.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 group hover:border-slate-500 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-bold text-white text-sm truncate pr-2">{c.name}</p>
                                                    <button onClick={() => confirmDeleteClass(c.id, c.name)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                                    <Clock className="w-3 h-3" /> {formatShortDateTime(c.startTime)}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Users className="w-3 h-3" /> Inst: {instructor?.name || 'Sistema'} | Cupos: {c.enrolledStudents.length}/{c.capacity}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {classes.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4">Sin clases activas.</p>}
                                </div>
                            </div>

                            {/* Rutinas */}
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <Dumbbell className="w-5 h-5 text-blue-500" />
                                        <h3 className="font-semibold text-white">Biblioteca de Rutinas</h3>
                                    </div>
                                    <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">{routines.length} en total</span>
                                </div>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {[...routines].reverse().map(r => {
                                        const student = users.find(u => u.id === r.assignedTo);
                                        return (
                                            <div key={r.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 group hover:border-slate-500 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div className="truncate pr-2">
                                                        <p className="font-bold text-white text-sm">{r.name}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">Asignado a: <span className="text-slate-300">{r.planId ? `Plan (Global)` : (student ? `${student.name} ${student.lastName}` : 'Desconocido')}</span></p>
                                                        <p className="text-[10px] bg-slate-800 text-blue-400 mt-2 px-1.5 py-0.5 rounded inline-block">{r.exercises.length} ejercicios</p>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex gap-1">
                                                            <button onClick={() => setPreviewRoutine(r)} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                                                <Eye className="w-3 h-3" /> Ver
                                                            </button>
                                                            <button onClick={() => openDuplicateModal(r)} className="flex-1 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                                                Reasignar
                                                            </button>
                                                        </div>
                                                        <button onClick={() => confirmDeleteRoutine(r.id, r.name)} className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {routines.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4">No hay rutinas asignadas.</p>}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Gestión de Bloques de Horario */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden animate-fade-in mt-6">
                    <div className="flex items-center gap-3 mb-6">
                        <CalendarDays className="w-6 h-6 text-indigo-400" />
                        <h3 className="font-semibold text-white text-xl">Gestión de Bloques de Horario (Plantilla Default)</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Crear Bloque */}
                        <div className="lg:col-span-1 bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                            <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                                Añadir Nuevo Bloque
                            </h4>
                            <form onSubmit={handleCreateBlocks} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Días de la Semana</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 1, label: 'Lun' },
                                            { id: 2, label: 'Mar' },
                                            { id: 3, label: 'Mié' },
                                            { id: 4, label: 'Jue' },
                                            { id: 5, label: 'Vie' },
                                            { id: 6, label: 'Sáb' },
                                            { id: 0, label: 'Dom' },
                                        ].map(day => {
                                            const isSelected = blockDays.includes(day.id);
                                            return (
                                                <button
                                                    type="button"
                                                    key={day.id}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setBlockDays(prev => prev.filter(d => d !== day.id));
                                                        } else {
                                                            setBlockDays(prev => [...prev, day.id]);
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelected
                                                        ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-600'
                                                        }`}
                                                >
                                                    {day.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Hora Inicio</label>
                                        <input type="time" value={blockStart} onChange={e => setBlockStart(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-indigo-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Hora Fin</label>
                                        <input type="time" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-indigo-500" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Capacidad (Cupo Máximo)</label>
                                    <input type="number" min="1" value={blockCapacity} onChange={e => setBlockCapacity(parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-indigo-500" required />
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors mt-2 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                                    Crear Bloque
                                </button>
                            </form>
                        </div>

                        {/* Lista de Bloques */}
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {scheduleBlocks?.map(b => {
                                    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                                    return (
                                        <div key={b.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center group hover:border-indigo-500/50 transition-colors relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                            <div className="pl-2">
                                                <p className="font-bold text-indigo-400 text-base">{days[b.dayOfWeek]}</p>
                                                <p className="text-white text-sm font-medium mt-1">
                                                    <Clock className="w-3.5 h-3.5 inline-block -mt-0.5 mr-1.5 text-slate-400" />
                                                    {b.startTime.slice(0, 5)} - {b.endTime.slice(0, 5)}
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-2 bg-slate-800 px-2 py-0.5 rounded-full inline-block">Capacidad: {b.capacity} pers.</p>
                                            </div>
                                            <button onClick={() => confirmDeleteBlock(b.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 relative z-10">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )
                                })}
                                {(!scheduleBlocks || scheduleBlocks.length === 0) && (
                                    <p className="text-slate-500 italic text-sm py-4">No hay bloques de horario configurados.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal Duplicar Rutina */}
            {
                showDuplicateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                        <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative">
                            <h2 className="text-2xl font-bold text-white mb-2">Reasignar Rutina</h2>
                            <p className="text-sm text-slate-400 mb-6">Reutiliza la estructura de esta rutina para un nuevo plan o alumno de manera directa.</p>

                            <form onSubmit={handleDuplicateSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre (Puedes modificarlo)</label>
                                    <input type="text" value={duplicateName} onChange={e => setDuplicateName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                                </div>

                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input type="radio" checked={duplicateTarget === 'student'} onChange={() => setDuplicateTarget('student')} className="text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-700" />
                                        A Alumno
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input type="radio" checked={duplicateTarget === 'plan'} onChange={() => setDuplicateTarget('plan')} className="text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-700" />
                                        A un Plan
                                    </label>
                                </div>

                                {duplicateTarget === 'student' ? (
                                    <div>
                                        <select value={duplicateStudent} onChange={e => setDuplicateStudent(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500" required>
                                            <option value="" disabled>Seleccione Alumno...</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.lastName}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <select value={duplicatePlan} onChange={e => setDuplicatePlan(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500" required>
                                            <option value="" disabled>Seleccione Plan...</option>
                                            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowDuplicateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Cancelar</button>
                                    <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors">Asignar Rutina</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal de Vista Previa de Rutina */}
            {previewRoutine && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col">
                        <button
                            onClick={() => setPreviewRoutine(null)}
                            className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6 pr-8">
                            <div className="p-3 bg-blue-500/20 rounded-xl relative">
                                <Eye className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">{previewRoutine.name}</h2>
                                <p className="text-xs text-blue-400 font-medium">{previewRoutine.exercises.length} ejercicios incluidos</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {previewRoutine.exercises.map((ex, idx) => (
                                <div key={idx} className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
                                    <h4 className="font-bold text-white mb-2">{ex.name}</h4>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 flex flex-col justify-center">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Sets</span>
                                            <span className="font-bold text-white text-sm">{ex.sets}</span>
                                        </div>
                                        <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 flex flex-col justify-center min-w-[3rem]">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Reps</span>
                                            <span className="font-bold text-blue-400 text-sm">{ex.reps}</span>
                                        </div>
                                        {ex.weight && (
                                            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 flex flex-col justify-center">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Peso</span>
                                                <span className="font-bold text-white text-sm">{ex.weight}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700/50">
                            <button
                                onClick={() => {
                                    openDuplicateModal(previewRoutine);
                                    setPreviewRoutine(null);
                                }}
                                className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <PlusCircle className="w-5 h-5" /> Utilizar esta estructura
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Editar Perfil de Alumno */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-bold text-white flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-400" /> Editar Perfil</h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setIsSavingProfile(true);
                            const ok = await updateUserProfile(editingUser.id, { name: editName, email: editEmail, phone: editPhone });
                            setIsSavingProfile(false);
                            if (ok) { setEditingUser(null); }
                            else { alert('Error al actualizar el perfil. Intenta de nuevo.'); }
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico</label>
                                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Celular</label>
                                <input type="tel" placeholder="+591 777..." value={editPhone} onChange={e => setEditPhone(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <button type="submit" disabled={isSavingProfile}
                                className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors">
                                {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
