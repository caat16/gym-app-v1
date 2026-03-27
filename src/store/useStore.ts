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
    sessions?: number;
    paymentReminderSent?: boolean;
}

export interface PersonalRecord {
    id: string;
    date: string;
    exerciseName: string;
    value: number;
    unit: string;
}

export interface ScheduleBlock {
    id: string;
    dayOfWeek: number; // 0=Sun, 1=Mon, etc.
    startTime: string; // HH:mm format
    endTime: string;
    capacity: number;
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
    scheduleBlocks?: string[]; // IDs of selected blocks
    waiverSigned: boolean;
}

export interface ClassEnrollment {
    studentId: string;
    attended: boolean;
    status: 'enrolled' | 'confirmed' | 'cancelled' | 'rescheduled';
    reminderSent: boolean;
}

export interface ClassSession {
    id: string;
    name: string;
    instructor: string;
    startTime: string; // ISO string
    endTime: string;
    capacity: number;
    enrolledStudents: string[]; // User IDs (legacy or shorthand)
    attendedStudents: string[]; // User IDs (legacy or shorthand)
    enrollments?: ClassEnrollment[]; // Detailed info for new flow
}

export interface Routine {
    id: string;
    name: string;
    assignedTo?: string | null; // User ID
    planId?: string | null;     // Assign to a Plan instead of a specific user
    exercises: { name: string; sets: number; reps: number | string; weight?: number | string }[];
}

import { supabase } from '../lib/supabase';

interface GymStore {
    currentUser: User | null;
    users: User[];
    plans: Plan[];
    classes: ClassSession[];
    routines: Routine[];
    scheduleBlocks: ScheduleBlock[];
    loading: boolean;

    // Métodos asíncronos para cargar desde DB
    fetchInitialData: () => Promise<void>;

    // Actions reescritas para backend
    loginWithCI: (ci: string) => Promise<boolean>;
    logout: () => void;
    subscribePlan: (planId: string, selectedBlockIds?: string[], sessions?: number) => Promise<void>;
    registerStudent: (student: Omit<User, 'id' | 'role' | 'biometrics' | 'personalRecords' | 'subscription' | 'waiverSigned'>) => Promise<void>;
    registerTrainer: (trainerData: Omit<User, 'id' | 'role' | 'biometrics' | 'personalRecords' | 'waiverSigned'>) => Promise<void>;
    assignRoutine: (routine: Omit<Routine, 'id'>) => Promise<void>;

    // Classes
    createClass: (classData: Omit<ClassSession, 'id' | 'enrolledStudents' | 'attendedStudents' | 'enrollments'>) => Promise<void>;
    updateClassCapacity: (classId: string, capacity: number) => Promise<void>;
    enrollClass: (classId: string) => Promise<void>;
    cancelClass: (classId: string) => Promise<void>;
    markAttendance: (classId: string, studentId: string) => Promise<void>;
    updateClassEnrollmentStatus: (classId: string, status: 'confirmed' | 'rescheduled') => Promise<void>;

    addPersonalRecord: (studentId: string, record: Omit<PersonalRecord, 'id'>) => Promise<void>;
    addBiometrics: (studentId: string, data: Omit<BiometricRecord, 'id'>) => Promise<void>;

    // Schedules
    createScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => Promise<boolean>;
    createScheduleBlocks: (blocks: Omit<ScheduleBlock, 'id'>[]) => Promise<boolean>;
    deleteScheduleBlock: (blockId: string) => Promise<void>;

    // Operaciones CRUD Admin
    deleteUser: (userId: string) => Promise<void>;
    deleteClass: (classId: string) => Promise<void>;
    deleteRoutine: (routineId: string) => Promise<void>;
}

