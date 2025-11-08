// supabase/functions/send-contest-emails/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  emailType:
    | "new_contest"
    | "submission_reminder"
    | "voting_started"
    | "voting_reminder"
    | "results"
    | "manual_regular"
    | "manual_essential"
    | "newsletter_subscription";
  contestId?: string;
  // Para preview mode
  preview?: boolean;
  // Para suscripción de newsletter
  email?: string;
  // Para emails manuales
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  // Para modo test desde frontend
  emailMode?: string;
  // Para sistema de lotes
  countOnly?: boolean;
  batchLimit?: number;
  batchOffset?: number;
  batchNumber?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request data
    const { emailType, contestId, subject, htmlContent, textContent, email, preview, emailMode, countOnly, batchLimit, batchOffset, batchNumber }: EmailRequest = await req.json();
    console.log(
      `📧 Procesando: ${emailType}${contestId ? ` para reto: ${contestId}` : ''}${email ? ` para email: ${email}` : ''}${preview ? ' (PREVIEW MODE)' : ''}${emailMode ? ` (modo: ${emailMode})` : ''}`
    );
    
    // 🔍 DEBUG: Mostrar parámetros recibidos
    console.log(`🔍 DEBUG - Parámetros recibidos:`, {
      emailType,
      contestId,
      preview,
      hasSubject: !!subject,
      hasHtmlContent: !!htmlContent
    });

    // Handle newsletter subscription separately
    if (emailType === "newsletter_subscription") {
      return await handleNewsletterSubscription(supabaseClient, email);
    }

    // Unsubscribe functionality removed - users now use preferences page

    // Get contest data (solo para emails de reto)
    let contest;
    const isContestEmail = ["new_contest", "submission_reminder", "voting_started", "voting_reminder", "results"].includes(emailType);
    
    if (isContestEmail) {
      if (contestId) {
        const { data, error } = await supabaseClient
          .from("contests")
          .select("*")
          .eq("id", contestId)
          .single();

        if (error) throw error;
        contest = data;
      } else {
        // Get active contest using hybrid logic
        const { data: allContests, error } = await supabaseClient
          .from("contests")
          .select("*")
          .is("finalized_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Use hybrid logic for contest selection
        if (allContests && allContests.length > 0) {
          const now = new Date();
          
          // Separate test and production contests
          const testContests = allContests.filter((c: any) => 
            c.title && (c.title.toLowerCase().includes('test') || 
                       c.title.toLowerCase().includes('prueba') || 
                       c.title.toLowerCase().includes('demo'))
          );
          const productionContests = allContests.filter((c: any) => 
            !testContests.includes(c)
          );
          
          // Priority 1: Test contests (most recent)
          if (testContests.length > 0) {
            contest = testContests[0];
          }
          // Priority 2: Production contests (by dates)
          else if (productionContests.length > 0) {
            const activeNow = productionContests.filter((c: any) => {
              const votingDeadline = new Date(c.voting_deadline);
              return now <= votingDeadline;
            });
            
            if (activeNow.length > 0) {
              contest = activeNow.sort((a: any, b: any) => 
                new Date(a.submission_deadline).getTime() - new Date(b.submission_deadline).getTime()
              )[0];
            } else {
              contest = productionContests[0];
            }
          }
          // Fallback
          else {
            contest = allContests[0];
          }
        }
      }

      if (!contest) {
        throw new Error("No se encontró reto");
      }
    }

    // Get users for email based on notification type
    let users, usersError;
    
    // SISTEMA SIMPLIFICADO: Solo 2 tipos de notificaciones
    if (emailType === "manual_essential") {
      // Essential emails go to all users with valid email
      console.log("📧 Obteniendo todos los usuarios para email esencial...");
      const { data, error } = await supabaseClient
        .rpc("get_essential_email_recipients");
      users = data;
      usersError = error;
    } else {
      // Todos los demás emails (retos, generales, newsletter) van a usuarios con notificaciones activas
      console.log("📧 Obteniendo usuarios con notificaciones activas...");
      
      // Obtener usuarios registrados con notificaciones activas
      const { data: registeredUsers, error: registeredError } = await supabaseClient
        .rpc("get_regular_email_recipients");
      
      console.log("📧 Obteniendo newsletter subscribers...");
      const { data: newsletterUsers, error: newsletterError } = await supabaseClient
        .from("newsletter_subscribers")
        .select("email, created_at")
        .eq("is_active", true);
      
      if (registeredError) {
        console.error("Error obteniendo usuarios registrados:", registeredError);
        usersError = registeredError;
      } else if (newsletterError) {
        console.error("Error obteniendo newsletter subscribers:", newsletterError);
        usersError = newsletterError;
      } else {
        // Combinar usuarios registrados + newsletter subscribers (sin duplicados)
        const allUsers = [...(registeredUsers || [])];
        const registeredEmails = new Set(registeredUsers?.map(u => u.email) || []);
        
        // Agregar newsletter subscribers que no estén ya registrados
        (newsletterUsers || []).forEach(subscriber => {
          if (!registeredEmails.has(subscriber.email)) {
            allUsers.push({
              user_id: null,
              email: subscriber.email,
              display_name: subscriber.email.split('@')[0],
              created_at: subscriber.created_at
            });
          }
        });
        
        users = allUsers;
        console.log(`📧 Combined: ${registeredUsers?.length || 0} registered users + ${newsletterUsers?.length || 0} newsletter subscribers = ${users.length} total recipients`);
      }
    }

    if (usersError) {
      console.error("Error obteniendo usuarios:", usersError);
      throw usersError;
    }

    // Filter and validate emails using the new validation system
    const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients =
      users
        ?.map((u) => u.email)
        .filter(
          (email) =>
            email &&
            typeof email === "string" &&
            validEmailRegex.test(email.trim())
        )
        .map((email) => email.trim()) || [];

    console.log(
      `📧 Found ${users?.length || 0} users with ${emailType} notifications enabled, ${recipients.length} with valid emails`
    );

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No hay usuarios para notificar",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 📊 COUNT ONLY MODE - Retornar solo el conteo sin procesar contenido
    if (countOnly) {
      console.log(`📊 COUNT ONLY: Retornando conteo para ${emailType}`);
      return new Response(
        JSON.stringify({
          success: true,
          totalRecipients: recipients.length,
          details: {
            emailType,
            contestId: contest?.id || null,
            usersFound: users?.length || 0,
            validEmails: recipients.length
          },
          message: `${recipients.length} destinatarios encontrados para ${emailType}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Prepare email content based on type
    let emailData;
    switch (emailType) {
      case "new_contest":
        emailData = {
          subject: `🎯 Nuevo reto disponible: "${contest.title}"`,
          html: generateNewContestHTML(contest),
          text: `Nuevo reto disponible: "${contest.title}". Visita https://letranido.com/write/${contest.id} para participar.`,
        };
        break;

      case "submission_reminder":
        const daysLeft = calculateDaysLeft(contest.submission_deadline);
        emailData = {
          subject: `⏰ Últimos ${daysLeft} días para participar en "${contest.title}"`,
          html: generateReminderHTML(contest, daysLeft),
          text: `Quedan ${daysLeft} días para participar en "${contest.title}". Visita https://letranido.com/write/${contest.id}`,
        };
        break;

      case "voting_started":
        // Get stories count
        const { count: storiesCount } = await supabaseClient
          .from("stories")
          .select("*", { count: "exact", head: true })
          .eq("contest_id", contest.id);

        emailData = {
          subject: `🗳️ ¡Votación iniciada! Lee y vota por las mejores historias`,
          html: generateVotingHTML(contest, storiesCount || 0),
          text: `La votación para "${contest.title}" ha comenzado. ${storiesCount || 0} historias esperan tu voto. Visita https://letranido.com/reto/actual`,
        };
        break;

      case "voting_reminder":
        // Get stories count for voting reminder
        const { count: reminderStoriesCount } = await supabaseClient
          .from("stories")
          .select("*", { count: "exact", head: true })
          .eq("contest_id", contest.id);

        const votingDaysLeft = calculateDaysLeft(contest.voting_deadline);
        emailData = {
          subject: `⏰ ¡Últimos ${votingDaysLeft} días para votar en "${contest.title}"!`,
          html: generateVotingReminderHTML(contest, reminderStoriesCount || 0, votingDaysLeft),
          text: `Quedan ${votingDaysLeft} días para votar en "${contest.title}". ${reminderStoriesCount || 0} historias esperan tu voto. Visita https://letranido.com/reto/actual`,
        };
        break;

      case "results":
        emailData = {
          subject: `🏆 ¡Resultados del reto "${contest.title}"!`,
          html: generateResultsHTML(contest),
          text: `Resultados del reto "${contest.title}" disponibles. Visita https://letranido.com/reto/actual`,
        };
        break;

      case "manual_regular":
      case "manual_essential":
        // Para emails manuales, usar template con formato de marca
        if (!subject || !htmlContent) {
          throw new Error("Para emails manuales se requiere subject y htmlContent");
        }
        emailData = {
          subject: subject,
          html: generateManualEmailHTML(subject, htmlContent, emailType),
          text: textContent || subject,
        };
        break;

      default:
        throw new Error(`Tipo de email no válido: ${emailType}`);
    }

    // 🔍 DEBUG: Verificar antes del preview check
    console.log(`🔍 DEBUG - Antes del preview check:`, {
      preview,
      typeofPreview: typeof preview,
      emailType,
      emailDataKeys: Object.keys(emailData || {}),
      hasEmailData: !!emailData
    });
    
    // ✅ PREVIEW MODE - Retornar contenido sin enviar
    if (preview) {
      console.log(`📧 PREVIEW MODE: Retornando contenido para ${emailType}`);
      console.log(`📧 Email data:`, { 
        subject: emailData.subject?.substring(0, 50) + '...', 
        htmlLength: emailData.html?.length,
        textLength: emailData.text?.length 
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          preview: {
            subject: emailData.subject,
            htmlContent: emailData.html,
            textContent: emailData.text,
            emailType: emailType
          },
          message: `Preview generado para ${emailType}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Send emails using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no configurada");
    }

    // In test mode, send only to admin (but not for newsletter subscriptions)
    // Priorizar emailMode del frontend, fallback a env var
    const isTestMode = emailMode === "test" || Deno.env.get("EMAIL_MODE") === "test";
    let baseRecipients = isTestMode
      ? [Deno.env.get("ADMIN_EMAIL") || "cristianccggg@gmail.com"]
      : recipients;

    // 📦 BATCH MODE - Aplicar paginación si se especificaron parámetros de lote
    let finalRecipients = baseRecipients;
    let batchInfo = null;

    if (batchLimit !== undefined && batchOffset !== undefined) {
      const startIndex = batchOffset;
      const endIndex = startIndex + batchLimit;
      finalRecipients = baseRecipients.slice(startIndex, endIndex);
      
      batchInfo = {
        batchNumber: batchNumber || 1,
        batchSize: finalRecipients.length,
        totalRecipients: baseRecipients.length,
        offset: startIndex,
        isPartialSend: finalRecipients.length < baseRecipients.length
      };
      
      console.log(`📦 BATCH MODE: Enviando lote ${batchNumber || 1} - ${startIndex + 1} a ${startIndex + finalRecipients.length} de ${baseRecipients.length} total`);
    }

    console.log(
      `📧 Enviando a ${finalRecipients.length} destinatarios (modo: ${isTestMode ? "test" : "production"})`
    );
    console.log(`📧 Recipients:`, finalRecipients);
    console.log(`📧 From:`, Deno.env.get("FROM_EMAIL"));
    console.log(`📧 Subject:`, emailData.subject);

    // Dividir destinatarios en lotes de máximo 49 (límite de Resend es 50 total: 1 TO + 49 BCC)
    const BATCH_SIZE = 49;
    const batches = [];
    for (let i = 0; i < finalRecipients.length; i += BATCH_SIZE) {
      batches.push(finalRecipients.slice(i, i + BATCH_SIZE));
    }

    console.log(`📧 Enviando en ${batches.length} lotes (máximo ${BATCH_SIZE} BCC + 1 TO = 50 total por lote)`);

    // Enviar cada lote
    const results = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📧 Enviando lote ${i + 1}/${batches.length} con ${batch.length} destinatarios`);

      // Preparar email body para este lote
      const emailBody: any = {
        from: `Letranido <${Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev"}>`,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        reply_to: "info@letranido.com",
      };

      // Para envío masivo, usar BCC para proteger privacidad
      if (batch.length > 1) {
        emailBody.to = [Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev"]; // TO solo el remitente
        emailBody.bcc = batch; // Este lote en BCC (ocultos)
        console.log(`🔒 Lote ${i + 1}: USANDO BCC para proteger privacidad de ${batch.length} destinatarios`);
      } else {
        // Email individual, usar TO normal
        emailBody.to = batch;
        console.log(`📧 Lote ${i + 1}: Email individual a: ${batch[0]}`);
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error en lote ${i + 1}: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      results.push(result);
      console.log(`✅ Lote ${i + 1} enviado:`, result);

      // Pequeña pausa entre lotes para evitar rate limiting
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const totalSent = results.reduce((sum, result) => sum + (result.id ? 1 : 0), 0);
    console.log(`✅ Todos los lotes enviados. Total: ${totalSent} emails`);

    // Log email send to database
    try {
      await supabaseClient.from("email_logs").insert({
        email_type: emailType,
        contest_id: contest?.id || null,
        recipient_count: finalRecipients.length,
        success: true,
        sent_at: new Date().toISOString(),
        subject: emailData.subject,
      });
    } catch (logError) {
      console.error("⚠️ Error logging to database (email still sent):", logError);
      // No fallar la función si el logging falla
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: finalRecipients.length,
        mode: isTestMode ? "test" : "production",
        data: { batches: batches.length, results: results },
        
        // Información adicional del lote si aplica
        ...(batchInfo && {
          batchInfo: batchInfo
        })
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("❌ Error stack:", error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: "Error en función de email",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Helper function para formatear fechas en hora de Colombia
function formatColombiaDateTime(dateString: string, includeTime: boolean = false): string {
  if (!dateString) return "Fecha no definida";
  
  // Crear fecha interpretándola como UTC (como viene de la BD)
  const utcDate = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric", 
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota"
  };
  
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
    options.hour12 = true;
  }
  
  return utcDate.toLocaleDateString("es-ES", options);
}

// Helper function para calcular días restantes en hora de Colombia
function calculateDaysLeft(deadlineString: string): number {
  if (!deadlineString) return 0;
  
  // Crear fecha del deadline interpretándola como UTC
  const deadlineUTC = new Date(deadlineString);
  
  // Obtener la fecha/hora actual en Colombia
  const now = new Date();
  const nowInColombia = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
  
  // Calcular diferencia en milisegundos
  const diffMs = deadlineUTC.getTime() - nowInColombia.getTime();
  
  // Convertir a días y redondear hacia abajo (días completos)
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysLeft); // No devolver números negativos
}

// Templates HTML mejorados para Letranido
function generateNewContestHTML(contest: any): string {
  const deadline = formatColombiaDateTime(contest.submission_deadline, true);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con color sólido para compatibilidad -->
      <div style="background: #6366f1; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🪶 Letranido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Donde nacen las palabras</p>
      </div>
      
      <!-- Contenido principal -->
      <div style="padding: 40px 30px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #1f2937; margin: 0 0 12px 0; font-size: 24px;">🎯 ¡Nuevo reto disponible!</h2>
          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 0 auto;"></div>
        </div>
        
        <!-- Tarjeta del reto -->
        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 50%, #fef7f0 100%); border: 2px solid #e0e7ff; border-radius: 16px; padding: 32px; margin: 28px 0; text-align: center; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);">
          <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 22px; font-weight: bold;">"${contest.title}"</h3>
          <p style="color: #475569; margin: 0 0 25px 0; font-size: 16px; line-height: 1.5;">${contest.description}</p>
          
          <!-- Detalles en formato vertical más limpio -->
          <div style="text-align: left; max-width: 400px; margin: 0 auto;">
            <div style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-weight: 500;">📝 Extensión: </span>
              <span style="color: #1e293b; font-weight: bold;">${contest.min_words} - ${contest.max_words} palabras</span>
            </div>
            <div style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-weight: 500;">🎭 Categoría: </span>
              <span style="color: #1e293b; font-weight: bold;">${contest.category}</span>
            </div>
            <div style="padding: 12px 0;">
              <span style="color: #64748b; font-weight: 500;">⏰ Fecha límite: </span>
              <span style="color: #6366f1; font-weight: bold;">${deadline}</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">¿Estás listo para el desafío? Usa el prompt como inspiración y desarrolla tu historia única.</p>
          <a href="https://letranido.com/write/${contest.id}" style="background: #6366f1; color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);">
            ✍️ Escribir mi historia
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 100%); padding: 28px 32px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e0e7ff; border-top: none;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          <strong>Letranido</strong> • Comunidad de escritura creativa<br>
          <a href="https://letranido.com" style="color: #6366f1; text-decoration: none;">letranido.com</a>
        </p>
        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
          <a href="https://letranido.com/preferences" style="color: #6b7280; text-decoration: underline;">
            Gestionar preferencias de email
          </a>
        </p>
      </div>
    </div>
  `;
}

function generateReminderHTML(contest: any, daysLeft: number): string {
  const urgencyEmoji = daysLeft <= 1 ? "🚨" : daysLeft <= 3 ? "⏰" : "⏳";
  const deadline = formatColombiaDateTime(contest.submission_deadline, true);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con color sólido para compatibilidad -->
      <div style="background: #6366f1; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🪶 Letranido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">¡No te quedes sin participar!</p>
      </div>
      
      <!-- Contenido principal -->
      <div style="padding: 40px 30px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6366f1; margin: 0 0 12px 0; font-size: 24px;">${urgencyEmoji} ¡Últimos días para participar!</h2>
          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 0 auto;"></div>
        </div>
        
        <!-- Contador de urgencia -->
        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 50%, #fef7f0 100%); border: 2px solid #8b5cf6; border-radius: 16px; padding: 28px; margin: 28px 0; text-align: center; box-shadow: 0 6px 25px rgba(139, 92, 246, 0.15);">
          <div style="background: #6366f1; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 32px; font-weight: bold;">${daysLeft}</h3>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">${daysLeft === 1 ? "DÍA RESTANTE" : "DÍAS RESTANTES"}</p>
          </div>
          <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 20px; font-weight: bold;">"${contest.title}"</h3>
          <p style="color: #6366f1; margin: 0; font-size: 16px; font-weight: 600;">Cierre: ${deadline}</p>
        </div>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h4 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px;">💡 Recordatorio rápido:</h4>
          <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>${contest.min_words} - ${contest.max_words} palabras</strong></li>
            <li>Usa el prompt como inspiración (síguelo exactamente, adaptalo o reinterpretalo)</li>
            <li>¡Total libertad creativa!</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">
            ${daysLeft <= 1 ? "¡Es tu última oportunidad! No dejes que se escape." : "Las mejores historias a veces nacen de la presión del último momento. 😉"}
          </p>
          <a href="https://letranido.com/write/${contest.id}" style="background: #6366f1; color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);">
            ✍️ ${daysLeft <= 1 ? "Escribir YA" : "Escribir ahora"}
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 100%); padding: 28px 32px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e0e7ff; border-top: none;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          <strong>Letranido</strong> • Comunidad de escritura creativa<br>
          <a href="https://letranido.com" style="color: #6366f1; text-decoration: none;">letranido.com</a>
        </p>
        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
          <a href="https://letranido.com/preferences" style="color: #6b7280; text-decoration: underline;">
            Gestionar preferencias de email
          </a>
        </p>
      </div>
    </div>
  `;
}

function generateVotingHTML(contest: any, storiesCount: number): string {
  const votingDeadline = formatColombiaDateTime(contest.voting_deadline, true);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con color sólido para compatibilidad -->
      <div style="background: #6366f1; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🪶 Letranido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">¡Es hora de elegir!</p>
      </div>
      
      <!-- Contenido principal -->
      <div style="padding: 40px 30px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6366f1; margin: 0 0 12px 0; font-size: 24px;">🗳️ ¡La votación ha comenzado!</h2>
          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 0 auto;"></div>
        </div>
        
        <!-- Estadísticas del reto -->
        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 50%, #fef7f0 100%); border: 2px solid #8b5cf6; border-radius: 16px; padding: 32px; margin: 28px 0; text-align: center; box-shadow: 0 6px 25px rgba(139, 92, 246, 0.15);">
          <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">"${contest.title}"</h3>
          <div style="background: #6366f1; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0; font-size: 36px; font-weight: bold;">${storiesCount}</h4>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">historias increíbles</p>
          </div>
          <p style="color: #6366f1; margin: 0; font-size: 16px; font-weight: 600;">Votación hasta: ${votingDeadline}</p>
        </div>
        
        <!-- Instrucciones de votación -->
        <div style="background: #f1f5f9; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h4 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">📋 ¿Cómo votar?</h4>
          <div style="text-align: left;">
            <div style="display: flex; align-items: center; margin: 12px 0;">
              <span style="background: #6366f1; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">1</span>
              <span style="color: #475569;">📖 Lee la mayor cantidad posible de historias</span>
            </div>
            <div style="display: flex; align-items: center; margin: 12px 0;">
              <span style="background: #6366f1; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">2</span>
              <span style="color: #475569;">❤️ Tienes <strong>3 votos</strong>: dáselos a tus historias favoritas</span>
            </div>
            <div style="display: flex; align-items: center; margin: 12px 0;">
              <span style="background: #6366f1; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">3</span>
              <span style="color: #475569;">💬 Deja comentarios constructivos</span>
            </div>
            <div style="display: flex; align-items: center; margin: 12px 0;">
              <span style="background: #6366f1; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">4</span>
              <span style="color: #475569;">🏆 Tus votos ayudarán a elegir a los ganadores</span>
            </div>
          </div>
        </div>

        
        <div style="text-align: center; margin: 35px 0;">
          <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">Tu voto es importante y ayuda a reconocer el talento de nuestra comunidad. ¡Cada historia merece ser leída!</p>
          <a href="https://letranido.com/reto/actual" style="background: #6366f1; color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);">
            📚 Leer y votar
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 100%); padding: 28px 32px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e0e7ff; border-top: none;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          <strong>Letranido</strong> • Comunidad de escritura creativa<br>
          <a href="https://letranido.com" style="color: #6366f1; text-decoration: none;">letranido.com</a>
        </p>
        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
          <a href="https://letranido.com/preferences" style="color: #6b7280; text-decoration: underline;">
            Gestionar preferencias de email
          </a>
        </p>
      </div>
    </div>
  `;
}

function generateVotingReminderHTML(contest: any, storiesCount: number, daysLeft: number): string {
  const urgencyEmoji = daysLeft <= 1 ? "🚨" : "⏰";
  const votingDeadline = formatColombiaDateTime(contest.voting_deadline, true);
  const urgencyMessage = daysLeft <= 1 ? "¡Último día!" : `¡Últimos ${daysLeft} días!`;
  const urgencyColor = daysLeft <= 1 ? "#dc2626" : "#f59e0b";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con color sólido para compatibilidad -->
      <div style="background: ${urgencyColor}; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🪶 Letranido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${urgencyMessage}</p>
      </div>
      
      <!-- Contenido principal -->
      <div style="padding: 40px 30px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: ${urgencyColor}; margin: 0 0 12px 0; font-size: 24px;">${urgencyEmoji} ${urgencyMessage} para votar</h2>
          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, ${urgencyColor}, #8b5cf6); margin: 0 auto;"></div>
        </div>
        
        <!-- Contador de urgencia -->
        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 50%, #fef7f0 100%); border: 2px solid ${urgencyColor}; border-radius: 16px; padding: 28px; margin: 28px 0; text-align: center; box-shadow: 0 6px 25px rgba(245, 158, 11, 0.15);">
          <div style="background: ${urgencyColor}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 32px; font-weight: bold;">${daysLeft}</h3>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">${daysLeft === 1 ? "DÍA PARA VOTAR" : "DÍAS PARA VOTAR"}</p>
          </div>
          <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 20px; font-weight: bold;">"${contest.title}"</h3>
          <p style="color: ${urgencyColor}; margin: 0; font-size: 16px; font-weight: 600;">Votación cierra: ${votingDeadline}</p>
        </div>
        
        <!-- Estadísticas destacadas -->
        <div style="background: #f1f5f9; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <div style="background: #6366f1; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0; font-size: 36px; font-weight: bold;">${storiesCount}</h4>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">historias esperando tu voto</p>
          </div>
          
          <h4 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">🗳️ ¿Ya votaste?</h4>
          <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
            ${daysLeft <= 1 
              ? "¡Es tu última oportunidad! Tu voto es importante para elegir a los ganadores." 
              : "Lee las historias y dale tus 3 votos a las que más te gusten."
            }
          </p>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">
            ${daysLeft <= 1
              ? "No dejes que el tiempo se agote. ¡Cada voto cuenta!"
              : "Tu participación hace crecer nuestra comunidad. 💜"
            }
          </p>
          <a href="https://letranido.com/reto/actual" style="background: ${urgencyColor}; color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);">
            📚 ${daysLeft <= 1 ? "¡Votar AHORA!" : "Leer y votar"}
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 100%); padding: 28px 32px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e0e7ff; border-top: none;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          <strong>Letranido</strong> • Comunidad de escritura creativa<br>
          <a href="https://letranido.com" style="color: #6366f1; text-decoration: none;">letranido.com</a>
        </p>
        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
          <a href="https://letranido.com/preferences" style="color: #6b7280; text-decoration: underline;">
            Gestionar preferencias de email
          </a>
        </p>
      </div>
    </div>
  `;
}

function generateResultsHTML(contest: any): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con color sólido para compatibilidad -->
      <div style="background: #6366f1; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🪶 Letranido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">¡Los resultados están aquí!</p>
      </div>
      
      <!-- Contenido principal -->
      <div style="padding: 40px 30px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6366f1; margin: 0 0 12px 0; font-size: 24px;">🏆 ¡Los resultados ya están listos!</h2>
          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 0 auto;"></div>
        </div>
        
        <!-- Título del reto -->
        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 50%, #fef7f0 100%); border: 2px solid #ec4899; border-radius: 16px; padding: 32px; margin: 28px 0; text-align: center; box-shadow: 0 6px 25px rgba(236, 72, 153, 0.15);">
          <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 22px; font-weight: bold;">"${contest.title}"</h3>
          <p style="color: #6366f1; margin: 0; font-size: 16px; font-weight: 600;">¡Reto finalizado con éxito!</p>
        </div>
        
        <!-- Felicitación -->
        <div style="background: #f1f5f9; border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
          <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">¡Felicitaciones a todos los participantes!</h3>
          <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            Cada historia aportó algo único y especial a nuestra comunidad. 
            <strong>¡Descubre quiénes fueron los ganadores!</strong>
          </p>
          <p style="color: #6366f1; margin: 0; font-size: 14px; font-style: italic;">
            "En Letranido, todos los escritores son ganadores" ✨
          </p>
        </div>
        
        <!-- Call to action -->
        <div style="text-align: center; margin: 35px 0;">
          <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">¡No te quedes con la curiosidad! Ve los resultados completos y celebra con nosotros.</p>
          <a href="https://letranido.com/#winners-section" style="background: #6366f1; color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);">
            🏆 Ver ganadores del podio
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          <strong>Letranido</strong> • Comunidad de escritura creativa<br>
          <a href="https://letranido.com" style="color: #6366f1; text-decoration: none;">letranido.com</a>
        </p>
        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
          ¡Gracias por hacer de Letranido una comunidad increíble! 💜<br>
          <a href="https://letranido.com/preferences" style="color: #6b7280; text-decoration: underline;">
            Gestionar preferencias de email
          </a>
        </p>
      </div>
    </div>
  `;
}

function generateManualEmailHTML(subject: string, content: string, emailType: string): string {
  // Determinar el emoji y color según el tipo
  let headerEmoji = "📧";
  let headerColor = "#6366f1";
  let headerText = "Letranido";
  
  if (emailType === "manual_regular") {
    headerEmoji = "📰";
    headerColor = "#6366f1";
    headerText = "Letranido";
  } else if (emailType === "manual_essential") {
    headerEmoji = "🛡️";
    headerColor = "#dc2626";
    headerText = "Comunicación Importante";
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con gradiente de marca -->
      <div style="background: linear-gradient(135deg, ${headerColor} 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${headerEmoji} Letranido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${headerText}</p>
      </div>
      
      <!-- Contenido principal -->
      <div style="padding: 40px 30px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #1f2937; margin: 0 0 12px 0; font-size: 24px;">${subject}</h2>
          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, ${headerColor}, #8b5cf6); margin: 0 auto;"></div>
        </div>
        
        <!-- Contenido del email -->
        <div style="color: #374151; line-height: 1.6; font-size: 16px;">
          ${content}
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 100%); padding: 28px 32px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e0e7ff; border-top: none;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          <strong>Letranido</strong> • Comunidad de escritura creativa<br>
          <a href="https://letranido.com" style="color: #6366f1; text-decoration: none;">letranido.com</a>
        </p>
        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
          <a href="https://letranido.com/preferences" style="color: #6b7280; text-decoration: underline;">
            Gestionar preferencias de email
          </a>
        </p>
      </div>
    </div>
  `;
}

// Función para manejar suscripción de newsletter con deduplicación
async function handleNewsletterSubscription(supabaseClient: any, email: string): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  try {
    // Validación básica
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
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`📧 Procesando suscripción para: ${normalizedEmail}`);

    // 1. Verificar si ya existe un usuario registrado con este email
    const { data: existingUser, error: userError } = await supabaseClient
      .from("user_profiles")
      .select("id, email, email_notifications")
      .eq("email", normalizedEmail)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error checking existing user:", userError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error verificando usuario existente"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // 2. Si existe usuario registrado, actualizar sus preferencias
    if (existingUser) {
      console.log(`👤 Usuario existente encontrado: ${existingUser.id}, email_notifications: ${existingUser.email_notifications}`);

      if (existingUser.email_notifications) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Ya estás suscrito a las notificaciones de retos en tu cuenta",
            isNewSubscription: false
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Activar notificaciones en su perfil
      console.log(`📝 Activando newsletter para usuario: ${existingUser.id}`);
      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update({ email_notifications: true })
        .eq("id", existingUser.id);

      if (updateError) {
        console.error("Error updating user preferences:", updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Error activando notificaciones: ${updateError.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log(`✅ Newsletter activado para usuario existente: ${normalizedEmail}`);
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
      );
    }

    // 3. Verificar si ya existe en newsletter_subscribers
    const { data: existingSubscriber, error: subscriberError } = await supabaseClient
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", normalizedEmail)
      .single();

    if (subscriberError && subscriberError.code !== "PGRST116") {
      console.error("Error checking existing subscriber:", subscriberError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Error verificando suscripción existente" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 4. Si ya está suscrito pero inactivo, reactivar
    if (existingSubscriber && !existingSubscriber.is_active) {
      const { error: reactivateError } = await supabaseClient
        .from("newsletter_subscribers")
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq("email", normalizedEmail);

      if (reactivateError) {
        console.error("Error reactivating subscription:", reactivateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Error reactivando suscripción" 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log(`✅ Suscripción reactivada: ${normalizedEmail}`);
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
      );
    }

    // 5. Si ya está suscrito y activo
    if (existingSubscriber && existingSubscriber.is_active) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Ya estás suscrito a las notificaciones de retos",
          isNewSubscription: false 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 6. Crear nueva suscripción
    const { error: insertError } = await supabaseClient
      .from("newsletter_subscribers")
      .insert({
        email: normalizedEmail,
        source: "landing_page",
        is_active: true,
        subscribed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error("Error creating subscription:", insertError);
      
      if (insertError.code === "23505") { // Duplicate key
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
        );
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
      );
    }

    console.log(`✅ Nueva suscripción creada: ${normalizedEmail}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Suscripción exitosa. Te notificaremos cuando inicie el próximo reto",
        isNewSubscription: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error inesperado en suscripción:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Error inesperado. Inténtalo de nuevo en unos minutos" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}
