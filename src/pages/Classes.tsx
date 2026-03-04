import { useGymStore } from '../store/useStore';
import type { ClassSession } from '../store/useStore';
import { Calendar, Clock, Users, UserPlus, UserMinus, ShieldCheck } from 'lucide-react';
import { cn } from '../components/layout/AppLayout';

export default function Classes() {
    const { classes, currentUser, enrollClass, cancelClass, users, updateClassCapacity } = useGymStore();

    const isStudent = currentUser?.role === 'student';

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
    };

    const handleEnroll = (classId: string) => {
        enrollClass(classId);
        alert('Te has inscrito en la clase exitosamente.');
    };

    const handleCancel = (classId: string) => {
        cancelClass(classId);
        alert('Has cancelado tu inscripción en la clase.');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Reserva de Clases</h2>
                <p className="text-slate-400">
                    {isStudent ? 'Asegura tu lugar en las sesiones de hoy y próximos días.' : 'Gestiona y visualiza la disponibilidad de las clases.'}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {classes.map((c: ClassSession) => {
                    const isFull = c.enrolledStudents.length >= c.capacity;
                    const isEnrolled = currentUser ? c.enrolledStudents.includes(currentUser.id) : false;
                    const instructor = users.find(u => u.id === c.instructor);

                    return (
                        <div
                            key={c.id}
                            className={cn(
                                "bg-slate-800 rounded-2xl p-6 shadow-xl border transition-all hover:-translate-y-1 relative overflow-hidden group",
                                isEnrolled
                                    ? "border-[#39ff14] ring-1 ring-[#39ff14]/50 shadow-[0_0_20px_rgba(57,255,20,0.1)]"
                                    : "border-slate-700 hover:border-slate-500"
                            )}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#39ff14] transition-colors">{c.name}</h3>
                                    <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
                                        <ShieldCheck className="w-4 h-4 text-[#ff6a00]" />
                                        <span>Entrenador: <span className="text-slate-300">{instructor?.name}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-slate-300 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-700/50">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <span className="capitalize">{formatDate(c.startTime)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-700/50">
                                    <Clock className="w-5 h-5 text-[#39ff14]" />
                                    <span>{formatTime(c.startTime)} - {formatTime(c.endTime)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-700/50">
                                    <Users className="w-5 h-5 text-[#ff6a00]" />
                                    <span className="flex-1">Cupos disponibles</span>
                                    <span className="font-bold text-white">
                                        {c.capacity - c.enrolledStudents.length} / {c.capacity}
                                    </span>
                                </div>
                            </div>

                            {/* Botón de Acción para Entrenadores: Editar Aforo */}
                            {!isStudent && currentUser && (
                                <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col gap-2">
                                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Control de Aforo</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateClassCapacity(c.id, Math.max(c.enrolledStudents.length, c.capacity - 1))}
                                            className="bg-slate-700 hover:bg-slate-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors"
                                        >
                                            -
                                        </button>
                                        <div className="flex-1 bg-slate-900 border border-slate-700 py-2 rounded-lg text-center font-bold text-white">
                                            {c.capacity} pers.
                                        </div>
                                        <button
                                            onClick={() => updateClassCapacity(c.id, c.capacity + 1)}
                                            className="bg-slate-700 hover:bg-slate-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Botón de Acción solo para Alumnos */}
                            {isStudent && (
                                <>
                                    {isEnrolled ? (
                                        <button
                                            onClick={() => handleCancel(c.id)}
                                            className="w-full bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 font-bold py-3 px-4 rounded-xl transition-all border border-slate-600 hover:border-red-500/50 flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                        >
                                            <UserMinus className="w-5 h-5" />
                                            Cancelar Reserva
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleEnroll(c.id)}
                                            disabled={isFull}
                                            className={cn(
                                                "w-full font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2",
                                                isFull
                                                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-[#39ff14] to-green-500 hover:from-green-400 hover:to-green-600 text-slate-900 shadow-lg shadow-green-900/20 hover:shadow-green-900/40"
                                            )}
                                        >
                                            {isFull ? (
                                                <>Clase Llena</>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-5 h-5" />
                                                    Reservar Clase
                                                </>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
