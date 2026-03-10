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
    createClass: (classData: Omit<ClassSession, 'id' | 'enrolledStudents' | 'attendedStudents'>) => Promise<void>;
    updateClassCapacity: (classId: string, capacity: number) => Promise<void>;
    enrollClass: (classId: string) => Promise<void>;
    cancelClass: (classId: string) => Promise<void>;
    addPersonalRecord: (studentId: string, record: Omit<PersonalRecord, 'id'>) => Promise<void>;
    addBiometrics: (studentId: string, data: Omit<BiometricRecord, 'id'>) => Promise<void>;
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

            // Descargar Clases
            const { data: dbClasses } = await supabase.from('classes').select(`
                *,
                class_enrollments (
                    user_id,
                    attended
                )
            `);

            // Descargar Usuarios Básicos
            const { data: dbUsers } = await supabase.from('users').select('*');

            set({
                plans: dbPlans || [],
                routines: dbRoutines ? dbRoutines.map(r => ({
                    id: r.id,
                    name: r.name,
                    assignedTo: r.assigned_to,
                    exercises: r.exercises
                })) : [],
                classes: dbClasses ? dbClasses.map(c => ({
                    id: c.id,
                    name: c.name,
                    instructor: c.instructor,
                    startTime: c.start_time,
                    endTime: c.end_time,
                    capacity: c.capacity,
                    enrolledStudents: c.class_enrollments?.map((e: any) => e.user_id) || [],
                    attendedStudents: c.class_enrollments?.filter((e: any) => e.attended).map((e: any) => e.user_id) || [],
                })) : [],
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
            const dbRoutine = {
                name: routineData.name,
                assigned_to: routineData.assignedTo,
                exercises: routineData.exercises
            };
            const { data, error } = await supabase.from('routines').insert([dbRoutine]).select().single();
            if (data && !error) {
                const mappedRoutine: Routine = {
                    id: data.id,
                    name: data.name,
                    assignedTo: data.assigned_to,
                    exercises: data.exercises
                };
                set((state) => ({ routines: [...state.routines, mappedRoutine] }));
            } else {
                console.error('Database error assigning routine:', error);
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

    createClass: async (classData) => {
        try {
            const newClass = {
                name: classData.name,
                instructor: classData.instructor,
                start_time: classData.startTime,
                end_time: classData.endTime,
                capacity: classData.capacity
            };

            const { data, error } = await supabase.from('classes').insert([newClass]).select().single();
            if (data && !error) {
                set((state) => ({
                    classes: [...state.classes, {
                        id: data.id,
                        name: data.name,
                        instructor: data.instructor,
                        startTime: data.start_time,
                        endTime: data.end_time,
                        capacity: data.capacity,
                        enrolledStudents: [],
                        attendedStudents: []
                    }]
                }));
            }
        } catch (error) {
            console.error('Error creating class', error);
        }
    },

    enrollClass: async (classId) => {
        const state = get();
        if (!state.currentUser) return;

        try {
            const { error } = await supabase.from('class_enrollments').insert([
                { class_id: classId, user_id: state.currentUser.id }
            ]);

            if (!error) {
                set((state) => ({
                    classes: state.classes.map(c =>
                        c.id === classId
                            ? { ...c, enrolledStudents: [...c.enrolledStudents, state.currentUser!.id] }
                            : c
                    )
                }));
            }
        } catch (error) {
            console.error('Error enrolling class', error);
        }
    },
    cancelClass: async (classId) => {
        const state = get();
        if (!state.currentUser) return;

        try {
            const { error } = await supabase
                .from('class_enrollments')
                .delete()
                .match({ class_id: classId, user_id: state.currentUser.id });

            if (!error) {
                set((state) => ({
                    classes: state.classes.map(c =>
                        c.id === classId
                            ? { ...c, enrolledStudents: c.enrolledStudents.filter(id => id !== state.currentUser!.id) }
                            : c
                    )
                }));
            }
        } catch (error) {
            console.error('Error canceling class', error);
        }
    },
    addPersonalRecord: async (studentId, record) => {
        try {
            const newRecord = {
                user_id: studentId,
                date: record.date,
                exercise_name: record.exerciseName,
                value: record.value,
                unit: record.unit
            };
            const { data, error } = await supabase.from('personal_records').insert([newRecord]).select().single();

            if (data && !error) {
                set((state) => {
                    if (state.currentUser?.id === studentId) {
                        return {
                            currentUser: {
                                ...state.currentUser,
                                personalRecords: [...state.currentUser.personalRecords, {
                                    id: data.id,
                                    date: data.date,
                                    exerciseName: data.exercise_name,
                                    value: data.value,
                                    unit: data.unit
                                }]
                            }
                        };
                    }
                    return state;
                });
            }
        } catch (e) {
            console.error(e);
        }
    },

    addBiometrics: async (studentId, data: Omit<BiometricRecord, 'id'>) => {
        try {
            const newBiometric = {
                user_id: studentId,
                date: data.date,
                weight: data.weight,
                height: data.height,
                bmi: data.bmi
            };
            const { data: dbData, error } = await supabase.from('biometrics').insert([newBiometric]).select().single();

            if (dbData && !error) {
                set((state) => {
                    if (state.currentUser?.id === studentId) {
                        return {
                            currentUser: {
                                ...state.currentUser,
                                biometrics: [{
                                    id: dbData.id,
                                    date: dbData.date,
                                    weight: dbData.weight,
                                    height: dbData.height,
                                    bmi: dbData.bmi
                                }, ...state.currentUser.biometrics]
                            }
                        };
                    }
                    return state;
                });
            }
        } catch (e) {
            console.error(e);
        }
    },

    markAttendance: async (_classId, _studentId) => {
    }
}));