export const useGymStore = create<GymStore>((set, get) => ({
    currentUser: null,
    users: [],
    plans: [],
    classes: [],
    routines: [],
    scheduleBlocks: [],
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
                    student_id,
                    attended,
                    status,
                    reminder_sent
                )
            `);

            // Descargar Usuarios Básicos con suscripciones
            const { data: dbUsers } = await supabase.from('users').select('*, subscriptions(*)');

            // Descargar Schedule Blocks
            const { data: dbBlocks } = await supabase.from('schedule_blocks').select('*');

            // Filtrar planes duplicados por nombre como medida defensiva
            const uniquePlans = dbPlans ? dbPlans.reduce((acc, current) => {
                const x = acc.find((item: any) => item.name === current.name);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []) : [];

            set({
                plans: uniquePlans,
                scheduleBlocks: dbBlocks ? dbBlocks.map(b => ({
                    id: b.id,
                    dayOfWeek: b.day_of_week,
                    startTime: b.start_time,
                    endTime: b.end_time,
                    capacity: b.capacity
                })) : [],
                routines: dbRoutines ? dbRoutines.map(r => ({
                    id: r.id,
                    name: r.name,
                    assignedTo: r.assigned_to,
                    planId: r.plan_id,
                    exercises: r.exercises
                })) : [],
                classes: dbClasses ? dbClasses.map(c => ({
                    id: c.id,
                    name: c.name,
                    instructor: c.instructor_id,
                    startTime: c.start_time,
                    endTime: c.end_time,
                    capacity: c.capacity,
                    enrolledStudents: c.class_enrollments?.map((e: any) => e.student_id) || [],
                    attendedStudents: c.class_enrollments?.filter((e: any) => e.attended).map((e: any) => e.student_id) || [],
                    enrollments: c.class_enrollments?.map((e: any) => ({
                        studentId: e.student_id,
                        attended: e.attended,
                        status: e.status || 'enrolled',
                        reminderSent: e.reminder_sent || false
                    })) || []
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
                    personalRecords: [],
                    subscription: u.subscriptions?.find((sub: any) => sub.status === 'active' || sub.status === 'expiring_soon') ? {
                        planId: u.subscriptions.find((sub: any) => sub.status === 'active' || sub.status === 'expiring_soon').plan_id,
                        startDate: u.subscriptions.find((sub: any) => sub.status === 'active' || sub.status === 'expiring_soon').start_date,
                        endDate: u.subscriptions.find((sub: any) => sub.status === 'active' || sub.status === 'expiring_soon').end_date,
                        status: u.subscriptions.find((sub: any) => sub.status === 'active' || sub.status === 'expiring_soon').status,
                    } : undefined
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
                    sessions: data.subscriptions[0].sessions,
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

    subscribePlan: async (planId, selectedBlockIds?: string[], sessions?: number) => {
        const state = get();
        if (!state.currentUser) return;

        try {
            const newSub = {
                user_id: state.currentUser.id,
                plan_id: planId,
                sessions: sessions || null,
                start_date: new Date().toISOString(),
                end_date: addDays(new Date(), 30).toISOString(),
                status: 'active'
            };

            await supabase.from('subscriptions').insert([newSub]);

            if (selectedBlockIds && selectedBlockIds.length > 0) {
                const blockInserts = selectedBlockIds.map(blockId => ({
                    user_id: state.currentUser!.id,
                    block_id: blockId
                }));
                const { error: blockError } = await supabase.from('student_schedule_blocks').insert(blockInserts);
                if (blockError) {
                    console.error('Error inserting student schedule blocks:', blockError);
                }
            }

            // Update local state optimistic
            set({
                currentUser: {
                    ...state.currentUser,
                    subscription: {
                        planId: newSub.plan_id,
                        startDate: newSub.start_date,
                        endDate: newSub.end_date,
                        status: newSub.status as 'active',
                        sessions: sessions || undefined
                    },
                    scheduleBlocks: selectedBlockIds && selectedBlockIds.length > 0
                        ? selectedBlockIds
                        : state.currentUser.scheduleBlocks
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
                plan_id: routineData.planId,
                exercises: routineData.exercises
            };
            const { data, error } = await supabase.from('routines').insert([dbRoutine]).select().single();
            if (data && !error) {
                const mappedRoutine: Routine = {
                    id: data.id,
                    name: data.name,
                    assignedTo: data.assigned_to,
                    planId: data.plan_id,
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
                instructor_id: classData.instructor,
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
                { class_id: classId, student_id: state.currentUser.id }
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
                .match({ class_id: classId, student_id: state.currentUser.id });

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
    },

    updateClassEnrollmentStatus: async (classId, status) => {
        const state = get();
        if (!state.currentUser) return;

        try {
            const { error } = await supabase
                .from('class_enrollments')
                .update({ status: status })
                .match({ class_id: classId, student_id: state.currentUser.id });

            if (!error) {
                // Update local state if needed
            }
        } catch (error) {
            console.error('Error updating status', error);
        }
    },

    createScheduleBlock: async (block) => {
        try {
            const dbBlock = {
                day_of_week: block.dayOfWeek,
                start_time: block.startTime,
                end_time: block.endTime,
                capacity: block.capacity
            };
            const { data, error } = await supabase.from('schedule_blocks').insert([dbBlock]).select().single();
            if (error) {
                console.error("Supabase Error creating block:", error);
                alert(`Error al crear bloque: ${error.message}`);
                return false;
            }
            if (data) {
                set((state) => ({
                    scheduleBlocks: [...state.scheduleBlocks, {
                        id: data.id,
                        dayOfWeek: data.day_of_week,
                        startTime: data.start_time,
                        endTime: data.end_time,
                        capacity: data.capacity
                    }]
                }));
                return true;
            }
            return false;
        } catch (e: any) {
            console.error('Exception creating block', e);
            alert(`Excepción: ${e.message}`);
            return false;
        }
    },

    createScheduleBlocks: async (blocks) => {
        try {
            const dbBlocks = blocks.map(block => ({
                day_of_week: block.dayOfWeek,
                start_time: block.startTime,
                end_time: block.endTime,
                capacity: block.capacity
            }));
            const { data, error } = await supabase.from('schedule_blocks').insert(dbBlocks).select();
            if (error) {
                console.error("Supabase Error creating blocks:", error);
                alert(`Error al crear múltiples bloques: ${error.message}`);
                return false;
            }
            if (data && data.length > 0) {
                const newLocalBlocks = data.map(d => ({
                    id: d.id,
                    dayOfWeek: d.day_of_week,
                    startTime: d.start_time,
                    endTime: d.end_time,
                    capacity: d.capacity
                }));
                set((state) => ({
                    scheduleBlocks: [...state.scheduleBlocks, ...newLocalBlocks]
                }));
                return true;
            }
            return false;
        } catch (e: any) {
            console.error('Exception creating blocks', e);
            alert(`Excepción múltiple: ${e.message}`);
            return false;
        }
    },

    deleteScheduleBlock: async (blockId) => {
        try {
            const { error } = await supabase.from('schedule_blocks').delete().eq('id', blockId);
            if (!error) {
                set((state) => ({
                    scheduleBlocks: state.scheduleBlocks.filter(b => b.id !== blockId)
                }));
            }
        } catch (error) {
            console.error('Error deleting block', error);
        }
    },

    deleteUser: async (userId) => {
        try {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (!error) {
                set((state) => ({ users: state.users.filter(u => u.id !== userId) }));
            }
        } catch (error) {
            console.error('Error deleting user', error);
        }
    },

    deleteClass: async (classId) => {
        try {
            const { error } = await supabase.from('classes').delete().eq('id', classId);
            if (!error) {
                set((state) => ({ classes: state.classes.filter(c => c.id !== classId) }));
            }
        } catch (error) {
            console.error('Error deleting class', error);
        }
    },

    deleteRoutine: async (routineId) => {
        try {
            const { error } = await supabase.from('routines').delete().eq('id', routineId);
            if (!error) {
                set((state) => ({ routines: state.routines.filter(r => r.id !== routineId) }));
            }
        } catch (error) {
            console.error('Error deleting routine', error);
        }
    }
}));
