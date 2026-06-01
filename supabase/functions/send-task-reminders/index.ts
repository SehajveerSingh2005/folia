import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@3';

// Environment vars (set in Supabase Dashboard → Edge Functions → Secrets)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'notifications@folia.app';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

// This function is called by a Supabase cron schedule (or manually via HTTP POST)
Deno.serve(async (_req) => {
  try {
    const now = new Date();
    const currentHour = now.getUTCHours().toString().padStart(2, '0');
    const currentMinute = now.getUTCMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    // Get users who have notifications enabled and whose send time matches (within ±5 min)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, notification_time')
      .eq('email_notifications_enabled', true);

    if (profilesError) {
      console.error('Failed to fetch profiles:', profilesError.message);
      return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
    }

    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    let emailsSent = 0;

    for (const profile of profiles ?? []) {
      // Check if this profile's notification_time matches current time (±5 minutes)
      const [profHour, profMin] = (profile.notification_time ?? '08:00').split(':').map(Number);
      const profMinutes = profHour * 60 + profMin;
      const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
      if (Math.abs(profMinutes - nowMinutes) > 5) continue;

      // Fetch user email
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      // Fetch today's tasks + overdue
      const { data: tasks } = await supabase
        .from('ledger_items')
        .select('content, due_date, priority, is_done')
        .eq('is_done', false)
        .lte('due_date', todayStr)
        .order('due_date', { ascending: true });

      if (!tasks || tasks.length === 0) continue;

      const overdue = tasks.filter(t => t.due_date && t.due_date < todayStr);
      const dueToday = tasks.filter(t => t.due_date === todayStr);

      // Build email HTML
      const buildList = (items: typeof tasks) =>
        items.map(t => `<li style="margin-bottom:6px;">${t.content}${t.priority ? ` <span style="color:#888;font-size:12px;">[${t.priority}]</span>` : ''}</li>`).join('');

      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h2 style="font-size:22px;font-weight:600;margin-bottom:4px;">Good morning, ${profile.first_name || 'there'} 👋</h2>
          <p style="color:#666;margin-top:0;margin-bottom:24px;">Here's your Folia task digest for ${new Date(todayStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
          ${overdue.length > 0 ? `
            <h3 style="color:#dc2626;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">Overdue (${overdue.length})</h3>
            <ul style="padding-left:20px;">${buildList(overdue)}</ul>
          ` : ''}
          ${dueToday.length > 0 ? `
            <h3 style="color:#2563eb;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">Due Today (${dueToday.length})</h3>
            <ul style="padding-left:20px;">${buildList(dueToday)}</ul>
          ` : '<p style="color:#666;">No tasks due today. 🎉</p>'}
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
          <p style="color:#aaa;font-size:12px;">You're receiving this because you have email reminders enabled in <a href="${supabaseUrl.replace('supabase.co', 'folia.app')}/settings">Folia Settings</a>.</p>
        </div>
      `;

      await resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: `Your Folia task digest — ${dueToday.length} due today${overdue.length > 0 ? `, ${overdue.length} overdue` : ''}`,
        html,
      });

      emailsSent++;
    }

    return new Response(JSON.stringify({ ok: true, emailsSent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
