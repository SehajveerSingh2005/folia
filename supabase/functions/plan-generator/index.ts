import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { goal } = await req.json()
    const authHeader = req.headers.get('Authorization')!
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const CLOUDFLARE_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const CLOUDFLARE_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN')

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'Cloudflare credentials are not set up in Supabase secrets.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `You are an expert project and goal planner for an application called Folia. Your task is to analyze a user's goal and determine the best way to structure it within Folia's system, then break it down into actionable steps.

Folia has three main components for planning:
1.  **Inbox Tasks:** Simple, standalone tasks that don't belong to a larger project.
2.  **Flow Items:** These are projects, courses, books, etc. They are larger endeavors that have their own dedicated list of tasks.
3.  **Horizon Items:** These are long-term goals, aspirations, or areas of focus. They are high-level and can be linked to one or more Flow projects.

Based on the user's goal, you must first decide on a \`plan_type\`. There are three possibilities:
-   \`inbox_tasks\`: Use for simple, short-term goals that can be accomplished with a few tasks and don't need a dedicated project. Example: "Organize my desktop files".
-   \`new_project\`: Use for medium-sized goals that clearly represent a single project. Example: "Build a personal portfolio website".
-   \`new_goal_with_project\`: Use for ambitious, long-term goals that involve learning, significant effort, or multiple stages. This creates a high-level Horizon goal and a first-step Flow project to get started. Example: "Become a proficient web developer".

User's Goal: "${goal}"
Current Date: "${currentDate}"

Based on the user's goal and the current date, you must generate a plan. If the goal includes a timeframe (e.g., "in 2 months", "by next week"), calculate the project deadline and task due dates accordingly. If no timeframe is given, use reasonable estimates. All dates must be in YYYY-MM-DD format.

Your response MUST be a single, valid JSON object. Do not include any text or markdown formatting before or after the JSON object.

The JSON object structure depends on the \`plan_type\` you choose:

**If \`plan_type\` is \`inbox_tasks\`:**
{
  "plan_type": "inbox_tasks",
  "tasks": [
    { "title": "Task 1...", "notes": "...", "priority": "Medium", "due_date": "YYYY-MM-DD" },
    { "title": "Task 2...", "notes": "...", "priority": "Low", "due_date": "YYYY-MM-DD" }
  ]
}

**If \`plan_type\` is \`new_project\`:**
{
  "plan_type": "new_project",
  "project": {
    "name": "A concise name for the project.",
    "type": "Project",
    "deadline_date": "YYYY-MM-DD"
  },
  "tasks": [
    { "title": "Task 1...", "notes": "...", "priority": "High", "due_date": "YYYY-MM-DD" },
    { "title": "Task 2...", "notes": "...", "priority": "Medium", "due_date": "YYYY-MM-DD" }
  ]
}

**If \`plan_type\` is \`new_goal_with_project\`:**
{
  "plan_type": "new_goal_with_project",
  "horizon_item": {
    "title": "The long-term goal.",
    "type": "Skill"
  },
  "project": {
    "name": "The first project to start working towards the goal.",
    "type": "Project",
    "deadline_date": "YYYY-MM-DD"
  },
  "tasks": [
    { "title": "Task 1 for the first project...", "notes": "...", "priority": "High", "due_date": "YYYY-MM-DD" },
    { "title": "Task 2 for the first project...", "notes": "...", "priority": "Medium", "due_date": "YYYY-MM-DD" }
  ]
}

Generate a plan with 3-5 tasks. Ensure the tasks are logical first steps. For \`horizon_item\` and \`project\`, choose an appropriate \`type\` from this list: ['Project', 'Book', 'Course', 'Writing', 'Open Source', 'Habit', 'Skill', 'Field', 'Hobby', 'Misc'].`

    const aiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      }
    )

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text()
      console.error('Cloudflare AI Error:', errorBody)
      return new Response(JSON.stringify({ error: 'Failed to generate plan from AI. The service may be temporarily unavailable.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const aiResult = await aiResponse.json()
    console.log('Raw AI Result:', JSON.stringify(aiResult, null, 2));

    const planJsonString = aiResult.result.response.trim().replace(/```json\n?|\n?```/g, '');
    let plan;
    try {
      plan = JSON.parse(planJsonString);
    } catch (e) {
      console.error('Failed to parse JSON from AI response.');
      console.error('Malformed JSON string:', planJsonString);
      throw new Error('AI returned a malformed plan. Please try rephrasing your goal.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let projectId = null;

    switch (plan.plan_type) {
      case 'inbox_tasks': {
        const tasksToInsert = plan.tasks.map((task: any) => ({
          content: task.title,
          notes: task.notes,
          priority: task.priority,
          due_date: task.due_date,
          loom_item_id: null,
          user_id: user.id,
          type: 'Task',
        }));
        const { error: tasksError } = await supabaseAdmin.from('ledger_items').insert(tasksToInsert);
        if (tasksError) throw tasksError;
        break;
      }

      case 'new_project': {
        const { data: newProject, error: projectError } = await supabaseAdmin
          .from('loom_items')
          .insert({ 
            name: plan.project.name, 
            type: plan.project.type, 
            deadline_date: plan.project.deadline_date,
            user_id: user.id, 
            status: 'Active' 
          })
          .select().single();
        if (projectError) throw projectError;
        projectId = newProject.id;

        const tasksToInsert = plan.tasks.map((task: any) => ({
          content: task.title,
          notes: task.notes,
          priority: task.priority,
          due_date: task.due_date,
          loom_item_id: newProject.id,
          user_id: user.id,
          type: 'Task',
        }));
        const { error: tasksError } = await supabaseAdmin.from('ledger_items').insert(tasksToInsert);
        if (tasksError) throw tasksError;
        break;
      }

      case 'new_goal_with_project': {
        const { data: newHorizonItem, error: horizonError } = await supabaseAdmin
          .from('horizon_items')
          .insert({ title: plan.horizon_item.title, type: plan.horizon_item.type, user_id: user.id })
          .select().single();
        if (horizonError) throw horizonError;

        const { data: newProject, error: projectError } = await supabaseAdmin
          .from('loom_items')
          .insert({ 
            name: plan.project.name, 
            type: plan.project.type, 
            deadline_date: plan.project.deadline_date,
            user_id: user.id, 
            status: 'Active' 
          })
          .select().single();
        if (projectError) throw projectError;
        projectId = newProject.id;

        const { error: linkError } = await supabaseAdmin
          .from('horizon_flow_links')
          .insert({ horizon_item_id: newHorizonItem.id, loom_item_id: newProject.id, user_id: user.id });
        if (linkError) throw linkError;

        const tasksToInsert = plan.tasks.map((task: any) => ({
          content: task.title,
          notes: task.notes,
          priority: task.priority,
          due_date: task.due_date,
          loom_item_id: newProject.id,
          user_id: user.id,
          type: 'Task',
        }));
        const { error: tasksError } = await supabaseAdmin.from('ledger_items').insert(tasksToInsert);
        if (tasksError) throw tasksError;
        break;
      }

      default:
        throw new Error(`Unknown plan type: ${plan.plan_type}`);
    }

    return new Response(JSON.stringify({ message: 'Plan created successfully!', projectId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in plan-generator function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})