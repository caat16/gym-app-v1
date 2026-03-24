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

        // 1. Find subscriptions expiring in exactly 5 days that haven't received a reminder
        const in5Days = new Date();
        in5Days.setDate(in5Days.getDate() + 5);
        const targetDateStr = in5Days.toISOString().split('T')[0];

        const { data: subscriptions, error } = await supabase
            .from('subscriptions')
            .select(`
                id,
                end_date,
                users ( id, email, name )
            `)
            .eq('payment_reminder_sent', false)
            .lte('end_date', targetDateStr + 'T23:59:59Z')
            .gte('end_date', targetDateStr + 'T00:00:00Z');

        if (error) throw error;

        let emailsSent = 0;

        for (const sub of (subscriptions || [])) {
            const user = sub.users;
            if (!user?.email) continue;

            // Here you would integrate with Resend, SendGrid, or AWS SES
            // Example pseudo-code for sending email:
            console.log(`Sending payment reminder to ${user.email} (Expiring: ${sub.end_date})`);
            /*
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'Gymflow Pro <noreply@gymflowpro.com>',
                    to: user.email,
                    subject: 'Tu plan está por vencer - Gymflow Pro',
                    html: `<p>Hola ${user.name}, le recordamos que su plan vence en 5 días.</p>`
                })
            });
            */

            // Mark as sent
            await supabase
                .from('subscriptions')
                .update({ payment_reminder_sent: true })
                .eq('id', sub.id);

            emailsSent++;
        }

        return new Response(
            JSON.stringify({ success: true, processed: subscriptions?.length, emailsSent }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
