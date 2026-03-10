import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGymStore } from '../store/useStore';
import { Dumbbell, ArrowRight } from 'lucide-react';

export default function Login() {
    const [ci, setCi] = useState('');
    const [error, setError] = useState('');
    const { loginWithCI } = useGymStore();
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!ci.trim()) return;

        const success = loginWithCI(ci);
        if (success) {
            navigate('/app');
        } else {
            setError('CI no encontrado. Verifica tu número o haz clic en "Inscribirme".');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Decorators */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#39ff14] opacity-[0.03] rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#ff6a00] opacity-[0.03] rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
                <div className="flex flex-col items-center justify-center mb-10">
                    <div className="p-4 bg-gradient-to-br from-[#39ff14] to-[#ff6a00] rounded-2xl shadow-lg mb-4">
                        <Dumbbell className="w-10 h-10 text-slate-900" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase italic">
                        Gymflow <span className="text-[#39ff14]">Pro</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-center text-sm">Ingresa tu Carnet de Identidad para continuar.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Carnet de Identidad (CI)</label>
                        <input
                            type="text"
                            value={ci}
                            onChange={(e) => { setCi(e.target.value); setError(''); }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#39ff14] focus:border-transparent placeholder-slate-500 font-mono text-lg tracking-wider"
                            placeholder="Ej: 12345678"
                            required
                        />
                        {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Entrar <ArrowRight className="w-5 h-5" />
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">o si eres nuevo</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="w-full bg-[#39ff14]/10 hover:bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/50 font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Inscribirme
                        </button>
                    </div>
                </form>

                <p className="text-xs text-slate-500 mt-6 text-center">
                    Si no tienes cuenta, el sistema te redirigirá a la pantalla de registro de forma automática.
                    <br /><br />
                    <span className="text-slate-400 font-mono">Demo: Alumno=12345678 | Entrenador=87654321 | Admin=1234</span>
                </p>
            </div>
        </div>
    );
}
