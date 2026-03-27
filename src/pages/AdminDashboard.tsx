import { useState } from 'react';
import { useGymStore } from '../store/useStore';
import { ShieldAlert, UserPlus, Users, DollarSign, Activity, Trash2, CalendarDays, Dumbbell, Clock, Eye, X, PlusCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function AdminDashboard() {
    const {
        users, plans, classes, routines, scheduleBlocks,
        registerTrainer, deleteUser, deleteClass, deleteRoutine,
        createScheduleBlocks, deleteScheduleBlock, assignRoutine
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
                    <div className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 animate-pulse-slow">
                        <ShieldAlert className="w-8 h-8 text-[#ff6a00] flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="text-[#ff6a00] font-bold text-lg">Atención: {expiringStudents.length} {expiringStudents.length === 1 ? 'Alumno' : 'Alumnos'} por vencer</h4>
                            <p className="text-sm text-slate-300">
                                Hay planes que vencen en 5 días o menos. El sistema disparará correos automáticamente al alumno.
                            </p>
                        </div>
                    </div>
                )}

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
                                                        <button onClick={() => confirmDeleteUser(s.id, s.name)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
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
        </>
    );
}
