import { create } from 'zustand';
import { addDays } from 'date-fns';

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

import { supabase } from '../lib/supabase';

interface GymStore {
    currentUser: User | null;
    users: User[];
    plans: Plan[];
    classes: ClassSession[];
    routines: Routine[];
    loading: boolean;

    // Métodos asíncronos para cargar desde DB
    fetchInitialData: () => Promise<void>;

    // Actions reescritas para backend
    loginWithCI: (ci: string) => Promise<boolean>;
    logout: () => void;
    subscribePlan: (planId: string) => Promise<void>;
    registerStudent: (student: Omit<User, 'id' | 'role' | 'biometrics' | 'personalRecords' | 'subscription' | 'waiverSigned'>) => Promise<void>;
    registerTrainer: (trainerData: Omit<User, 'id' | 'role' | 'biometrics' | 'personalRecords' | 'waiverSigned'>) => Promise<void>;
    assignRoutine: (routine: Omit<Routine, 'id'>) => Promise<void>;
    updateClassCapacity: (classId: string, capacity: number) => Promise<void>;
    enrollClass: (classId: string) => Promise<void>;
    cancelClass: (classId: string) => Promise<void>;
    addPersonalRecord: (studentId: string, record: Omit<PersonalRecord, 'id'>) => Promise<void>;
    markAttendance: (classId: string, studentId: string) => Promise<void>;
}

export const useGymStore = create<GymStore>((set, get) => ({
    currentUser: null,
    users: [],
    plans: [],
    classes: [],
    routines: [],
    loading: false,

    fetchInitialData: async () => {
        set({ loading: true });
        try {
            // Descargar Planes
            const { data: dbPlans } = await supabase.from('plans').select('*');

            // Descargar Rutinas
            const { data: dbRoutines } = await supabase.from('routines').select('*');

            // Descargar Usuarios Básicos
            const { data: dbUsers } = await supabase.from('users').select('*');

            set({
                plans: dbPlans || [],
                routines: dbRoutines || [],
                users: dbUsers ? dbUsers.map(u => ({
                    id: u.id,
                    ci: u.ci,
                    role: u.role,
                    name: u.name,
                    lastName: u.last_name,
                    age: u.age,
                    email: u.email,
                    waiverSigned: u.waiver_signed,
                    biometrics: [], // We fetch nested later if needed
                    personalRecords: []
                })) : [],
                loading: false
            });
        } catch (error) {
            console.error('Error fetching initial data:', error);
            set({ loading: false });
        }
    },

    loginWithCI: async (ci) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    *,
                    biometrics (*),
                    personal_records (*),
                    subscriptions (*)
                `)
                .eq('ci', ci)
                .single();

            if (error || !data) return false;

            // Mapeando a la interfaz real
            const loggedInUser: User = {
                id: data.id,
                ci: data.ci,
                role: data.role,
                name: data.name,
                lastName: data.last_name,
                age: data.age,
                email: data.email,
                waiverSigned: data.waiver_signed,
                biometrics: data.biometrics || [],
                personalRecords: data.personal_records || [],
                subscription: data.subscriptions?.[0] ? {
                    planId: data.subscriptions[0].plan_id,
                    startDate: data.subscriptions[0].start_date,
                    endDate: data.subscriptions[0].end_date,
                    status: data.subscriptions[0].status,
                } : undefined
            };

            set({ currentUser: loggedInUser });
            return true;
        } catch (error) {
            console.error('Error in login:', error);
            return false;
        }
    },

    logout: () => set({ currentUser: null }),

    subscribePlan: async (planId) => {
        const state = get();
        if (!state.currentUser) return;

        try {
            const newSub = {
                user_id: state.currentUser.id,
                plan_id: planId,
                start_date: new Date().toISOString(),
                end_date: addDays(new Date(), 30).toISOString(),
                status: 'active'
            };

            await supabase.from('subscriptions').insert([newSub]);

            // Update local state optimistic
            set({
                currentUser: {
                    ...state.currentUser,
                    subscription: {
                        planId: newSub.plan_id,
                        startDate: newSub.start_date,
                        endDate: newSub.end_date,
                        status: newSub.status as 'active',
                    }
                }
            });
        } catch (error) {
            console.error('Error subscribing:', error);
        }
    },

    assignRoutine: async (routineData) => {
        try {
            const { data, error } = await supabase.from('routines').insert([routineData]).select().single();
            if (data && !error) {
                set((state) => ({ routines: [...state.routines, data] }));
            }
        } catch (error) {
            console.error('Error assigning routine', error);
        }
    },

    registerStudent: async (student) => {
        try {
            const { data, error } = await supabase.from('users').insert([{
                ci: student.ci,
                role: 'student',
                name: student.name,
                last_name: student.lastName,
                age: student.age,
                email: student.email,
                waiver_signed: true
            }]).select().single();

            if (data && !error) {
                const newUser: User = {
                    id: data.id,
                    ci: data.ci,
                    role: data.role,
                    name: data.name,
                    lastName: data.last_name,
                    age: data.age,
                    email: data.email,
                    waiverSigned: data.waiver_signed,
                    biometrics: [],
                    personalRecords: []
                };
                set((state) => ({ users: [...state.users, newUser], currentUser: newUser }));
            }
        } catch (err) {
            console.error('Error registering student', err);
        }
    },

    registerTrainer: async (trainerData) => {
        try {
            const { data, error } = await supabase.from('users').insert([{
                ci: trainerData.ci,
                role: 'trainer',
                name: trainerData.name,
                last_name: trainerData.lastName,
                age: trainerData.age,
                email: trainerData.email,
                waiver_signed: true
            }]).select().single();

            if (data && !error) {
                const newUser: User = {
                    id: data.id,
                    ci: data.ci,
                    role: data.role,
                    name: data.name,
                    lastName: data.last_name,
                    age: data.age,
                    email: data.email,
                    waiverSigned: data.waiver_signed,
                    biometrics: [],
                    personalRecords: []
                };
                set((state) => ({ users: [...state.users, newUser] }));
            }
        } catch (err) {
            console.error('Error registering trainer', err);
        }
    },

    updateClassCapacity: async (classId, capacity) => {
        // Implementar actualización real después
        set((state) => ({ classes: state.classes.map(c => c.id === classId ? { ...c, capacity } : c) }));
    },
    enrollClass: async (_classId) => {
    },
    cancelClass: async (_classId) => {
    },
    addPersonalRecord: async (_studentId, _record) => {
    },
    markAttendance: async (_classId, _studentId) => {
    }
}));
