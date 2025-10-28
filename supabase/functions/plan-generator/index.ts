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

    const prompt = `You are an expert project planner. Your task is to take a user's goal and break it down into a project with a list of actionable tasks.

User's Goal: "${goal}"

Your response MUST be a valid JSON object. Do not include any text or markdown formatting before or after the JSON object.

The JSON object should have the following structure:
{
  "project_name": "A concise and inspiring name for the project related to the goal.",
  "tasks": [
    {
      "title": "A clear, actionable task title.",
      "notes": "A brief, 1-2 sentence description of why this task is important or what it entails.",
      "priority": "Either 'High', 'Medium', or 'Low', based on the task's importance to the overall goal."
    }
  ]
}

Generate a plan with at least 5 tasks. Ensure the tasks are logical steps towards achieving the goal.`

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
      return new Response(JSON.stringify({ error: 'Failed to generate plan from AI.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const aiResult = await aiResponse.json()
    const planJsonString = aiResult.result.response.trim().replace(/```json\n?|\n?```/g, '');
    const plan = JSON.parse(planJsonString)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: newProject, error: projectError } = await supabaseAdmin
      .from('loom_items')
      .insert({
        name: plan.project_name,
        user_id: user.id,
        type: 'Project',
        status: 'Active',
      })
      .select()
      .single()

    if (projectError) throw projectError

    const tasksToInsert = plan.tasks.map((task: any) => ({
      content: task.title,
      notes: task.notes,
      priority: task.priority,
      loom_item_id: newProject.id,
      user_id: user.id,
      type: 'Task',
    }))

    const { error: tasksError } = await supabaseAdmin
      .from('ledger_items')
      .insert(tasksToInsert)

    if (tasksError) throw tasksError

    return new Response(JSON.stringify({ message: 'Plan created successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})