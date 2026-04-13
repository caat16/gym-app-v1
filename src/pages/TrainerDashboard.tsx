import { useState, useEffect } from 'react';
import { useGymStore } from '../store/useStore';
import type { ClassSession } from '../store/useStore';
import { Users, Calendar, PlusCircle, Search, Trophy, Medal, CheckSquare, Square, AlertTriangle, Trash2, X, Clock, ChevronDown, ChevronUp, Eye, Layers } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function TrainerDashboard() {
    const { classes, users, plans, routines, assignRoutine, addPersonalRecord, markAttendance, createClass, currentUser,
        trainerDisciplines, getTrainerDisciplines, removeTrainerDiscipline } = useGymStore();
    const [selectedStudent, setSelectedStudent] = useState('');
    const [assignTarget, setAssignTarget] = useState<'student' | 'plan'>('student');
    const [selectedPlanForRoutine, setSelectedPlanForRoutine] = useState('');
    const [routineName, setRoutineName] = useState('');
    const [routineView, setRoutineView] = useState<'create' | 'library'>('create');
    const [previewRoutine, setPreviewRoutine] = useState<typeof routines[0] | null>(null);
    // Workout Builder State
    const [exercises, setExercises] = useState<{ name: string, sets: number, reps: string, weight: string }[]>([{ name: '', sets: 3, reps: '10', weight: '' }]);

    // Directory Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('all');
    const [retentionFilter, setRetentionFilter] = useState(false); // true shows expiring soon/expired

    // PR Modal State
    const [viewingPrStudent, setViewingPrStudent] = useState<string | null>(null);
    const [newPrExercise, setNewPrExercise] = useState('');
    const [newPrValue, setNewPrValue] = useState('');

    // Class Modal State
    const [showClassModal, setShowClassModal] = useState(false);
    const [isSubmittingClass, setIsSubmittingClass] = useState(false);
    const [classForm, setClassForm] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '19:00',
        capacity: 15
    });

    // Class Filter
    const [classFilter, setClassFilter] = useState<'today' | 'upcoming'>('today');
    const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

    // Load disciplines on mount
    useEffect(() => {
        if (currentUser?.id) getTrainerDisciplines(currentUser.id);
    }, [currentUser?.id]);

    // Formatear hora: c.startTime -> '18:00'
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const formatShortDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const handleAssignRoutine = async (e: React.FormEvent) => {
        e.preventDefault();
        const validExercises = exercises.filter(ex => ex.name.trim() !== '');

        if (!routineName || validExercises.length === 0) {
            alert('Por favor complete todos los campos y agregue al menos un ejercicio válido.');
            return;
        }

        if (assignTarget === 'student' && !selectedStudent) {
            alert('Por favor seleccione un alumno.');
            return;
        }

        if (assignTarget === 'plan' && !selectedPlanForRoutine) {
            alert('Por favor seleccione un plan.');
            return;
        }

        await assignRoutine({
            name: routineName,
            assignedTo: assignTarget === 'student' ? selectedStudent : null,
            planId: assignTarget === 'plan' ? selectedPlanForRoutine : null,
            exercises: validExercises
        });

        // Reset form
        setSelectedStudent('');
        setSelectedPlanForRoutine('');
        setRoutineName('');
        setExercises([{ name: '', sets: 3, reps: '10', weight: '' }]);
        alert('Rutina asignada exitosamente.');
    };

    const handleDuplicateRoutine = (routine: typeof routines[0]) => {
        setRoutineName(`Copia de ${routine.name}`);
        setExercises(routine.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets,
            reps: String(ex.reps),
            weight: String(ex.weight || '')
        })));
        setAssignTarget('student');
        setSelectedStudent('');
        setSelectedPlanForRoutine('');
        setRoutineView('create');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddExercise = () => {
        setExercises([...exercises, { name: '', sets: 3, reps: '10', weight: '' }]);
    };

    const handleRemoveExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const handleExerciseChange = (index: number, field: keyof typeof exercises[0], value: string | number) => {
        const newExercises = [...exercises];
        newExercises[index] = { ...newExercises[index], [field]: value };
        setExercises(newExercises);
    };

    const handleAddPr = (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingPrStudent || !newPrExercise || !newPrValue) return;

        addPersonalRecord(viewingPrStudent, {
            date: new Date().toISOString(),
            exerciseName: newPrExercise,
            value: parseFloat(newPrValue),
            unit: 'kg' // simplify to kg for demo
        });

        setNewPrExercise('');
        setNewPrValue('');
        alert('Marca personal (PR) añadida.');
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingClass(true);

        const startDateTime = new Date(`${classForm.date}T${classForm.startTime}`);
        const endDateTime = new Date(`${classForm.date}T${classForm.endTime}`);

        await createClass({
            name: classForm.name,
            instructor: currentUser?.id || '',
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            capacity: classForm.capacity
        });

        setIsSubmittingClass(false);
        setShowClassModal(false);
        setClassForm({
            name: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '18:00',
            endTime: '19:00',
            capacity: 15
        });
    };

    const students = users.filter(u => u.role === 'student');

    const filteredStudents = students.filter(s => {
        const matchesName = (s.name + ' ' + s.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || s.ci.includes(searchTerm);
        const matchesPlan = selectedPlanId === 'all' || s.subscription?.planId === selectedPlanId;

        // Retention filter logic
        let matchesRetention = true;
        if (retentionFilter) {
            if (!s.subscription) {
                matchesRetention = true; // No plan
            } else {
                const daysRemaining = differenceInDays(new Date(s.subscription.endDate), new Date());
                matchesRetention = daysRemaining <= 5;
            }
        }

        return matchesName && matchesPlan && matchesRetention;
    });

    const studentForPr = users.find(u => u.id === viewingPrStudent);

    return (
        <div className="space-y-6 relative">
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Panel del Entrenador</h2>
                <p className="text-slate-400">Gestión de asistencias y rutinas de alumnos.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Asistencia por clase */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl relative min-h-[300px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-700/50 rounded-lg text-[#ff6a00]">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-white">Gestión de Clases</h3>
                        </div>
                        <button
                            onClick={() => setShowClassModal(true)}
                            className="flex items-center gap-1.5 text-xs font-bold bg-[#ff6a00]/20 text-[#ff6a00] hover:bg-[#ff6a00] hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <PlusCircle className="w-4 h-4" /> Añadir Clase
                        </button>
                    </div>

                    <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg border border-slate-700 w-fit">
                        <button
                            onClick={() => setClassFilter('today')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${classFilter === 'today' ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:text-white'}`}
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => setClassFilter('upcoming')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${classFilter === 'upcoming' ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-400 hover:text-white'}`}
                        >
                            Próximas
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(() => {
                            const trainerClasses = classes.filter(c => c.instructor === currentUser?.id);
                            const todayStr = new Date().toISOString().split('T')[0];
                            const filteredClasses = trainerClasses.filter(c => {
                                const classDateStr = new Date(c.startTime).toISOString().split('T')[0];
                                if (classFilter === 'today') {
                                    return classDateStr === todayStr;
                                } else {
                                    return new Date(c.startTime).getTime() > new Date().getTime() && classDateStr !== todayStr;
                                }
                            });

                            if (filteredClasses.length === 0) {
                                return (
                                    <div className="h-40 flex flex-col items-center justify-center p-8 bg-slate-900/30 border border-dashed border-slate-700 rounded-xl">
                                        <Calendar className="w-10 h-10 text-slate-600 mb-3" />
                                        <p className="text-slate-400 text-center">No hay clases asignadas para {classFilter === 'today' ? 'hoy' : 'los próximos días'}.</p>
                                    </div>
                                );
                            }

                            return filteredClasses.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((c: ClassSession) => {
                                const isExpanded = expandedClassId === c.id;
                                const isFull = c.enrolledStudents.length >= c.capacity;
                                return (
                                    <div key={c.id} className="bg-slate-800 rounded-xl border border-slate-700 p-0 transition-all hover:border-slate-500 overflow-hidden shadow-lg">
                                        <div
                                            className="p-4 cursor-pointer flex justify-between items-start bg-slate-700/20 hover:bg-slate-700/40 transition-colors"
                                            onClick={() => setExpandedClassId(isExpanded ? null : c.id)}
                                        >
                                            <div>
                                                <h4 className="font-bold text-lg text-white mb-1 group-hover:text-[#ff6a00] transition-colors">{c.name}</h4>
                                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 capitalize">
                                                        <Calendar className="w-3.5 h-3.5 text-[#ff6a00]" /> {formatShortDate(c.startTime)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                                        <Clock className="w-3.5 h-3.5 text-[#39ff14]" /> {formatTime(c.startTime)} - {formatTime(c.endTime)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${isFull ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/20 shadow-[0_0_10px_rgba(57,255,20,0.1)]'}`}>
                                                    <Users className="w-3.5 h-3.5" />
                                                    {c.capacity - c.enrolledStudents.length} LIBRES ({c.enrolledStudents.length}/{c.capacity})
                                                </div>
                                                <span className="text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300 transition-colors font-medium">
                                                    {isExpanded ? <><ChevronUp className="w-4 h-4" /> Ocultar alumnos</> : <><ChevronDown className="w-4 h-4" /> Ver inscritos</>}
                                                </span>
                                            </div>
                                        </div>

                                        {/* List students with Check-in Controls */}
                                        {isExpanded && (
                                            <div className="p-4 border-t border-slate-600/50 bg-slate-800 animate-fade-in text-sm">
                                                <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider flex items-center gap-2">
                                                    <CheckSquare className="w-4 h-4" /> Lista de Asistencia Automática:
                                                </p>
                                                {c.enrolledStudents.length > 0 ? (
                                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {c.enrolledStudents.map(studentId => {
                                                            const student = users.find(u => u.id === studentId);
                                                            const hasAttended = c.attendedStudents?.includes(studentId);
                                                            return (
                                                                <button
                                                                    key={studentId}
                                                                    onClick={(e) => { e.stopPropagation(); markAttendance(c.id, studentId); }}
                                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${hasAttended ? 'bg-[#39ff14]/10 border border-[#39ff14]/30 shadow-[0_0_15px_rgba(57,255,20,0.05)]' : 'bg-slate-900/50 hover:bg-slate-700 border border-slate-700/50 hover:border-[#ff6a00]/50'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        {hasAttended ? (
                                                                            <CheckSquare className="w-5 h-5 text-[#39ff14] flex-shrink-0" />
                                                                        ) : (
                                                                            <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                                                        )}
                                                                        <span className={`text-sm font-medium ${hasAttended ? 'text-[#39ff14]' : 'text-slate-300'}`}>
                                                                            {student ? `${student.name} ${student.lastName}` : 'ID No Registrado'}
                                                                        </span>
                                                                    </div>
                                                                    {hasAttended && <span className="text-[10px] font-black text-[#39ff14] uppercase tracking-wider px-2 py-0.5 rounded border border-[#39ff14]/30 bg-[#39ff14]/10">Presente</span>}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 bg-slate-900/30 rounded-lg border border-slate-700/50 border-dashed">
                                                        <p className="text-slate-500 italic">No hay alumnos inscritos en esta sesión aún.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Cargar Rutina / Biblioteca */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-700/50 rounded-lg text-[#39ff14]">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-white">
                                {routineView === 'create' ? 'Asignar Rutina' : 'Biblioteca de Rutinas'}
                            </h3>
                        </div>
                        <div className="flex gap-1 bg-slate-900 p-1 rounded-xl shadow-inner">
                            <button
                                onClick={() => setRoutineView('create')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${routineView === 'create' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Nueva
                            </button>
                            <button
                                onClick={() => setRoutineView('library')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${routineView === 'library' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Biblioteca
                            </button>
                        </div>
                    </div>

                    {routineView === 'create' ? (
                        <>
                            <form onSubmit={handleAssignRoutine} className="space-y-4 animate-fade-in">
                                <div className="flex gap-4 mb-4">
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={assignTarget === 'student'}
                                            onChange={() => setAssignTarget('student')}
                                            className="text-[#39ff14] focus:ring-[#39ff14] bg-slate-900 border-slate-700"
                                        />
                                        A Alumno Específico
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={assignTarget === 'plan'}
                                            onChange={() => setAssignTarget('plan')}
                                            className="text-[#39ff14] focus:ring-[#39ff14] bg-slate-900 border-slate-700"
                                        />
                                        A un Plan (Global)
                                    </label>
                                </div>

                                {assignTarget === 'student' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Seleccionar Alumno</label>
                                        <select
                                            value={selectedStudent}
                                            onChange={(e) => setSelectedStudent(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#39ff14] focus:border-transparent"
                                            required={assignTarget === 'student'}
                                        >
                                            <option value="" disabled>Seleccione un alumno...</option>
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Seleccionar Plan</label>
                                        <select
                                            value={selectedPlanForRoutine}
                                            onChange={(e) => setSelectedPlanForRoutine(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#39ff14] focus:border-transparent"
                                            required={assignTarget === 'plan'}
                                        >
                                            <option value="" disabled>Seleccione un plan...</option>
                                            {plans.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de la Rutina</label>
                                    <input
                                        type="text"
                                        value={routineName}
                                        onChange={(e) => setRoutineName(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#39ff14] focus:border-transparent placeholder-slate-500"
                                        placeholder="Ej. Hipertrofia Tren Superior"
                                        required
                                    />
                                </div>

                                <div className="border border-slate-700 rounded-xl p-4 bg-slate-900/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-sm font-medium text-slate-300">Ejercicios</label>
                                        <button type="button" onClick={handleAddExercise} className="text-xs font-bold text-[#39ff14] hover:text-green-400 flex items-center gap-1 bg-[#39ff14]/10 px-2 py-1 rounded-lg">
                                            <PlusCircle className="w-3 h-3" /> Añadir
                                        </button>
                                    </div>

                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {exercises.map((ex, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-800 p-2 border border-slate-700 rounded-lg relative group">
                                                <input
                                                    type="text"
                                                    value={ex.name}
                                                    onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                                                    placeholder="Ejercicio"
                                                    className="w-full sm:flex-1 bg-slate-900 border border-slate-700 rounded py-1 px-2 text-white text-sm focus:outline-none focus:border-[#39ff14]"
                                                    required
                                                />
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <div className="flex items-center justify-between gap-1 w-1/3 sm:w-16">
                                                        <span className="text-xs text-slate-400">Sets</span>
                                                        <input
                                                            type="number"
                                                            value={ex.sets}
                                                            onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                                                            className="w-8 bg-slate-900 border border-slate-700 rounded py-1 px-1 text-center text-white text-xs focus:outline-none focus:border-[#39ff14]"
                                                            min="1" required
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1 w-1/3 sm:w-24">
                                                        <span className="text-xs text-slate-400">Reps</span>
                                                        <input
                                                            type="text"
                                                            value={ex.reps}
                                                            onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                                                            className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-2 text-white text-xs focus:outline-none focus:border-[#39ff14]"
                                                            placeholder="10-12" required
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1 w-1/3 sm:w-24">
                                                        <span className="text-xs text-slate-400">Peso</span>
                                                        <input
                                                            type="text"
                                                            value={ex.weight || ''}
                                                            onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                                                            className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-2 text-white text-xs focus:outline-none focus:border-[#39ff14]"
                                                            placeholder="70-80 kg"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExercise(index)}
                                                    className="absolute -right-2 -top-2 bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    disabled={exercises.length === 1}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-[#39ff14] to-green-500 hover:from-green-400 hover:to-green-600 text-slate-900 font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-green-900/20 active:scale-[0.98] mt-4"
                                >
                                    Crear y Asignar Rutina
                                </button>
                            </form>

                            <div className="mt-8 border-t border-slate-700 pt-6">
                                <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4" /> Últimas Rutinas Asignadas
                                </h4>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {useGymStore.getState().routines.length > 0 ? [...useGymStore.getState().routines].reverse().slice(0, 10).map(r => {
                                        const student = students.find(s => s.id === r.assignedTo);
                                        return (
                                            <div key={r.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex justify-between items-center transition-colors hover:border-slate-500">
                                                <div>
                                                    <p className="font-bold text-white text-sm">{r.name}</p>
                                                    <p className="text-xs text-slate-400">Asignado a: <span className="text-slate-300">{r.planId ? `Plan ${plans.find(p => p.id === r.planId)?.name || '...'}` : (student ? `${student.name} ${student.lastName}` : 'Desconocido')}</span></p>
                                                </div>
                                                <div className="text-xs bg-[#39ff14]/10 text-[#39ff14] px-2 py-1 rounded font-medium">
                                                    {r.exercises.length} ej.
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <p className="text-xs text-slate-500 italic text-center py-4">No hay rutinas asignadas recientemente.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <p className="text-sm text-slate-400 mb-4">Selecciona una rutina existente para reutilizar sus ejercicios y estructura para otro alumno o plan.</p>
                            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {[...routines].reverse().map(r => (
                                    <div key={r.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 hover:border-slate-500 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">{r.name}</h4>
                                            <p className="text-xs text-slate-400">Ejercicios: <span className="text-[#39ff14] font-medium">{r.exercises.length}</span></p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPreviewRoutine(r)}
                                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Eye className="w-4 h-4" /> Ver
                                            </button>
                                            <button
                                                onClick={() => handleDuplicateRoutine(r)}
                                                className="w-full xl:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                                            >
                                                <PlusCircle className="w-4 h-4" /> Reasignar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {routines.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 text-sm">No hay rutinas creadas aún.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Directorio de Alumnos */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit lg:col-span-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-700/50 rounded-lg text-blue-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-white">Directorio de Alumnos</h3>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o CI..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 w-full"
                                />
                            </div>
                            <select
                                value={selectedPlanId}
                                onChange={e => setSelectedPlanId(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                            >
                                <option value="all">Todos los Planes</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>

                            {/* Retention Filter Toggle */}
                            <button
                                onClick={() => setRetentionFilter(!retentionFilter)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 border ${retentionFilter ? 'bg-orange-500/20 text-[#ff6a00] border-[#ff6a00]/50' : 'bg-slate-900 text-slate-400 hover:text-white border-slate-700'}`}
                                title="Mostrar alumnos con plan vencido o por vencer (< 5 días)"
                            >
                                <AlertTriangle className="w-4 h-4" /> Alerta Retención
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Alumno</th>
                                    <th className="px-4 py-3">CI</th>
                                    <th className="px-4 py-3 text-center">Plan Autorizado (Vencimiento)</th>
                                    <th className="px-4 py-3 text-center rounded-tr-lg">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredStudents.length > 0 ? filteredStudents.map(student => {
                                    const plan = plans.find(p => p.id === student.subscription?.planId);
                                    return (
                                        <tr key={student.id} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{student.name} {student.lastName}</td>
                                            <td className="px-4 py-3 font-mono text-slate-400">{student.ci}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="bg-slate-700 px-2 py-1 rounded text-xs mb-1">{plan ? plan.name : 'Sin plan'}</span>
                                                    {student.subscription && (
                                                        <span className={`text-[10px] font-bold ${differenceInDays(new Date(student.subscription.endDate), new Date()) > 0 ? 'text-[#39ff14]' : 'text-red-400'}`}>
                                                            Vence: {new Date(student.subscription.endDate).toLocaleDateString('es-ES')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setViewingPrStudent(student.id)}
                                                    className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                                                >
                                                    <Trophy className="w-4 h-4" /> Marcas (PR)
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No se encontraron alumnos con los filtros actuales.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PR Dashboard Modal (Conditionally Rendered as an overlay/box) */}
                {viewingPrStudent && studentForPr && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-slate-800 border border-slate-600 rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-2xl relative">
                            <button
                                onClick={() => setViewingPrStudent(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>

                            <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                    <Medal className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Marcas Personales (PR)</h2>
                                    <p className="text-slate-400">{studentForPr.name} {studentForPr.lastName}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-indigo-400" /> Historial de Marcas
                                    </h4>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {studentForPr.personalRecords.length > 0 ? (
                                            [...studentForPr.personalRecords].reverse().map(pr => (
                                                <div key={pr.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-slate-200">{pr.exerciseName}</p>
                                                        <p className="text-xs text-slate-500">{new Date(pr.date).toLocaleDateString('es-ES')}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xl font-extrabold text-[#39ff14]">{pr.value}</span>
                                                        <span className="text-sm text-slate-400 ml-1">{pr.unit}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 text-sm">Este alumno aún no tiene marcas registradas.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700">
                                    <h4 className="font-semibold text-slate-200 mb-4">Nueva Marca</h4>
                                    <form onSubmit={handleAddPr} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Ejercicio</label>
                                            <input
                                                type="text"
                                                value={newPrExercise}
                                                onChange={(e) => setNewPrExercise(e.target.value)}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Ej. Peso Muerto, Thruster"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Valor Alcanzado (kg)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={newPrValue}
                                                onChange={(e) => setNewPrValue(e.target.value)}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Ej. 120"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-2"
                                        >
                                            Guardar PR
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Crear Clase */}
                {showClassModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
                            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#ff6a00]" /> Programar Clase
                                </h3>
                                <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de la Clase</label>
                                    <input
                                        type="text"
                                        required
                                        value={classForm.name}
                                        onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-[#ff6a00]"
                                        placeholder="Ej. CrossFit Mañana"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de la Clase</label>
                                    <input
                                        type="date"
                                        required
                                        value={classForm.date}
                                        onChange={e => setClassForm({ ...classForm, date: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-[#ff6a00]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Hora Inicio</label>
                                        <input
                                            type="time"
                                            required
                                            value={classForm.startTime}
                                            onChange={e => setClassForm({ ...classForm, startTime: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-[#ff6a00]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Hora Fin</label>
                                        <input
                                            type="time"
                                            required
                                            value={classForm.endTime}
                                            onChange={e => setClassForm({ ...classForm, endTime: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-[#ff6a00]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Capacidad (Cupos)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={classForm.capacity}
                                        onChange={e => setClassForm({ ...classForm, capacity: parseInt(e.target.value) })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-white focus:ring-1 focus:ring-[#ff6a00]"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmittingClass}
                                    className="w-full mt-4 py-3 rounded-xl font-bold bg-[#ff6a00] hover:bg-orange-500 text-white disabled:opacity-50 transition-colors"
                                >
                                    {isSubmittingClass ? 'Guardando...' : 'Crear Clase'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
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
                                                <span className="font-bold text-[#39ff14] text-sm">{ex.reps}</span>
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
                                        handleDuplicateRoutine(previewRoutine);
                                        setPreviewRoutine(null);
                                    }}
                                    className="w-full py-3 rounded-xl font-bold bg-[#39ff14] hover:bg-green-400 text-slate-900 transition-colors shadow-lg shadow-green-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <PlusCircle className="w-5 h-5" /> Utilizar esta estructura
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de últimas rutinas asignadas */}
            {routines.length > 0 && (
                <div className="mt-8">
                    <h3 className="font-bold text-white text-lg mb-4">Últimas Rutinas Asignadas</h3>
                    <div className="space-y-3">
                        {routines.slice(-3).reverse().map((routine) => (
                            <div
                                key={routine.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-neon-green/30 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">{routine.nombre}</span>
                                    <span className="text-xs text-gray-400">
                                        {routine.es_global ? 'Plan Global' : `Estudiante: ${routine.estudiante_nombre}`}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDuplicateRoutine(routine)}
                                    className="p-2 text-neon-green hover:bg-neon-green/10 rounded-full transition-colors"
                                    title="Duplicar rutina"
                                >
                                    <Layers size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mis Disciplinas */}
            {trainerDisciplines.length > 0 && (
                <div className="mt-8 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-lg">Mis Disciplinas</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {trainerDisciplines.map(d => {
                            const plan = plans.find(p => p.id === d.planId);
                            return (
                                <div key={d.id} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-4 py-2">
                                    <span className="w-2 h-2 rounded-full bg-[#39ff14]" />
                                    <span className="text-white font-medium text-sm">{plan?.name || 'Disciplina'}</span>
                                    <button
                                        onClick={() => removeTrainerDiscipline(d.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors ml-1">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
        </div >
    );
};

export default TrainerDashboard;
