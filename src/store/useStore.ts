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
    date?: string; // YYYY-MM-DD for specific daily slots
    startTime: string; // HH:mm format
    endTime: string;
    capacity: number;
    enrolledStudents?: { id: string; isConfirmed: boolean }[];
}

export interface User {
    id: string;
    ci: string;
    role: UserRole;
    name: string;
    lastName: string;
    age: number;
    email: string;
    phone?: string;
    avatar?: string;
    biometrics: BiometricRecord[];
    personalRecords: PersonalRecord[];
    subscription?: Subscription;
    scheduleBlocks?: string[];
    waiverSigned: boolean;
}

export interface ClassEnrollment {
    studentId: string;
    attended: boolean;
    status: 'enrolled' | 'confirmed' | 'cancelled' | 'rescheduled';
    reminderSent: boolean;
    isConfirmed?: boolean;
    confirmedAt?: string;
}

export interface MembershipFreeze {
    id: string;
    userId: string;
    requestedAt: string;
    freezeStart: string;
    freezeEnd: string;
    autoEndAt: string;
    status: 'pending' | 'active' | 'unfrozen' | 'auto_expired';
    justificationText?: string;
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

export interface InternalMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'system' | 'user';
    isRead: boolean;
    createdAt: string;
}

export interface AppNotification {
    id: string;
    type: 'inscripcion' | 'pago' | 'cambio_plan' | 'confirmacion' | 'general';
    title: string;
    message: string;
    userId?: string;
    isRead: boolean;
    createdAt: string;
}

export interface Routine {
    id: string;
    name: string;
    assignedTo?: string | null;
    planId?: string | null;
    assignedAt?: string | null; // ISO timestamp for 24h visibility
    exercises: { name: string; sets: number; reps: number | string; weight?: number | string }[];
}

export interface TrainerDiscipline {
    id: string;
    trainerId: string;
    planId: string;
    assignedAt: string;
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
    enrollScheduleBlock: (blockId: string) => Promise<void>;
    cancelScheduleBlock: (blockId: string) => Promise<void>;
    confirmScheduleBlock: (blockId: string) => Promise<void>;

    // Profile
    updateUserProfile: (userId: string, data: { name?: string; email?: string; phone?: string }) => Promise<boolean>;

    // Membership Freezes
    requestFreeze: (data: { freezeStart: string; freezeEnd: string; justificationText: string }) => Promise<boolean>;
    getUserFreezes: (userId: string) => Promise<MembershipFreeze[]>;
    approveFreeze: (freezeId: string) => Promise<boolean>;
    rejectFreeze: (freezeId: string) => Promise<boolean>;
    membershipFreezes: MembershipFreeze[];

    // Attendance Confirmation
    confirmAttendance: (classId: string) => Promise<boolean>;

    // Internal Chat / Notifications
    sendInternalMessage: (message: { receiverId: string; content: string; type?: 'system' | 'user' }) => Promise<void>;
    messages: InternalMessage[];
    trainerDisciplines: TrainerDiscipline[];
    assignTrainerDiscipline: (trainerId: string, planId: string) => Promise<boolean>;
    removeTrainerDiscipline: (disciplineId: string) => Promise<boolean>;
    getTrainerDisciplines: (trainerId: string) => Promise<TrainerDiscipline[]>;

    // Operaciones CRUD Admin
    deleteUser: (userId: string) => Promise<void>;
    deleteClass: (classId: string) => Promise<void>;
    deleteRoutine: (routineId: string) => Promise<void>;

    // Notifications
    notifications: AppNotification[];
    createNotification: (type: AppNotification['type'], title: string, message: string) => Promise<void>;
    fetchNotifications: () => Promise<void>;
    markNotificationRead: (notificationId: string) => Promise<void>;
}

