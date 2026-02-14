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
        const prompt = `You are an AI planning assistant. Your task is to create a comprehensive, actionable plan based on the user's goal.

User's Goal: "${goal}"

Generate a detailed project plan in JSON format. Analyze the goal and determine the most appropriate plan type:

1. **Project with Tasks**: Use this when the goal requires a coordinated effort with multiple related tasks (e.g., "Plan a trip to Italy", "Build a portfolio website", "Learn to play guitar").

2. **Standalone Tasks**: Use this when the goal is simple and can be broken into independent, unrelated tasks (e.g., "Things to do this weekend", "Grocery shopping list").

3. **Future Goal**: Use this when the goal is aspirational or long-term with no immediate tasks (e.g., "Someday visit Antarctica", "Learn Japanese when I retire"). For this type, create a horizon_item only.

**Output Format:**

{
  "type": "project" | "tasks" | "future",
  "project": {
    "name": "Clear, descriptive project name",
    "type": "Project" | "Learning" | "Creative" | "Career" | "Personal",
    "deadline_date": "YYYY-MM-DD" or null,
    "notes": "Brief description or context"
  },
  "tasks": [
    {
      "content": "Specific, actionable task description",
      "priority": "High" | "Medium" | "Low",
      "due_date": "YYYY-MM-DD" or null,
      "notes": "Additional context or tips"
    }
  ],
  "horizon_item": {
    "title": "Goal title",
    "description": "Detailed description",
    "timeframe": "Short-term" | "Medium-term" | "Long-term" | "Someday"
  }
}

**Rules:**
1. For "project" type: Include project object and tasks array (3-7 tasks).
2. For "tasks" type: Include only tasks array (2-5 tasks), set project to null.
3. For "future" type: Include only horizon_item, set project and tasks to null.
4. Use realistic deadlines based on the goal's complexity.
5. Prioritize tasks logically (first tasks should be "High" priority).
6. Make task descriptions clear and actionable.
7. Keep notes concise and helpful.

Generate the plan now:`;

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
                    max_tokens: 1024,
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
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        const plan = JSON.parse(jsonMatch[0]);

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
                return NextResponse.json({ error: horizonError.message }, { status: 500 });
            }

            return NextResponse.json({
                message: 'Future goal created successfully!',
                data: { horizon_item: horizonItem },
            });
        }

        if (plan.type === 'project') {
            // Create project
            const { data: newProject, error: projectError } = await supabase
                .from('loom_items')
                .insert({
                    name: plan.project.name,
                    type: plan.project.type,
                    deadline_date: plan.project.deadline_date,
                    notes: plan.project.notes,
                    user_id: user.id,
                    start_date: new Date().toISOString().split('T')[0],
                    status: 'Active',
                })
                .select()
                .single();

            if (projectError) {
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
