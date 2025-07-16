import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { email } = await req.json()

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Por favor ingresa un email válido" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const { data: existingUser, error: userError } = await supabase
      .from("user_profiles")
      .select("id, email, newsletter_contests")
      .eq("email", normalizedEmail)
      .single()

    if (userError && userError.code !== "PGRST116") {
      console.error("Error checking existing user:", userError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Error verificando usuario existente" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    if (existingUser) {
      if (existingUser.newsletter_contests) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Ya estás suscrito a las notificaciones de concursos en tu cuenta",
            isNewSubscription: false 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ newsletter_contests: true })
        .eq("id", existingUser.id)

      if (updateError) {
        console.error("Error updating user preferences:", updateError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Error activando notificaciones en tu cuenta" 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notificaciones activadas en tu cuenta existente",
          isNewSubscription: true 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    const { data: existingSubscriber, error: subscriberError } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", normalizedEmail)
      .single()

    if (subscriberError && subscriberError.code !== "PGRST116") {
      console.error("Error checking existing subscriber:", subscriberError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Error verificando suscripción existente" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    if (existingSubscriber && !existingSubscriber.is_active) {
      const { error: reactivateError } = await supabase
        .from("newsletter_subscribers")
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq("email", normalizedEmail)

      if (reactivateError) {
        console.error("Error reactivating subscription:", reactivateError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Error reactivando suscripción" 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Suscripción reactivada exitosamente",
          isNewSubscription: true 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    if (existingSubscriber && existingSubscriber.is_active) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Ya estás suscrito a las notificaciones de concursos",
          isNewSubscription: false 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email: normalizedEmail,
        source: "landing_page",
        is_active: true
      })

    if (insertError) {
      console.error("Error creating subscription:", insertError)
      
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Ya estás suscrito a las notificaciones",
            isNewSubscription: false 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Error creando suscripción" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Suscripción exitosa. Te notificaremos cuando inicie el próximo concurso",
        isNewSubscription: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )

  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Error inesperado. Inténtalo de nuevo en unos minutos" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
})