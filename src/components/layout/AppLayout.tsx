import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useGymStore } from '../../store/useStore';
import { Dumbbell, LayoutDashboard, CalendarDays, ClipboardList, LogOut, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for conditional tailwind classes
export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export default function AppLayout() {
    const { currentUser } = useGymStore();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    if (!currentUser) return null;

    const isStudent = currentUser.role === 'student';

    const navItems = [
        { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
        { name: isStudent ? 'Mis Clases' : 'Clases', path: '/app/classes', icon: CalendarDays },
        { name: 'Planes', path: '/app/plans', icon: ClipboardList },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-50 flex flex-col md:flex-row font-sans max-w-[100vw] overflow-x-hidden">

            {/* TopBar para Mobile */}
            <div className="md:hidden bg-[#1e293b] border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-[#39ff14] to-[#ff6a00] rounded-md shadow-lg">
                        <Dumbbell className="w-5 h-5 text-slate-900" />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-white uppercase italic">
                        Gymflow <span className="text-[#39ff14]">Pro</span>
                    </h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Overlay Mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar / Navigation */}
            <aside className={cn(
                "fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#1e293b] border-r border-slate-700 flex flex-col justify-between transition-transform duration-300 ease-in-out h-full md:h-auto",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6 md:p-4 pb-0 overflow-y-auto">
                    {/* Header solo visible en Desktop */}
                    <div className="hidden md:flex items-center gap-3 mb-8 px-2 mt-2">
                        <div className="p-2 bg-gradient-to-br from-[#39ff14] to-[#ff6a00] rounded-lg shadow-lg">
                            <Dumbbell className="w-6 h-6 text-slate-900" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white uppercase italic">
                            Gymflow <span className="text-[#39ff14]">Pro</span>
                        </h1>
                    </div>

                    <nav className="space-y-2 mt-4 md:mt-0">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                                    isActive
                                        ? "bg-slate-700/50 text-[#39ff14] shadow-[inset_4px_0_0_0_#39ff14] md:shadow-[inset_4px_0_0_0_#39ff14]"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* User Profile Summary */}
                <div className="mt-8 p-4 border-t border-slate-700 bg-[#1e293b] shrink-0 mt-auto">
                    {currentUser && (
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff6a00] to-orange-400 flex items-center justify-center font-bold text-slate-900 flex-shrink-0">
                                {currentUser.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden min-w-0">
                                <p className="text-sm font-semibold truncate text-slate-200" title={currentUser.name}>{currentUser.name}</p>
                                <p className="text-xs text-[#39ff14] capitalize font-medium">{currentUser.role === 'student' ? 'Alumno' : 'Entrenador'}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            useGymStore.getState().logout();
                            navigate('/');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-red-400 transition-colors text-sm font-medium border border-slate-700 hover:border-slate-500 mt-4 h-10"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto w-full md:w-[calc(100vw-16rem)] min-h-screen relative z-0">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
