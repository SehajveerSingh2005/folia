import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
        }

        // Get journal entry
        const { data: entry, error: entryError } = await supabase
            .from('chronicle_entries')
            .select('*')
            .eq('entry_date', date)
            .single();

        // Get completed tasks for the day
        const { data: completedTasks, error: tasksError } = await supabase
            .from('ledger_items')
            .select('id, content, notes, loom_items(name)')
            .eq('is_done', true)
            .gte('completed_at', `${date}T00:00:00.000Z`)
            .lte('completed_at', `${date}T23:59:59.999Z`);

        return NextResponse.json({
            entry: entry || null,
            completedTasks: completedTasks || [],
            entryError: entryError?.code === 'PGRST116' ? null : entryError,
            tasksError
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { entry_date, content, mood } = body;

        const { data, error } = await supabase
            .from('chronicle_entries')
            .upsert(
                {
                    user_id: user.id,
                    entry_date,
                    content,
                    mood
                },
                { onConflict: 'user_id, entry_date' }
            )
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
