// supabase/functions/auto-finalize-contest/index.ts
// =============================================================================
// AUTO FINALIZE CONTEST - Edge Function
// =============================================================================
// Invocada por pg_cron exactamente cuando vence el voting_deadline de un reto.
// Replica la lógica de useContestFinalization.js con service role (sin necesitar
// que el admin esté logueado).
//
// Flujo:
//   1. pg_cron llama esta función con { contestId }
//   2. Verificamos que el reto no esté ya finalizado (idempotente)
//   3. Determinamos top 3 historias por likes_count DESC, created_at ASC
//   4. Marcamos ganadores, actualizamos wins_count, asignamos badges
//   5. Actualizamos contests.status = 'results', finalized_at = NOW()
//   6. Llamamos send-contest-emails para enviar email de resultados
//   7. Registramos en contest_automation_log
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
    const { contestId } = await req.json();

    if (!contestId) {
      return new Response(
        JSON.stringify({ success: false, error: "contestId requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🏁 Auto-finalización iniciada para reto: ${contestId}`);

    // ------------------------------------------------------------------
    // 1. Verificar que el reto existe y no está ya finalizado
    // ------------------------------------------------------------------
    const { data: contest, error: contestError } = await supabase
      .from("contests")
      .select("id, title, status, finalized_at, voting_deadline")
      .eq("id", contestId)
      .single();

    if (contestError || !contest) {
      const msg = "Reto no encontrado: " + (contestError?.message ?? "");
      console.error("❌", msg);
      await logAction(supabase, contestId, "error", msg);
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (contest.finalized_at || contest.status === "results") {
      const msg = "Reto ya finalizado, saltando";
      console.log("⏭️", msg);
      await logAction(supabase, contestId, "skipped_already_finalized", msg);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: msg }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📋 Reto encontrado: "${contest.title}"`);

    // ------------------------------------------------------------------
    // 2. Obtener historias ordenadas por likes_count DESC, created_at ASC
    //    (desempate: quien envió primero queda mejor posicionado)
    // ------------------------------------------------------------------
    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("id, title, user_id, likes_count, created_at")
      .eq("contest_id", contestId)
      .order("likes_count", { ascending: false })
      .order("created_at", { ascending: true });

    if (storiesError) throw new Error("Error obteniendo historias: " + storiesError.message);

    if (!stories || stories.length === 0) {
      const msg = "No hay historias en este reto, no se puede finalizar";
      console.warn("⚠️", msg);
      await logAction(supabase, contestId, "error", msg);
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📊 ${stories.length} historias encontradas`);

    // ------------------------------------------------------------------
    // 3. Determinar top 3 ganadores
    // ------------------------------------------------------------------
    const winners = stories.slice(0, 3);

    // ------------------------------------------------------------------
    // 4. Marcar historias ganadoras en paralelo
    // ------------------------------------------------------------------
    await Promise.all(
      winners.map(async (winner, index) => {
        const position = index + 1;
        const { error } = await supabase
          .from("stories")
          .update({ is_winner: true, winner_position: position })
          .eq("id", winner.id);

        if (error) throw new Error(`Error marcando ganador #${position}: ${error.message}`);
        console.log(`✅ "${winner.title}" marcado como #${position}`);
      })
    );

    // ------------------------------------------------------------------
    // 5. Actualizar stats y asignar badges (secuencial para evitar race conditions)
    // ------------------------------------------------------------------
    for (let index = 0; index < winners.length; index++) {
      const winner = winners[index];
      const position = index + 1;

      // Solo el 1er lugar incrementa wins_count
      if (position === 1) {
        // Obtener wins_count actual
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("wins_count, display_name")
          .eq("id", winner.user_id)
          .single();

        if (profileError) throw new Error(`Error obteniendo perfil: ${profileError.message}`);

        const newWinsCount = (profile.wins_count ?? 0) + 1;

        // Incrementar wins_count
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ wins_count: newWinsCount })
          .eq("id", winner.user_id);

        if (updateError) throw new Error(`Error actualizando wins_count: ${updateError.message}`);

        console.log(`🏆 wins_count → ${newWinsCount} para ${profile.display_name}`);

        // Badge de ganador
        await awardBadge(supabase, winner.user_id, "contest_winner", contestId);

        // Badge veterano: 2+ victorias
        if (newWinsCount >= 2) {
          await awardBadge(supabase, winner.user_id, "contest_winner_veteran", contestId);
        }

        // Badge leyenda: 5+ victorias
        if (newWinsCount >= 5) {
          await awardBadge(supabase, winner.user_id, "contest_winner_legend", contestId);
        }
      } else {
        // 2do y 3er lugar: badge finalista
        await awardBadge(supabase, winner.user_id, "contest_finalist", contestId);
        console.log(`🥈 Badge finalista asignado (posición ${position})`);
      }
    }

    // ------------------------------------------------------------------
    // 6. Actualizar estado del reto a "results"
    // ------------------------------------------------------------------
    const { error: finalizeError } = await supabase
      .from("contests")
      .update({ status: "results", finalized_at: new Date().toISOString() })
      .eq("id", contestId);

    if (finalizeError) throw new Error("Error finalizando reto: " + finalizeError.message);

    console.log("🎯 Reto marcado como finalizado");

    // ------------------------------------------------------------------
    // 7. Registrar en log de auditoría
    // ------------------------------------------------------------------
    await logAction(supabase, contestId, "finalized", "Auto-finalizado por pg_cron");

    // ------------------------------------------------------------------
    // 8. Enviar email de resultados via send-contest-emails
    // Retos de prueba (título con "test"/"prueba"/"demo") → solo al admin
    // ------------------------------------------------------------------
    try {
      const isTestContest = /test|prueba|demo/i.test(contest.title);
      const emailMode = isTestContest ? "test" : "production";
      console.log(`📧 Enviando email de resultados (modo: ${emailMode})`);

      const emailRes = await fetch(
        `${supabaseUrl}/functions/v1/send-contest-emails`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            emailType: "results",
            contestId: contestId,
            emailMode: emailMode,
          }),
        }
      );

      if (emailRes.ok) {
        console.log("📧 Email de resultados enviado correctamente");
      } else {
        const errText = await emailRes.text();
        console.error("⚠️ Email enviado con error (no crítico):", errText);
        // No lanzar error - el reto ya está finalizado correctamente
      }
    } catch (emailErr) {
      console.error("⚠️ Error al enviar email de resultados (no crítico):", emailErr);
      // No lanzar error - el reto ya está finalizado correctamente
    }

    console.log("🎉 Auto-finalización completada exitosamente");

    return new Response(
      JSON.stringify({
        success: true,
        contestId,
        contestTitle: contest.title,
        winners: winners.map((w, i) => ({ position: i + 1, id: w.id, title: w.title })),
        totalStories: stories.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("💥 Error en auto-finalización:", err);
    const msg = err instanceof Error ? err.message : String(err);

    // Intentar registrar el error en el log (best effort)
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.contestId) {
        await logAction(supabase, body.contestId, "error", msg);
      }
    } catch { /* ignorar */ }

    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

async function awardBadge(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  badgeType: string,
  contestId: string
) {
  const { error } = await supabase.rpc("award_specific_badge", {
    target_user_id: userId,
    badge_type: badgeType,
    contest_id: contestId,
  });

  if (error) {
    console.error(`⚠️ Error asignando badge ${badgeType} a ${userId}:`, error.message);
    // No lanzar - los badges son no-críticos, el reto igual se finaliza
  } else {
    console.log(`🏅 Badge ${badgeType} asignado a ${userId}`);
  }
}

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
