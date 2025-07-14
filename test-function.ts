// Función de prueba simple para verificar que Edge Functions funciona
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🧪 Test function called!')
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL')
    const emailMode = Deno.env.get('EMAIL_MODE')
    const adminEmail = Deno.env.get('ADMIN_EMAIL')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test function working!',
        env: {
          hasResendKey: !!resendApiKey,
          fromEmail: fromEmail,
          emailMode: emailMode,
          adminEmail: adminEmail
        },
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})