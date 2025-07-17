import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    console.log(`🕐 Checking contest deadlines at ${now.toISOString()}`)

    // 1. Buscar concursos que acaban de pasar su submission_deadline
    const { data: contests, error: contestsError } = await supabaseClient
      .from('contests')
      .select('*')
      .eq('status', 'active')
      .lt('submission_deadline', now.toISOString())
      .gte('voting_deadline', now.toISOString()) // Aún no terminó la votación

    if (contestsError) {
      console.error('Error fetching contests:', contestsError)
      throw contestsError
    }

    console.log(`📊 Found ${contests?.length || 0} contests that should transition to voting`)

    if (!contests || contests.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No contests need transition',
          checkedAt: now.toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const results = []

    // 2. Procesar cada concurso
    for (const contest of contests) {
      console.log(`🎯 Processing contest: ${contest.title} (ID: ${contest.id})`)
      
      // Verificar si ya enviamos el email de voting_started
      const { data: emailLog, error: logError } = await supabaseClient
        .from('email_logs')
        .select('id')
        .eq('contest_id', contest.id)
        .eq('email_type', 'voting_started')
        .limit(1)

      if (logError) {
        console.error(`Error checking email log for contest ${contest.id}:`, logError)
        results.push({
          contestId: contest.id,
          contestTitle: contest.title,
          success: false,
          error: 'Error checking email log'
        })
        continue
      }

      // Si ya enviamos el email, saltamos este concurso
      if (emailLog && emailLog.length > 0) {
        console.log(`📧 Email already sent for contest ${contest.id}, skipping`)
        results.push({
          contestId: contest.id,
          contestTitle: contest.title,
          success: true,
          message: 'Email already sent'
        })
        continue
      }

      // 3. Enviar email de voting_started
      try {
        console.log(`📧 Sending voting_started email for contest ${contest.id}`)
        
        const emailResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-contest-emails`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              emailType: 'voting_started',
              contestId: contest.id
            })
          }
        )

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error(`Error sending email for contest ${contest.id}:`, errorText)
          results.push({
            contestId: contest.id,
            contestTitle: contest.title,
            success: false,
            error: `Email send failed: ${errorText}`
          })
          continue
        }

        const emailResult = await emailResponse.json()
        console.log(`✅ Email sent successfully for contest ${contest.id}`)
        
        results.push({
          contestId: contest.id,
          contestTitle: contest.title,
          success: true,
          message: 'voting_started email sent',
          emailResult: emailResult
        })

      } catch (emailError) {
        console.error(`Error sending email for contest ${contest.id}:`, emailError)
        results.push({
          contestId: contest.id,
          contestTitle: contest.title,
          success: false,
          error: `Email send error: ${emailError.message}`
        })
      }
    }

    // 4. Respuesta final
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${contests.length} contests: ${successCount} success, ${failureCount} failures`,
        checkedAt: now.toISOString(),
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in contest deadline checker:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        checkedAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})