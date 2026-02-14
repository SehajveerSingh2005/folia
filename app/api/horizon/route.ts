import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get horizon items
        const { data: horizonItems, error: horizonError } = await supabase
            .from('horizon_items')
            .select('*')
            .eq('user_id', user.id);

        // Get loom items for linking
        const { data: loomItems, error: loomError } = await supabase
            .from('loom_items')
            .select('id, name')
            .eq('user_id', user.id)
            .neq('status', 'Completed');

        // Get links between horizon and loom items
        const { data: links, error: linksError } = await supabase
            .from('horizon_flow_links')
            .select('horizon_item_id, loom_item_id')
            .eq('user_id', user.id);

        if (horizonError || loomError || linksError) {
            return NextResponse.json({
                error: horizonError?.message || loomError?.message || linksError?.message
            }, { status: 500 });
        }

        return NextResponse.json({
            items: horizonItems || [],
            projects: loomItems || [],
            links: links || []
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
        const { action, horizon_item_id, loom_item_id, ...itemData } = body;

        // Handle linking to project
        if (action === 'link') {
            const { data, error } = await supabase
                .from('horizon_flow_links')
                .insert({ user_id: user.id, horizon_item_id, loom_item_id })
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ data });
        }

        // Default: Create new horizon item
        const { data, error } = await supabase
            .from('horizon_items')
            .insert({ ...itemData, user_id: user.id })
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

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Horizon item ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('horizon_items')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
