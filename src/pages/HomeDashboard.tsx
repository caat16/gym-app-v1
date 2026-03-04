import { useGymStore } from '../store/useStore';
import StudentDashboard from './StudentDashboard';
import TrainerDashboard from './TrainerDashboard';
import AdminDashboard from './AdminDashboard';

export default function HomeDashboard() {
    const currentUser = useGymStore((state) => state.currentUser);

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">Por favor, inicie sesión.</p>
            </div>
        );
    }

    if (currentUser.role === 'admin') return <AdminDashboard />;
    return currentUser.role === 'student' ? <StudentDashboard /> : <TrainerDashboard />;
}
