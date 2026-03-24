import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Find classes in the next 24 hours
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // We fetch class enrollments where class start_time is between Now and +24h, 
        // and reminder_sent = false
        const { data: enrollments, error } = await supabase
            .from('class_enrollments')
            .select(`
                id,
                student_id,
                status,
                classes!inner ( id, name, start_time ),
                users ( email, name )
            `)
            .eq('reminder_sent', false)
            .gte('classes.start_time', now.toISOString())
            .lte('classes.start_time', in24h.toISOString());

        if (error) throw error;

        let emailsSent = 0;

        for (const enr of (enrollments || [])) {
            const user = enr.users;
            const cls = enr.classes;
            if (!user?.email || !cls) continue;

            const timeString = new Date(cls.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            // Example pseudo-code for sending email:
            console.log(`Sending class reminder to ${user.email} for class ${cls.name} at ${timeString}`);
            /*
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'Gymflow Pro <noreply@gymflowpro.com>',
                    to: user.email,
                    subject: `Confirmación requerida para tu clase de ${cls.name}`,
                    html: `<p>Hola ${user.name}, tienes una clase de ${cls.name} a las ${timeString}. Por favor, entra a la app para confirmar tu asistencia o reprogramar.</p>`
                })
            });
            */

            // Mark as sent
            await supabase
                .from('class_enrollments')
                .update({ reminder_sent: true })
                .eq('id', enr.id);

            emailsSent++;
        }

        return new Response(
            JSON.stringify({ success: true, processed: enrollments?.length, emailsSent }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
