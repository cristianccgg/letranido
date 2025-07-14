// Función de debug para encontrar el problema
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔍 Function called, method:', req.method)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log environment variables
    console.log('📊 Environment check:')
    console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'))
    console.log('- SUPABASE_ANON_KEY exists:', !!Deno.env.get('SUPABASE_ANON_KEY'))
    console.log('- RESEND_API_KEY exists:', !!Deno.env.get('RESEND_API_KEY'))
    console.log('- FROM_EMAIL:', Deno.env.get('FROM_EMAIL'))
    console.log('- EMAIL_MODE:', Deno.env.get('EMAIL_MODE'))
    console.log('- ADMIN_EMAIL:', Deno.env.get('ADMIN_EMAIL'))

    // Parse request body
    let body;
    try {
      body = await req.json()
      console.log('📧 Request body:', body)
    } catch (e) {
      console.error('❌ Error parsing JSON:', e)
      throw new Error('Invalid JSON in request body')
    }

    // Initialize Supabase client
    console.log('🔗 Initializing Supabase client...')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Test database connection
    console.log('🧪 Testing database connection...')
    const { data: contests, error: contestError } = await supabaseClient
      .from('contests')
      .select('id, title, status')
      .limit(1);
    
    if (contestError) {
      console.error('❌ Database error:', contestError)
      throw contestError
    }
    
    console.log('✅ Database connected, sample contest:', contests?.[0])

    // Test user_profiles table
    console.log('👥 Testing user_profiles table...')
    const { data: users, error: usersError } = await supabaseClient
      .from('user_profiles')
      .select('email, username')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError)
    } else {
      console.log('✅ Users table accessible, sample user:', users?.[0])
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Debug function working',
        data: {
          hasContest: !!contests?.[0],
          hasUsers: !!users?.[0],
          requestBody: body,
          env: {
            hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
            hasSupabaseKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
            hasResendKey: !!Deno.env.get('RESEND_API_KEY'),
            fromEmail: Deno.env.get('FROM_EMAIL'),
            emailMode: Deno.env.get('EMAIL_MODE'),
            adminEmail: Deno.env.get('ADMIN_EMAIL')
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})