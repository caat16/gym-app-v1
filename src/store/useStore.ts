import { create } from 'zustand';
import { addDays, subDays, setHours, setMinutes } from 'date-fns';

export type UserRole = 'student' | 'trainer' | 'admin';

export interface BiometricRecord {
    id: string;
    date: string;
    weight: number;
    height: number;
    bmi: number;
}

export interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
}

export interface Subscription {
    planId: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'expiring_soon';
}

export interface PersonalRecord {
    id: string;
    date: string;
    exerciseName: string;
    value: number;
    unit: string;
}

export interface User {
    id: string;
    ci: string;
    role: UserRole;
    name: string;
    lastName: string;
    age: number;
    email: string;
    avatar?: string;
    biometrics: BiometricRecord[];
    personalRecords: PersonalRecord[];
    subscription?: Subscription;
    waiverSigned: boolean;
}

export interface ClassSession {
    id: string;
    name: string;
    instructor: string;
    startTime: string; // ISO string
    endTime: string;
    capacity: number;
    enrolledStudents: string[]; // User IDs
    attendedStudents: string[]; // User IDs of those who checked in
}

export interface Routine {
    id: string;
    name: string;
    assignedTo: string; // User ID
    exercises: { name: string; sets: number; reps: number }[];
}

interface GymStore {
    currentUser: User | null;
    users: User[];
    plans: Plan[];
    classes: ClassSession[];
    routines: Routine[];

    // Actions
    login: (userId: string) => void;
    loginWithCI: (ci: string) => boolean;
    logout: () => void;
    enrollClass: (classId: string) => void;
    cancelClass: (classId: string) => void;
    assignRoutine: (routine: Routine) => void;
    subscribePlan: (planId: string) => void;
    registerStudent: (student: Omit<User, 'id' | 'role'>) => void;
    registerTrainer: (trainerData: Omit<User, 'id' | 'role' | 'biometrics' | 'personalRecords' | 'waiverSigned'>) => void;
    updateClassCapacity: (classId: string, capacity: number) => void;
    addPersonalRecord: (studentId: string, record: Omit<PersonalRecord, 'id'>) => void;
    markAttendance: (classId: string, studentId: string) => void;
}

// Initial Mock Data
const today = new Date();

export const PLANS: Plan[] = [
    { id: 'p1', name: 'Plan Mujeres', description: 'Entrenamiento enfocado en tonificación y fuerza femenina', price: 29.99, features: ['Acceso total', 'Clases grupales'] },
    { id: 'p2', name: 'Plan Senior', description: 'Ejercicios de bajo impacto y movilidad para adultos mayores', price: 19.99, features: ['Horario matutino', 'Asesoría especializada'] },
    { id: 'p3', name: 'Plan Calistenia', description: 'Dominio del peso corporal y gimnasia', price: 34.99, features: ['Zona calistenia', 'Talleres técnicos'] },
    { id: 'p4', name: 'Plan Híbrido', description: 'Combinación de pesas y entrenamiento funcional', price: 39.99, features: ['Acceso 24/7', 'Rutinas personalizadas'] },
    { id: 'p5', name: 'Plan Power Plate', description: 'Entrenamiento de fuerza extrema y powerlifting', price: 44.99, features: ['Equipamiento profesional', 'Zona lifting'] },
];

const MOCK_USERS: User[] = [
    {
        id: 'u0',
        ci: '1234',
        role: 'admin',
        name: 'Administrador',
        lastName: 'Gymflow',
        age: 35,
        email: 'admin@gymflowpro.com',
        waiverSigned: true,
        biometrics: [],
        personalRecords: []
    },
    {
        id: 'u1',
        ci: '12345678',
        role: 'student',
        name: 'Alex',
        lastName: 'Arandia',
        age: 28,
        email: 'alex@example.com',
        waiverSigned: true,
        biometrics: [
            { id: 'b1', date: subDays(today, 60).toISOString(), weight: 75, height: 175, bmi: 24.5 },
            { id: 'b2', date: subDays(today, 30).toISOString(), weight: 73, height: 175, bmi: 23.8 },
            { id: 'b3', date: today.toISOString(), weight: 71, height: 175, bmi: 23.2 },
        ],
        personalRecords: [
            { id: 'pr1', date: subDays(today, 10).toISOString(), exerciseName: 'Peso Muerto', value: 100, unit: 'kg' },
            { id: 'pr2', date: today.toISOString(), exerciseName: 'Peso Muerto', value: 110, unit: 'kg' }
        ],
        subscription: {
            planId: 'p4',
            startDate: subDays(today, 28).toISOString(),
            endDate: addDays(today, 2).toISOString(), // Expiring soon (<5 days)
            status: 'expiring_soon',
        }
    },
    {
        id: 't1',
        ci: '87654321',
        role: 'trainer',
        name: 'Carlos',
        lastName: 'Coach',
        age: 35,
        email: 'carlos@gymflow.com',
        waiverSigned: true,
        biometrics: [],
        personalRecords: [],
    }
];

