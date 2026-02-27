// supabase/functions/send-scheduled-email/index.ts
// =============================================================================
// SEND SCHEDULED EMAIL - Edge Function
// =============================================================================
// Invocada por pg_cron en fechas fijas del ciclo mensual de retos.
// Actúa como wrapper de send-contest-emails con validaciones de seguridad.
//
// Emails del ciclo:
//   - new_contest       → Día 4 del mes, 10:00 AM Colombia
//   - submission_reminder → Día 15 y día 25 del mes, 10:00 AM Colombia
//   - voting_started    → Día 27 del mes, 12:01 AM Colombia
//   - voting_reminder   → Día 1 del mes siguiente, 10:00 AM Colombia
//
// Seguridad:
//   - Si el reto ya está finalizado, se salta (excepto para 'results')
//   - Retos de prueba (test/prueba/demo) → emailMode: 'test' → solo admin
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { emailType, contestId } = await req.json();

    if (!emailType || !contestId) {
      return new Response(
        JSON.stringify({ success: false, error: "emailType y contestId son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 Email programado iniciado: ${emailType} para reto ${contestId}`);

    // ------------------------------------------------------------------
    // 1. Verificar que el reto existe
    // ------------------------------------------------------------------
    const { data: contest, error: contestError } = await supabase
      .from("contests")
      .select("id, title, status, finalized_at")
      .eq("id", contestId)
      .single();

    if (contestError || !contest) {
      const msg = "Reto no encontrado: " + (contestError?.message ?? "");
      console.error("❌", msg);
      await logAction(supabase, contestId, `email_error_${emailType}`, msg);
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ------------------------------------------------------------------
    // 2. Saltar si el reto ya está finalizado (excepto resultados)
    //    Protege contra emails de retos viejos si el cron corre tarde
    // ------------------------------------------------------------------
    if (emailType !== "results" && contest.finalized_at) {
      const msg = `Reto ya finalizado, saltando email ${emailType}`;
      console.log("⏭️", msg);
      await logAction(supabase, contestId, `email_skipped_${emailType}`, msg);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: msg }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📋 Enviando "${emailType}" para reto: "${contest.title}"`);

    // ------------------------------------------------------------------
    // 3. Determinar modo (test para retos de prueba, production para el resto)
    // ------------------------------------------------------------------
    const isTestContest = /test|prueba|demo/i.test(contest.title);
    const emailMode = isTestContest ? "test" : "production";
    console.log(`📧 Modo: ${emailMode}`);

    // ------------------------------------------------------------------
    // 4. Llamar send-contest-emails
    // ------------------------------------------------------------------
    const emailRes = await fetch(
      `${supabaseUrl}/functions/v1/send-contest-emails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ emailType, contestId, emailMode }),
      }
    );

    if (emailRes.ok) {
      const result = await emailRes.json();
      console.log(`✅ Email ${emailType} enviado correctamente`);
      await logAction(supabase, contestId, `email_sent_${emailType}`,
        `Email ${emailType} enviado en modo ${emailMode}`);

      return new Response(
        JSON.stringify({ success: true, emailType, contestId, emailMode, result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errText = await emailRes.text();
      const msg = `Error enviando email ${emailType}: ${errText}`;
      console.error("❌", msg);
      await logAction(supabase, contestId, `email_error_${emailType}`, msg);

      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (err) {
    console.error("💥 Error en send-scheduled-email:", err);
    const msg = err instanceof Error ? err.message : String(err);

    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// -----------------------------------------------------------------------------
// Helper: registrar en log de auditoría
// -----------------------------------------------------------------------------
async function logAction(
  supabase: ReturnType<typeof createClient>,
  contestId: string,
  action: string,
  notes: string
) {
  const { error } = await supabase
    .from("contest_automation_log")
    .insert({
      contest_id: contestId,
      action,
      executed_at: new Date().toISOString(),
      notes,
    });

  if (error) {
    console.error("⚠️ Error escribiendo en automation log:", error.message);
  }
}
