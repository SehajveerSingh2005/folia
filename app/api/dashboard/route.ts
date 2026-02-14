import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { session }, error: authError } = await supabase.auth.getSession();

        console.log('Dashboard API - Auth check:', {
            hasSession: !!session,
            userId: session?.user?.id,
            authError: authError?.message
        });

        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized', details: authError?.message || 'No session' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('user_dashboard_layouts')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: data || null });
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
        const { layouts } = body;

        const { data, error } = await supabase
            .from('user_dashboard_layouts')
            .upsert(
                { user_id: user.id, layouts },
                { onConflict: 'user_id' }
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
