// handleUserUnsubscribe.ts - Función segura para manejar unsubscribe sin exponer service role key

export async function handleUserUnsubscribe(supabaseClient: any, email: string): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  try {
    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email es requerido para desuscribirse" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`🚫 Procesando unsubscribe para: ${normalizedEmail}`);

    // Verificar que el usuario existe
    const { data: user, error: findError } = await supabaseClient
      .from('user_profiles')
      .select('id, email, email_notifications, contest_notifications, general_notifications, newsletter_contests')
      .eq('email', normalizedEmail)
      .single();

    if (findError) {
      console.error("Error finding user:", findError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Usuario no encontrado: ${findError.message}` 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`📧 Usuario encontrado: ${user.email}`);

    // Desactivar todas las notificaciones de email
    const { data: updateResult, error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({
        email_notifications: false,
        contest_notifications: false,
        general_notifications: false,
        newsletter_contests: false,
        updated_at: new Date().toISOString()
      })
      .eq('email', normalizedEmail)
      .select();

    if (updateError) {
      console.error("Error updating user preferences:", updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Error actualizando preferencias: ${updateError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`✅ Usuario desuscrito exitosamente: ${normalizedEmail}`);
    console.log(`📊 Resultado actualización:`, updateResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Te has desuscrito exitosamente de las notificaciones por email",
        updatedUser: updateResult?.[0] || null
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error inesperado en unsubscribe:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Error inesperado: ${error.message || error}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}