import { useState } from 'react';
import { useGymStore } from '../store/useStore';
import type { ClassSession } from '../store/useStore';
import { Users, Calendar, PlusCircle, Search, Trophy, Medal, CheckSquare, Square, AlertTriangle, Trash2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function TrainerDashboard() {
    const { classes, users, plans, assignRoutine, addPersonalRecord, markAttendance } = useGymStore();
    const [selectedStudent, setSelectedStudent] = useState('');
    const [routineName, setRoutineName] = useState('');
    // Workout Builder State
    const [exercises, setExercises] = useState<{ name: string, sets: number, reps: number }[]>([{ name: '', sets: 3, reps: 10 }]);

    // Directory Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('all');
    const [retentionFilter, setRetentionFilter] = useState(false); // true shows expiring soon/expired

    // PR Modal State
    const [viewingPrStudent, setViewingPrStudent] = useState<string | null>(null);
    const [newPrExercise, setNewPrExercise] = useState('');
    const [newPrValue, setNewPrValue] = useState('');

    // Formatear hora: c.startTime -> '18:00'
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const handleAssignRoutine = (e: React.FormEvent) => {
        e.preventDefault();
        const validExercises = exercises.filter(ex => ex.name.trim() !== '');

        if (!selectedStudent || !routineName || validExercises.length === 0) {
            alert('Por favor complete todos los campos y agregue al menos un ejercicio válido.');
            return;
        }

        assignRoutine({
            id: `r_${Date.now()}`,
            name: routineName,
            assignedTo: selectedStudent,
            exercises: validExercises
        });

        // Reset form
        setSelectedStudent('');
        setRoutineName('');
        setExercises([{ name: '', sets: 3, reps: 10 }]);
        alert('Rutina personalizada asignada exitosamente.');
    };

    const handleAddExercise = () => {
        setExercises([...exercises, { name: '', sets: 3, reps: 10 }]);
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
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Panel del Entrenador</h2>
                <p className="text-slate-400">Gestión de asistencias y rutinas de alumnos.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Asistencia por clase */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-700/50 rounded-lg text-[#ff6a00]">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-white">Clases de Hoy</h3>
                    </div>

                    <div className="space-y-4">
                        {classes.map((c: ClassSession) => (
                            <div key={c.id} className="bg-slate-700/30 rounded-xl border border-slate-700 p-4 transition-all hover:border-slate-500">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-lg text-white">{c.name}</h4>
                                        <p className="text-sm text-slate-400">{formatTime(c.startTime)} - {formatTime(c.endTime)}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${c.enrolledStudents.length >= c.capacity ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-[#39ff14]'}`}>
                                        <Users className="w-4 h-4" />
                                        {c.enrolledStudents.length} / {c.capacity}
                                    </div>
                                </div>
                                {/* List students with Check-in Controls */}
                                {c.enrolledStudents.length > 0 ? (
                                    <div className="mt-3 pt-3 border-t border-slate-600/50">
                                        <p className="text-xs text-slate-400 mb-2">Pase de Lista (Check-in):</p>
                                        <div className="space-y-1">
                                            {c.enrolledStudents.map(studentId => {
                                                const student = users.find(u => u.id === studentId);
                                                const hasAttended = c.attendedStudents?.includes(studentId);
                                                return (
                                                    <button
                                                        key={studentId}
                                                        onClick={() => markAttendance(c.id, studentId)}
                                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${hasAttended ? 'bg-[#39ff14]/10 border border-[#39ff14]/30' : 'bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50'}`}
                                                    >
                                                        {hasAttended ? (
                                                            <CheckSquare className="w-5 h-5 text-[#39ff14] flex-shrink-0" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                                        )}
                                                        <span className={`text-sm ${hasAttended ? 'text-white' : 'text-slate-300'}`}>
                                                            {student?.name} {student?.lastName}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-3 pt-3 border-t border-slate-600/50 text-center">
                                        <p className="text-sm text-slate-500 italic">No hay alumnos inscritos.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cargar Rutina */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-700/50 rounded-lg text-[#39ff14]">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-white">Cargar Rutina</h3>
                    </div>

                    <form onSubmit={handleAssignRoutine} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Seleccionar Alumno</label>
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#39ff14] focus:border-transparent"
                                required
                            >
                                <option value="" disabled>Seleccione un alumno...</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                ))}
                            </select>
                        </div>

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
                                            <div className="flex items-center gap-1 w-1/2 sm:w-20">
                                                <span className="text-xs text-slate-400">Sets</span>
                                                <input
                                                    type="number"
                                                    value={ex.sets}
                                                    onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-1 text-center text-white text-sm focus:outline-none focus:border-[#39ff14]"
                                                    min="1" required
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 w-1/2 sm:w-20">
                                                <span className="text-xs text-slate-400">Reps</span>
                                                <input
                                                    type="number"
                                                    value={ex.reps}
                                                    onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-1 text-center text-white text-sm focus:outline-none focus:border-[#39ff14]"
                                                    min="1" required
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
                                    <th className="px-4 py-3">Plan Actual</th>
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
                                            <td className="px-4 py-3">
                                                <span className="bg-slate-700 px-2 py-1 rounded text-xs">{plan ? plan.name : 'Sin plan'}</span>
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

            </div>
        </div>
    );
}