export const useGymStore = create<GymStore>((set, get) => ({
    currentUser: null,
    users: [],
    plans: [],
    classes: [],
    routines: [],
    scheduleBlocks: [],
    membershipFreezes: [],
    messages: [],
    trainerDisciplines: [],
    notifications: [],
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

            // Descargar Schedule Blocks con inscripciones y confirmaciones
            const { data: dbBlocks } = await supabase.from('schedule_blocks').select('*, student_schedule_blocks(user_id, is_confirmed, confirmed_at)');

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
                    date: b.date || undefined,
                    startTime: b.start_time,
                    endTime: b.end_time,
                    capacity: b.capacity,
                    enrolledStudents: b.student_schedule_blocks ? b.student_schedule_blocks.map((eb: any) => ({
                        id: eb.user_id,
                        isConfirmed: eb.is_confirmed || false,
                        confirmedAt: eb.confirmed_at || undefined
                    })) : []
                })) : [],
                routines: dbRoutines ? dbRoutines.map(r => ({
                    id: r.id,
                    name: r.name,
                    assignedTo: r.assigned_to,
                    planId: r.plan_id,
                    assignedAt: r.assigned_at || null,
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
                    phone: u.phone || undefined,
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
                phone: data.phone || undefined,
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
            // Check for an existing active/expiring subscription to extend
            const { data: existingSubs } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', state.currentUser.id)
                .in('status', ['active', 'expiring_soon'])
                .order('end_date', { ascending: false })
                .limit(1);

            const currentSub = existingSubs && existingSubs.length > 0 ? existingSubs[0] : null;

            let startDate = new Date();
            let endDate = addDays(startDate, 30);
            let targetSubId = null;

            if (currentSub) {
                targetSubId = currentSub.id;
                const currentEndDate = new Date(currentSub.end_date);
                if (currentEndDate > new Date()) {
                    startDate = new Date(currentSub.start_date);
                    // Add 30 days to the FUTURE end date
                    endDate = addDays(currentEndDate, 30);
                } else {
                    startDate = new Date();
                    endDate = addDays(startDate, 30);
                }
            }

            const subData = {
                user_id: state.currentUser.id,
                plan_id: planId,
                sessions: sessions || null,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active'
            };

            if (targetSubId) {
                await supabase.from('subscriptions').update(subData).eq('id', targetSubId);
            } else {
                await supabase.from('subscriptions').insert([subData]);
            }

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
                        planId: subData.plan_id,
                        startDate: subData.start_date,
                        endDate: subData.end_date,
                        status: subData.status as 'active',
                        sessions: sessions || undefined
                    },
                    scheduleBlocks: selectedBlockIds && selectedBlockIds.length > 0
                        ? selectedBlockIds
                        : state.currentUser.scheduleBlocks
                }
            });

            // Notification: pago/inscripción
            const plan = state.plans.find(p => p.id === planId);
            const notifType = currentSub ? 'pago' : 'inscripcion';
            const notifTitle = currentSub ? 'Renovación de Plan' : 'Nueva Inscripción';
            await get().createNotification(
                notifType as any,
                notifTitle,
                `${state.currentUser.name} ${state.currentUser.lastName} se ha ${currentSub ? 'renovado en' : 'inscrito al'} plan ${plan?.name || 'Desconocido'}.`
            );
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
                        instructor: data.instructor_id,
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
                const classObj = state.classes.find(c => c.id === classId);
                set((state) => ({
                    classes: state.classes.map(c =>
                        c.id === classId
                            ? { ...c, enrolledStudents: [...c.enrolledStudents, state.currentUser!.id] }
                            : c
                    )
                }));
                // Notification
                await get().createNotification(
                    'inscripcion',
                    'Inscripción a Clase',
                    `${state.currentUser.name} ${state.currentUser.lastName} se inscribió a la clase ${classObj?.name || ''}.`
                );
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

    // --- Power Plate (Schedule Blocks) Enrollments ---
    enrollScheduleBlock: async (blockId: string) => {
        const state = get();
        if (!state.currentUser) return;
        try {
            const { error } = await supabase.from('student_schedule_blocks').insert([
                { block_id: blockId, user_id: state.currentUser.id, is_confirmed: false }
            ]);
            if (!error) {
                set((state) => ({
                    scheduleBlocks: state.scheduleBlocks.map(b =>
                        b.id === blockId
                            ? { ...b, enrolledStudents: [...(b.enrolledStudents || []), { id: state.currentUser!.id, isConfirmed: false }] }
                            : b
                    )
                }));
            }
        } catch (e) {
            console.error('Error booking schedule block', e);
        }
    },
    cancelScheduleBlock: async (blockId: string) => {
        const state = get();
        if (!state.currentUser) return;
        try {
            const { error } = await supabase.from('student_schedule_blocks')
                .delete()
                .match({ block_id: blockId, user_id: state.currentUser.id });
            if (!error) {
                set((state) => ({
                    scheduleBlocks: state.scheduleBlocks.map(b =>
                        b.id === blockId
                            ? { ...b, enrolledStudents: b.enrolledStudents?.filter(e => e.id !== state.currentUser!.id) || [] }
                            : b
                    )
                }));
            }
        } catch (e) {
            console.error('Error canceling schedule block', e);
        }
    },
    confirmScheduleBlock: async (blockId: string) => {
        const state = get();
        if (!state.currentUser) return;
        try {
            const { error } = await supabase.from('student_schedule_blocks')
                .update({ is_confirmed: true, confirmed_at: new Date().toISOString() })
                .match({ block_id: blockId, user_id: state.currentUser.id });
            if (!error) {
                // Find block to get time for message
                const block = state.scheduleBlocks.find(b => b.id === blockId);
                const blockTime = block ? `${block.date} a las ${block.startTime}` : 'sesión de hoy';

                // Send system message to Admin/PowerUser (for now we target the first admin found or a default)
                // In a real scenario, we'd target specific trainers or all admins
                await state.sendInternalMessage({
                    receiverId: '00000000-0000-0000-0000-000000000000', // Shorthand for all admins or handled by DB trigger
                    content: `📢 Confirmación: El alumno ${state.currentUser.name} ha confirmado su asistencia para la sesión de Power Plate: ${blockTime}.`,
                    type: 'system'
                });

                // Notification
                await get().createNotification(
                    'confirmacion',
                    'Confirmación de Asistencia',
                    `${state.currentUser.name} confirmó asistencia a la sesión de Power Plate: ${blockTime}.`
                );

                set((state) => ({
                    scheduleBlocks: state.scheduleBlocks.map(b =>
                        b.id === blockId
                            ? {
                                ...b, enrolledStudents: b.enrolledStudents?.map(e =>
                                    e.id === state.currentUser!.id ? { ...e, isConfirmed: true, confirmedAt: new Date().toISOString() } : e
                                ) || []
                            }
                            : b
                    )
                }));
            }
        } catch (e) {
            console.error('Error confirming schedule block', e);
        }
    },

    sendInternalMessage: async ({ receiverId, content, type = 'system' }) => {
        const state = get();
        if (!state.currentUser) return;
        try {
            const { error } = await supabase.from('internal_messages').insert([{
                sender_id: state.currentUser.id,
                receiver_id: receiverId,
                content,
                type
            }]);
            if (error) console.error('Error sending internal message', error);
        } catch (e) {
            console.error('Exception sending internal message', e);
        }
    },
    // --- END Power Plate Enrollments ---
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
                date: block.date || null,
                start_time: block.startTime,
                end_time: block.endTime,
                capacity: block.capacity
            }));
            console.log(`[createScheduleBlocks] Inserting ${dbBlocks.length} blocks. Sample:`, dbBlocks[0]);
            const { data, error } = await supabase.from('schedule_blocks').insert(dbBlocks).select();
            if (error) {
                console.error("Supabase Error creating blocks:", JSON.stringify(error, null, 2));
                alert(`Error al crear múltiples bloques: ${error.message}`);
                return false;
            }
            if (data && data.length > 0) {
                const newLocalBlocks = data.map(d => ({
                    id: d.id,
                    dayOfWeek: d.day_of_week,
                    date: d.date || undefined,
                    startTime: d.start_time,
                    endTime: d.end_time,
                    capacity: d.capacity,
                    enrolledStudents: []
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
    },

    updateUserProfile: async (userId, data) => {
        try {
            const dbData: any = {};
            if (data.name !== undefined) dbData.name = data.name;
            if (data.email !== undefined) dbData.email = data.email;
            if (data.phone !== undefined) dbData.phone = data.phone;
            const { error } = await supabase.from('users').update(dbData).eq('id', userId);
            if (error) { console.error('Error updating profile:', error); return false; }
            set((state) => ({
                users: state.users.map(u => u.id === userId ? { ...u, ...data } : u),
                currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...data } : state.currentUser
            }));
            return true;
        } catch (e: any) { console.error('Exception updating profile', e); return false; }
    },

    requestFreeze: async ({ freezeStart, freezeEnd, justificationText }) => {
        const state = get();
        if (!state.currentUser) return false;
        try {
            const autoEndAt = new Date(freezeStart);
            autoEndAt.setMonth(autoEndAt.getMonth() + 1);
            const payload = {
                user_id: state.currentUser.id,
                freeze_start: freezeStart,
                freeze_end: freezeEnd,
                auto_end_at: autoEndAt.toISOString().split('T')[0],
                justification_text: justificationText,
                status: 'pending'
            };
            const { data, error } = await supabase.from('membership_freezes').insert([payload]).select().single();
            if (error) { console.error('Error requesting freeze:', error); return false; }
            if (data) {
                const newFreeze: MembershipFreeze = {
                    id: data.id, userId: data.user_id,
                    requestedAt: data.requested_at, freezeStart: data.freeze_start,
                    freezeEnd: data.freeze_end, autoEndAt: data.auto_end_at,
                    status: data.status, justificationText: data.justification_text
                };
                set((state) => ({ membershipFreezes: [...state.membershipFreezes, newFreeze] }));
            }
            return true;
        } catch (e: any) { console.error('Exception requesting freeze', e); return false; }
    },

    getUserFreezes: async (userId) => {
        try {
            const { data, error } = await supabase.from('membership_freezes').select('*').eq('user_id', userId);
            if (error || !data) return [];
            const freezes: MembershipFreeze[] = data.map(d => ({
                id: d.id, userId: d.user_id, requestedAt: d.requested_at,
                freezeStart: d.freeze_start, freezeEnd: d.freeze_end,
                autoEndAt: d.auto_end_at, status: d.status,
                justificationText: d.justification_text
            }));
            set({ membershipFreezes: freezes });
            return freezes;
        } catch (e: any) { console.error('Exception getting freezes', e); return []; }
    },

    approveFreeze: async (freezeId) => {
        try {
            const { error } = await supabase.from('membership_freezes').update({ status: 'active' }).eq('id', freezeId);
            if (error) { console.error('Error approving freeze:', error); return false; }
            set((state) => ({
                membershipFreezes: state.membershipFreezes.map(f => f.id === freezeId ? { ...f, status: 'active' } : f)
            }));
            return true;
        } catch (e: any) { console.error('Exception approving freeze', e); return false; }
    },

    rejectFreeze: async (freezeId) => {
        try {
            const { error } = await supabase.from('membership_freezes').update({ status: 'unfrozen' }).eq('id', freezeId);
            if (error) { console.error('Error rejecting freeze:', error); return false; }
            set((state) => ({
                membershipFreezes: state.membershipFreezes.map(f => f.id === freezeId ? { ...f, status: 'unfrozen' } : f)
            }));
            return true;
        } catch (e: any) { console.error('Exception rejecting freeze', e); return false; }
    },

    confirmAttendance: async (classId) => {
        const state = get();
        if (!state.currentUser) return false;
        try {
            const { error } = await supabase.from('class_enrollments')
                .update({ is_confirmed: true, confirmed_at: new Date().toISOString() })
                .eq('class_id', classId)
                .eq('student_id', state.currentUser.id);
            if (error) { console.error('Error confirming attendance:', error); return false; }
            set((state) => ({
                classes: state.classes.map(c => {
                    if (c.id !== classId) return c;
                    return {
                        ...c,
                        enrollments: c.enrollments?.map(e =>
                            e.studentId === state.currentUser!.id
                                ? { ...e, isConfirmed: true, confirmedAt: new Date().toISOString() }
                                : e
                        ) || []
                    };
                })
            }));
            return true;
        } catch (e: any) { console.error('Exception confirming attendance', e); return false; }
    },

    assignTrainerDiscipline: async (trainerId, planId) => {
        try {
            const { data, error } = await supabase
                .from('trainer_discipline_assignments')
                .insert([{ trainer_id: trainerId, plan_id: planId }])
                .select().single();
            if (error) { console.error('Error assigning discipline:', error); return false; }
            if (data) {
                const newDiscipline: TrainerDiscipline = {
                    id: data.id, trainerId: data.trainer_id,
                    planId: data.plan_id, assignedAt: data.assigned_at
                };
                set(state => ({ trainerDisciplines: [...state.trainerDisciplines, newDiscipline] }));
            }
            return true;
        } catch (e: any) { console.error('Exception assigning discipline', e); return false; }
    },

    removeTrainerDiscipline: async (disciplineId) => {
        try {
            const { error } = await supabase
                .from('trainer_discipline_assignments').delete().eq('id', disciplineId);
            if (error) { console.error('Error removing discipline:', error); return false; }
            set(state => ({ trainerDisciplines: state.trainerDisciplines.filter(d => d.id !== disciplineId) }));
            return true;
        } catch (e: any) { console.error('Exception removing discipline', e); return false; }
    },

    getTrainerDisciplines: async (trainerId) => {
        try {
            const { data, error } = await supabase
                .from('trainer_discipline_assignments').select('*').eq('trainer_id', trainerId);
            if (error || !data) return [];
            const disciplines: TrainerDiscipline[] = data.map(d => ({
                id: d.id, trainerId: d.trainer_id,
                planId: d.plan_id, assignedAt: d.assigned_at
            }));
            set({ trainerDisciplines: disciplines });
            return disciplines;
        } catch (e: any) { console.error('Exception getting disciplines', e); return []; }
    },

    // --- Notifications ---
    createNotification: async (type, title, message) => {
        const state = get();
        try {
            const { data, error } = await supabase.from('notifications').insert([{
                type,
                title,
                message,
                user_id: state.currentUser?.id || null
            }]).select().single();
            if (error) {
                console.error('Error creating notification:', error);
                return;
            }
            if (data) {
                const newNotif: AppNotification = {
                    id: data.id,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    userId: data.user_id,
                    isRead: data.is_read,
                    createdAt: data.created_at
                };
                set(state => ({ notifications: [newNotif, ...state.notifications] }));
            }
        } catch (e) {
            console.error('Exception creating notification', e);
        }
    },

    fetchNotifications: async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(30);
            if (error || !data) return;
            const notifs: AppNotification[] = data.map(n => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                userId: n.user_id,
                isRead: n.is_read,
                createdAt: n.created_at
            }));
            set({ notifications: notifs });
        } catch (e) {
            console.error('Exception fetching notifications', e);
        }
    },

    markNotificationRead: async (notificationId) => {
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
            set(state => ({
                notifications: state.notifications.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            }));
        } catch (e) {
            console.error('Exception marking notification read', e);
        }
    }
}));
