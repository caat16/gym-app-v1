import { useState } from 'react';
import { useGymStore } from '../store/useStore';
import { ShieldAlert, UserPlus, Users } from 'lucide-react';

export default function AdminDashboard() {
    const { registerTrainer, users } = useGymStore();
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [ci, setCi] = useState('');

    const trainers = users.filter(u => u.role === 'trainer');

    const handleRegisterTrainer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !lastName || !email || !ci) return;

        // Check if CI already exists
        const exists = users.find(u => u.ci === ci);
        if (exists) {
            alert('Ya existe un usuario con ese Carnet de Identidad en el sistema.');
            return;
        }

        registerTrainer({ name, lastName, email, ci, age: 30 }); // Default age for simplicity
        alert(`Entrenador ${name} ${lastName} registrado exitosamente. Puede ingresar con el CI: ${ci}`);

        setName('');
        setLastName('');
        setEmail('');
        setCi('');
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                    <ShieldAlert className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Panel de Administración</h2>
                    <p className="text-slate-400">Poder de Super Usuario: Alta de instructores y gestión de staff.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registro de Entrenador */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-700/50 rounded-lg text-[#39ff14]">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-white">Registrar Nuevo Entrenador</h3>
                    </div>

                    <form onSubmit={handleRegisterTrainer} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-500"
                                    placeholder="Ej. Carlos"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Apellido</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-500"
                                    placeholder="Ej. Mendez"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-500"
                                placeholder="entrenador@gymflowpro.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Carnet de Identidad (Para el Login)</label>
                            <input
                                type="text"
                                value={ci}
                                onChange={(e) => setCi(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-500 font-mono"
                                placeholder="Ej. 12345678"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-4 shadow-lg shadow-purple-900/20"
                        >
                            Crear Cuenta de Entrenador
                        </button>
                    </form>
                </div>

                {/* Directorio de Entrenadores */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-700/50 rounded-lg text-blue-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-white">Staff Actual ({trainers.length})</h3>
                    </div>

                    <div className="space-y-3">
                        {trainers.map(trainer => (
                            <div key={trainer.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center group hover:border-slate-500 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-white shadow-inner">
                                        {trainer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-md">{trainer.name} {trainer.lastName}</p>
                                        <p className="text-xs text-slate-400 font-mono">CI: {trainer.ci}</p>
                                    </div>
                                </div>
                                <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md font-medium border border-purple-500/20">Active</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