const MOCK_CLASSES: ClassSession[] = [
    {
        id: 'c1',
        name: 'Crossfit WOD',
        instructor: 't1',
        capacity: 12,
        startTime: setHours(setMinutes(today, 0), 18).toISOString(),
        endTime: setHours(setMinutes(today, 0), 19).toISOString(),
        enrolledStudents: ['u1'], // Alex pre-registered
        attendedStudents: []
    },
    {
        id: 'c2',
        name: 'Yoga Flow',
        instructor: 't1',
        capacity: 15,
        startTime: setHours(setMinutes(today, 0), 19).toISOString(),
        endTime: setHours(setMinutes(today, 0), 20).toISOString(),
        enrolledStudents: [],
        attendedStudents: []
    },
    {
        id: 'c3',
        name: 'Powerlifting',
        instructor: 't1',
        capacity: 8,
        startTime: setHours(setMinutes(today, 0), 20).toISOString(),
        endTime: setHours(setMinutes(today, 0), 21).toISOString(),
        enrolledStudents: [],
        attendedStudents: []
    }
];

export const useGymStore = create<GymStore>((set) => ({
    currentUser: null, // Logged in as student by default
    users: MOCK_USERS,
    plans: PLANS,
    classes: MOCK_CLASSES,
    routines: [],

    login: (userId) => set((state) => ({ currentUser: state.users.find(u => u.id === userId) || null })),

    loginWithCI: (ci) => {
        let success = false;
        set((state) => {
            const user = state.users.find(u => u.ci === ci);
            if (user) {
                success = true;
                return { currentUser: user };
            }
            return state;
        });
        return success;
    },

    logout: () => set({ currentUser: null }),

    enrollClass: (classId) => set((state) => {
        if (!state.currentUser || state.currentUser.role !== 'student') return state;
        return {
            classes: state.classes.map(c => {
                if (c.id === classId && c.enrolledStudents.length < c.capacity && !c.enrolledStudents.includes(state.currentUser!.id)) {
                    return { ...c, enrolledStudents: [...c.enrolledStudents, state.currentUser!.id] };
                }
                return c;
            })
        };
    }),

    cancelClass: (classId) => set((state) => {
        if (!state.currentUser) return state;
        return {
            classes: state.classes.map(c =>
                c.id === classId
                    ? { ...c, enrolledStudents: c.enrolledStudents.filter(id => id !== state.currentUser!.id) }
                    : c
            )
        };
    }),

    assignRoutine: (routine) => set((state) => ({
        routines: [...state.routines, routine]
    })),

    subscribePlan: (planId) => set((state) => {
        if (!state.currentUser) return state;
        const newSub: Subscription = {
            planId,
            startDate: new Date().toISOString(),
            endDate: addDays(new Date(), 30).toISOString(),
            status: 'active'
        };

        // Update both currentUser and the user in the array
        const updatedUser = { ...state.currentUser, subscription: newSub };
        return {
            currentUser: updatedUser,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
        };
    }),

    registerStudent: (student) => set((state) => {
        const newUser: User = {
            ...student,
            id: `u_${Date.now()}`,
            role: 'student',
        };
        return { users: [...state.users, newUser], currentUser: newUser };
    }),

    registerTrainer: (trainerData) => set((state) => {
        const newUser: User = {
            ...trainerData,
            id: `u_${Date.now()}`,
            role: 'trainer',
            waiverSigned: true,
            biometrics: [],
            personalRecords: []
        };
        return { users: [...state.users, newUser] };
    }),

    updateClassCapacity: (classId, capacity) => set((state) => ({
        classes: state.classes.map(c => c.id === classId ? { ...c, capacity } : c)
    })),

    addPersonalRecord: (studentId, record) => set((state) => ({
        users: state.users.map(u => {
            if (u.id === studentId) {
                return {
                    ...u,
                    personalRecords: [...u.personalRecords, { ...record, id: `pr_${Date.now()} ` }]
                };
            }
            return u;
        })
    })),

    markAttendance: (classId, studentId) => set((state) => ({
        classes: state.classes.map(c => {
            if (c.id === classId) {
                const alreadyAttended = c.attendedStudents.includes(studentId);
                return {
                    ...c,
                    attendedStudents: alreadyAttended
                        ? c.attendedStudents.filter(id => id !== studentId)
                        : [...c.attendedStudents, studentId]
                };
            }
            return c;
        })
    }))
}));
