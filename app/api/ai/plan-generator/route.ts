import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
        const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

        if (!supabaseUrl || !supabaseServiceKey || !CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
            return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
        }

        // Get auth header
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
        }

        // Create Supabase client with service role key
        const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

        // Authenticate user using the provided token
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { goal } = body;

        if (!goal) {
            return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
        }

        // Generate comprehensive prompt for AI
        const prompt = `You are an AI planning assistant.
User's Goal: "${goal}"

Generate a detailed project plan in JSON.
IMPORTANT: Return only raw JSON. No markdown. No comments.

Plan Types:
1. "project": coordinated effort (e.g., "Build a website").
2. "tasks": independent tasks (e.g., "Grocery list").
3. "future": aspirational (e.g., "Visit Antarctica").

Output Format:
{
  "type": "project" | "tasks" | "future",
  "project": {
    "name": "Project Name",
    "type": "Project" | "Book" | "Course" | "Writing" | "Open Source" | "Habit" | "Misc",
    "deadline_date": "YYYY-MM-DD",
    "notes": "Context"
  },
  "tasks": [
    {
      "content": "Task description",
      "priority": "High" | "Medium" | "Low",
      "due_date": "YYYY-MM-DD",
      "notes": "Tips"
    }
  ],
  "horizon_item": {
    "title": "Goal title",
    "description": "Description",
    "timeframe": "Short-term" | "Medium-term" | "Long-term" | "Someday"
  }
}

Rules:
- "project": include project + 3-7 tasks.
- "tasks": tasks array only (2-5 tasks).
- "future": horizon_item only.
- Use realistic deadlines.
- JSON only.`;

        // Call Cloudflare AI
        const aiResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    max_tokens: 2048,
                }),
            }
        );

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error('Cloudflare AI error:', errorText);
            return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
        }

        const aiData = await aiResponse.json();
        const aiText = aiData.result?.response || '';

        // Extract JSON from AI response
        // clean up the response
        let cleanText = aiText.trim();

        // Remove markdown code blocks if present
        if (cleanText.includes('```')) {
            cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');
        }

        // Find the first '{' and last '}'
        const firstOpen = cleanText.indexOf('{');
        const lastClose = cleanText.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose !== -1) {
            cleanText = cleanText.substring(firstOpen, lastClose + 1);
        }

        let plan;
        try {
            plan = JSON.parse(cleanText);
        } catch (e) {
            // Attempt to fix common JSON errors (very basic)
            console.warn('Initial JSON parse failed, attempting cleanup:', e);
            try {
                // Fix trailing commas
                const fixedText = cleanText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
                plan = JSON.parse(fixedText);
            } catch (retryError) {
                console.error('Failed to parse AI response:', cleanText);
                return NextResponse.json({ error: 'Failed to generate a valid plan. Please try again.' }, { status: 500 });
            }
        }

        // Insert data based on plan type
        if (plan.type === 'future') {
            // Create horizon item
            const { data: horizonItem, error: horizonError } = await supabase
                .from('horizon_items')
                .insert({
                    title: plan.horizon_item.title,
                    description: plan.horizon_item.description,
                    timeframe: plan.horizon_item.timeframe,
                    user_id: user.id,
                })
                .select()
                .single();

            if (horizonError) {
                console.error('Error creating horizon item:', horizonError);
                return NextResponse.json({ error: horizonError.message }, { status: 500 });
            }

            return NextResponse.json({
                message: 'Future goal created successfully!',
                data: { horizon_item: horizonItem },
            });
        }

        if (plan.type === 'project') {
            // Validate type
            let projectType = plan.project.type;

            // Normalize: capitalize first letter
            if (projectType && typeof projectType === 'string') {
                projectType = projectType.charAt(0).toUpperCase() + projectType.slice(1);
                // Special case for 'Open Source'
                if (projectType.toLowerCase() === 'open source') projectType = 'Open Source';
            } else {
                projectType = 'Project'; // Fallback if missing/invalid
            }

            // Create project
            const { data: newProject, error: projectError } = await supabase
                .from('loom_items')
                .insert({
                    name: plan.project.name,
                    type: projectType,
                    deadline_date: plan.project.deadline_date,
                    notes: plan.project.notes,
                    user_id: user.id,
                    start_date: new Date().toISOString().split('T')[0],
                    status: 'Active',
                })
                .select()
                .single();

            if (projectError) {
                console.error('Error creating project:', projectError);
                return NextResponse.json({ error: projectError.message }, { status: 500 });
            }

            // Create tasks linked to project
            const tasksToInsert = plan.tasks.map((task: any) => ({
                content: task.content,
                priority: task.priority,
                due_date: task.due_date,
                notes: task.notes,
                loom_item_id: newProject.id,
                user_id: user.id,
                type: 'Task',
            }));

            const { data: newTasks, error: tasksError } = await supabase
                .from('ledger_items')
                .insert(tasksToInsert)
                .select();

            if (tasksError) {
                console.error('Error creating tasks:', tasksError);
                return NextResponse.json({ error: tasksError.message }, { status: 500 });
            }

            return NextResponse.json({
                message: 'Project and tasks created successfully!',
                data: { project: newProject, tasks: newTasks },
            });
        }

        // Type: "tasks" - standalone tasks
        const tasksToInsert = plan.tasks.map((task: any) => ({
            content: task.content,
            priority: task.priority,
            due_date: task.due_date,
            notes: task.notes,
            user_id: user.id,
            type: 'Task',
        }));

        const { data: newTasks, error: tasksError } = await supabase
            .from('ledger_items')
            .insert(tasksToInsert)
            .select();

        if (tasksError) {
            return NextResponse.json({ error: tasksError.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Tasks created successfully!',
            data: { tasks: newTasks },
        });

    } catch (error: any) {
        console.error('Plan generator error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
