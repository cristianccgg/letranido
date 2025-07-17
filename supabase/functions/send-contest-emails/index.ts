// supabase/functions/send-contest-emails/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  emailType:
    | "new_contest"
    | "submission_reminder"
    | "voting_started"
    | "results"
    | "manual_general"
    | "manual_newsletter"
    | "manual_essential"
    | "newsletter_subscription"
    | "unsubscribe_user";
  contestId?: string;
  // Para suscripción de newsletter
  email?: string;
  // Para emails manuales
  subject?: string;
  htmlContent?: string;
  textContent?: string;
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
    const { emailType, contestId, subject, htmlContent, textContent, email }: EmailRequest = await req.json();
    console.log(
      `📧 Procesando: ${emailType}${contestId ? ` para concurso: ${contestId}` : ''}${email ? ` para email: ${email}` : ''}`
    );

    // Handle newsletter subscription separately
    if (emailType === "newsletter_subscription") {
      return await handleNewsletterSubscription(supabaseClient, email);
    }

    // Handle user unsubscribe separately
    if (emailType === "unsubscribe_user") {
      return await handleUserUnsubscribe(supabaseClient, email);
    }

    // Get contest data (solo para emails de concurso)
    let contest;
    const isContestEmail = ["new_contest", "submission_reminder", "voting_started", "results"].includes(emailType);
    
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
        throw new Error("No se encontró concurso");
      }
    }

    // Get users for email based on notification type
    let users, usersError;
    
    // Use the new granular notification system
    if (emailType === "new_contest" || emailType === "submission_reminder" || emailType === "voting_started" || emailType === "results") {
      // Contest-related emails go to BOTH registered users AND newsletter subscribers
      console.log("📧 Obteniendo usuarios registrados con contest_notifications...");
      const { data: registeredUsers, error: registeredError } = await supabaseClient
        .rpc("get_contest_email_recipients");
      
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
        // Combinar ambas listas y eliminar duplicados por email
        const allUsers = [...(registeredUsers || [])];
        const newsletterEmails = new Set(registeredUsers?.map(u => u.email) || []);
        
        // Agregar newsletter subscribers que no estén ya registrados
        (newsletterUsers || []).forEach(subscriber => {
          if (!newsletterEmails.has(subscriber.email)) {
            allUsers.push({
              user_id: null, // No tienen user_id porque no están registrados
              email: subscriber.email,
              display_name: subscriber.email.split('@')[0], // Usar parte del email como nombre
              created_at: subscriber.created_at
            });
          }
        });
        
        users = allUsers;
        console.log(`📧 Combined: ${registeredUsers?.length || 0} registered users + ${newsletterUsers?.length || 0} newsletter subscribers = ${users.length} total recipients`);
      }
    } else if (emailType === "manual_essential") {
      // Essential emails go to all users with valid email
      const { data, error } = await supabaseClient
        .rpc("get_essential_email_recipients");
      users = data;
      usersError = error;
    } else {
      // General emails and newsletters use general_notifications
      const { data, error } = await supabaseClient
        .rpc("get_general_email_recipients");
      users = data;
      usersError = error;
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

    // Prepare email content based on type
    let emailData;
    switch (emailType) {
      case "new_contest":
        emailData = {
          subject: `🎯 Nuevo concurso disponible: "${contest.title}"`,
          html: generateNewContestHTML(contest),
          text: `Nuevo concurso disponible: "${contest.title}". Visita https://letranido.com/write/${contest.id} para participar.`,
        };
        break;

      case "submission_reminder":
        const daysLeft = Math.ceil(
          (new Date(contest.submission_deadline).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );
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
          text: `La votación para "${contest.title}" ha comenzado. ${storiesCount || 0} historias esperan tu voto. Visita https://letranido.com/contest/current`,
        };
        break;

      case "results":
        emailData = {
          subject: `🏆 ¡Resultados del concurso "${contest.title}"!`,
          html: generateResultsHTML(contest),
          text: `Resultados del concurso "${contest.title}" disponibles. Visita https://letranido.com/contest/current`,
        };
        break;

      case "manual_general":
      case "manual_newsletter":
      case "manual_essential":
        // Para emails manuales, usar el contenido proporcionado
        if (!subject || !htmlContent) {
          throw new Error("Para emails manuales se requiere subject y htmlContent");
        }
        emailData = {
          subject: subject,
          html: htmlContent,
          text: textContent || subject,
        };
        break;

      default:
        throw new Error(`Tipo de email no válido: ${emailType}`);
    }

    // Send emails using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no configurada");
    }

    // In test mode, send only to admin (but not for newsletter subscriptions)
    const isTestMode = Deno.env.get("EMAIL_MODE") === "test";
    const finalRecipients = isTestMode
      ? [Deno.env.get("ADMIN_EMAIL") || "cristianccggg@gmail.com"]
      : recipients;

    console.log(
      `📧 Enviando a ${finalRecipients.length} destinatarios (modo: ${isTestMode ? "test" : "production"})`
    );
    console.log(`📧 Recipients:`, finalRecipients);
    console.log(`📧 From:`, Deno.env.get("FROM_EMAIL"));
    console.log(`📧 Subject:`, emailData.subject);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Letranido <${Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev"}>`,
        to: finalRecipients,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        reply_to: "info@letranido.com",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Email enviado:", result);

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
        data: result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Templates HTML mejorados para Letranido
function generateNewContestHTML(contest: any): string {
  const deadline = new Date(contest.submission_deadline).toLocaleDateString(
    "es-ES",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con gradiente de marca -->
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🪶 Letranido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Donde nacen las palabras</p>
      </div>
      
      <!-- Contenido principal -->
      <div style="padding: 40px 30px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #1f2937; margin: 0 0 12px 0; font-size: 24px;">🎯 ¡Nuevo concurso disponible!</h2>
          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 0 auto;"></div>
        </div>
        
        <!-- Tarjeta del concurso -->
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
          <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">¿Estás listo para el desafío? ¡Deja volar tu imaginación!</p>
          <a href="https://letranido.com/write/${contest.id}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4); transition: all 0.3s ease;">
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
            Cancelar suscripción a emails
          </a> • 
          <a href="https://letranido.com/email/preferences" style="color: #6b7280; text-decoration: underline;">
            Gestionar preferencias
          </a>
        </p>
      </div>
    </div>
  `;
}

function generateReminderHTML(contest: any, daysLeft: number): string {
  const urgencyEmoji = daysLeft <= 1 ? "🚨" : daysLeft <= 3 ? "⏰" : "⏳";
  const deadline = new Date(contest.submission_deadline).toLocaleDateString(
    "es-ES",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con gradiente de marca -->
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
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
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 32px; font-weight: bold;">${daysLeft}</h3>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${daysLeft === 1 ? "DÍA RESTANTE" : "DÍAS RESTANTES"}</p>
          </div>
          <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 20px; font-weight: bold;">"${contest.title}"</h3>
          <p style="color: #6366f1; margin: 0; font-size: 16px; font-weight: 600;">Cierre: ${deadline}</p>
        </div>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h4 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px;">💡 Recordatorio rápido:</h4>
          <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>${contest.min_words} - ${contest.max_words} palabras</strong></li>
            <li>Sigue el tema propuesto</li>
            <li>¡Deja volar tu creatividad!</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">
            ${daysLeft <= 1 ? "¡Es tu última oportunidad! No dejes que se escape." : "Las mejores historias a veces nacen de la presión del último momento. 😉"}
          </p>
          <a href="https://letranido.com/write/${contest.id}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);">
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
            Cancelar suscripción a emails
          </a> • 
          <a href="https://letranido.com/email/preferences" style="color: #6b7280; text-decoration: underline;">
            Gestionar preferencias
          </a>
        </p>
      </div>
    </div>
  `;
}

function generateVotingHTML(contest: any, storiesCount: number): string {
  const votingDeadline = new Date(contest.voting_deadline).toLocaleDateString(
    "es-ES",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con gradiente de marca -->
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🪶 Letranido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">¡Es hora de elegir!</p>
      </div>
      
      <!-- Contenido principal -->
      <div style="padding: 40px 30px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6366f1; margin: 0 0 12px 0; font-size: 24px;">🗳️ ¡La votación ha comenzado!</h2>
          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 0 auto;"></div>
        </div>
        
        <!-- Estadísticas del concurso -->
        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 50%, #fef7f0 100%); border: 2px solid #8b5cf6; border-radius: 16px; padding: 32px; margin: 28px 0; text-align: center; box-shadow: 0 6px 25px rgba(139, 92, 246, 0.15);">
          <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">"${contest.title}"</h3>
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
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
              <span style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">1</span>
              <span style="color: #475569;">📖 Lee las historias que más te llamen la atención</span>
            </div>
            <div style="display: flex; align-items: center; margin: 12px 0;">
              <span style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">2</span>
              <span style="color: #475569;">❤️ Da "like" a las que más te gusten</span>
            </div>
            <div style="display: flex; align-items: center; margin: 12px 0;">
              <span style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">3</span>
              <span style="color: #475569;">💬 Deja comentarios constructivos (opcional)</span>
            </div>
            <div style="display: flex; align-items: center; margin: 12px 0;">
              <span style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">4</span>
              <span style="color: #475569;">🏆 Ayuda a elegir a los ganadores</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">Tu voto es importante y ayuda a reconocer el talento de nuestra comunidad. ¡Cada historia merece ser leída!</p>
          <a href="https://letranido.com/contest/current" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);">
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
            Cancelar suscripción a emails
          </a> • 
          <a href="https://letranido.com/email/preferences" style="color: #6b7280; text-decoration: underline;">
            Gestionar preferencias
          </a>
        </p>
      </div>
    </div>
  `;
}

function generateResultsHTML(contest: any): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <!-- Header con gradiente de marca -->
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🪶 Letranido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">¡Los resultados están aquí!</p>
      </div>
      
      <!-- Contenido principal -->
      <div style="padding: 40px 30px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6366f1; margin: 0 0 12px 0; font-size: 24px;">🏆 ¡Los resultados ya están listos!</h2>
          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 0 auto;"></div>
        </div>
        
        <!-- Título del concurso -->
        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #fdf4ff 50%, #fef7f0 100%); border: 2px solid #ec4899; border-radius: 16px; padding: 32px; margin: 28px 0; text-align: center; box-shadow: 0 6px 25px rgba(236, 72, 153, 0.15);">
          <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 22px; font-weight: bold;">"${contest.title}"</h3>
          <p style="color: #6366f1; margin: 0; font-size: 16px; font-weight: 600;">¡Concurso finalizado con éxito!</p>
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
          <a href="https://letranido.com/contest/current" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);">
            🏆 Ver resultados completos
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
          ¡Gracias por hacer de Letranido una comunidad increíble! 💜
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
      .select("id, email, newsletter_contests")
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
      console.log(`👤 Usuario existente encontrado: ${existingUser.id}, newsletter_contests: ${existingUser.newsletter_contests}`);
      
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
        );
      }

      // Activar notificaciones en su perfil
      console.log(`📝 Activando newsletter para usuario: ${existingUser.id}`);
      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update({ newsletter_contests: true })
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
          message: "Ya estás suscrito a las notificaciones de concursos",
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
        message: "Suscripción exitosa. Te notificaremos cuando inicie el próximo concurso",
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
