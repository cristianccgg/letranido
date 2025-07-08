// hooks/useContestFinalization.js - VERSIÓN CORREGIDA
import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

export const useContestFinalization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const { queueBadgeNotification } = useAuthStore();

  // Definición de badges
  const BADGE_DEFINITIONS = {
    contest_winner: {
      id: "contest_winner",
      name: "Ganador",
      description: "Ganó un concurso mensual",
      icon: "🏆",
      rarity: "epic",
      category: "contest",
    },
    contest_second: {
      id: "contest_second",
      name: "Segundo Lugar",
      description: "Obtuvo el segundo lugar en un concurso",
      icon: "🥈",
      rarity: "rare",
      category: "contest",
    },
    contest_third: {
      id: "contest_third",
      name: "Tercer Lugar",
      description: "Obtuvo el tercer lugar en un concurso",
      icon: "🥉",
      rarity: "rare",
      category: "contest",
    },
  };

  // Función para otorgar badges
  const awardBadge = useCallback(async (badgeId, userId, extraData = {}) => {
    console.log(`\n🎯 INICIANDO awardBadge:`);
    console.log(`   Badge ID: ${badgeId}`);
    console.log(`   User ID: ${userId}`);

    if (!userId || !BADGE_DEFINITIONS[badgeId]) {
      console.error(
        `❌ Datos inválidos: userId=${userId}, badgeExists=${!!BADGE_DEFINITIONS[
          badgeId
        ]}`
      );
      return { success: false, error: "Datos inválidos" };
    }

    try {
      // VERIFICAR PRIMERO que el usuario existe
      console.log(`🔍 Verificando que el usuario existe...`);
      const { data: userCheck, error: userCheckError } = await supabase
        .from("user_profiles")
        .select("id, display_name")
        .eq("id", userId)
        .single();

      if (userCheckError || !userCheck) {
        console.error(`❌ Usuario NO EXISTE en user_profiles:`, userCheckError);
        return {
          success: false,
          error: `Usuario ${userId} no encontrado en user_profiles`,
        };
      }

      console.log(
        `✅ Usuario existe: ${userCheck.display_name} (${userCheck.id})`
      );

      console.log(`🔍 Obteniendo badges actuales del usuario...`);
      const { data: currentProfile, error: fetchError } = await supabase
        .from("user_profiles")
        .select("badges")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("❌ Error fetching user profile:", fetchError);
        throw fetchError;
      }

      console.log(`📦 Profile encontrado:`, currentProfile);

      const currentBadges = currentProfile?.badges || [];
      const badgeExists = currentBadges.some((badge) => badge.id === badgeId);

      if (badgeExists) {
        console.log(`⚠️ Usuario ya tiene el badge ${badgeId}`);
        return { success: true, alreadyExists: true };
      }

      const badgeDefinition = BADGE_DEFINITIONS[badgeId];
      const newBadge = {
        ...badgeDefinition,
        earnedAt: new Date().toISOString(),
        ...extraData,
      };

      console.log(`🆕 Creando nuevo badge:`, newBadge);

      const updatedBadges = [...currentBadges, newBadge];
      console.log(
        `💾 Badges a guardar (${updatedBadges.length}):`,
        updatedBadges
      );

      // USAR UPDATE con SELECT - CON RETRY
      let updateResult, updateError;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        console.log(
          `🚀 Intento ${
            retryCount + 1
          }/${maxRetries} - Ejecutando UPDATE para usuario ${userId}...`
        );

        const result = await supabase
          .from("user_profiles")
          .update({ badges: updatedBadges })
          .eq("id", userId)
          .select();

        updateResult = result.data;
        updateError = result.error;

        if (updateError) {
          console.error(`❌ Error en intento ${retryCount + 1}:`, updateError);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(
              `⏳ Esperando ${
                retryCount * 1000
              }ms antes del siguiente intento...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, retryCount * 1000)
            );
          }
          continue;
        }

        if (updateResult && updateResult.length > 0) {
          console.log(`✅ UPDATE exitoso en intento ${retryCount + 1}`);
          break;
        } else {
          console.warn(
            `⚠️ UPDATE no afectó filas en intento ${retryCount + 1}`
          );
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(
              `⏳ Esperando ${
                retryCount * 1000
              }ms antes del siguiente intento...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, retryCount * 1000)
            );
          }
        }
      }

      console.log(`📊 Update result:`, {
        data: updateResult,
        error: updateError,
        rowsAffected: updateResult?.length || 0,
      });

      if (updateError) {
        console.error("❌ Error updating badges:", updateError);
        throw updateError;
      }

      if (!updateResult || updateResult.length === 0) {
        console.error(`❌ NO SE ACTUALIZÓ NINGUNA FILA para usuario ${userId}`);
        throw new Error(
          `No se pudo actualizar el usuario ${userId} - posiblemente no existe`
        );
      }

      console.log(
        `✅ Update exitoso, ${updateResult.length} fila(s) afectada(s)`
      );

      // VERIFICACIÓN ADICIONAL
      const { data: verificationProfile, error: verifyError } = await supabase
        .from("user_profiles")
        .select("badges")
        .eq("id", userId)
        .single();

      if (verifyError) {
        console.error("❌ Error en verificación:", verifyError);
      } else {
        const finalBadgeCount = verificationProfile.badges?.length || 0;
        const hasBadge = verificationProfile.badges?.some(
          (b) => b.id === badgeId
        );
        console.log(`🔍 VERIFICACIÓN FINAL:`);
        console.log(`   - Usuario ahora tiene ${finalBadgeCount} badges`);
        console.log(`   - Badge ${badgeId} existe: ${hasBadge}`);

        if (!hasBadge) {
          console.error(`❌ FALLO CRÍTICO: Badge no se guardó correctamente`);
          throw new Error(
            `Badge ${badgeId} no se guardó para usuario ${userId}`
          );
        }
      }

      console.log(`✅ Badge ${badgeId} otorgado exitosamente a ${userId}`);
      return {
        success: true,
        badge: newBadge,
        isNew: true,
      };
    } catch (err) {
      console.error(`💥 Error otorgando badge ${badgeId} a ${userId}:`, err);
      return {
        success: false,
        error: err.message || "Error al otorgar badge",
      };
    }
  }, []);

  // Función para vista previa (SIN JOIN)
  const previewWinners = useCallback(async (contestId) => {
    try {
      setError(null);
      console.log("👀 Obteniendo vista previa para concurso:", contestId);

      // 1. Obtener historias SIN JOIN
      const { data: stories, error: storiesError } = await supabase
        .from("stories")
        .select("id, title, user_id, likes_count, created_at, word_count")
        .eq("contest_id", contestId)
        .order("likes_count", { ascending: false })
        .order("created_at", { ascending: true })
        .order("word_count", { ascending: false })
        .order("title", { ascending: true })
        .limit(10);

      if (storiesError) {
        console.error("Error obteniendo historias:", storiesError);
        throw storiesError;
      }

      if (!stories || stories.length === 0) {
        console.log("ℹ️ No hay historias en este concurso");
        return { success: true, winners: [] };
      }

      // 2. Obtener usuarios por separado
      const userIds = [...new Set(stories.map((story) => story.user_id))];
      console.log("👥 Obteniendo datos de usuarios:", userIds);

      const { data: userProfiles, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, display_name")
        .in("id", userIds);

      if (usersError) {
        console.warn("⚠️ Error obteniendo perfiles de usuario:", usersError);
        // Continuar sin perfiles detallados
      }

      // 3. Combinar datos manualmente - SOLO display_name
      const storiesWithUsers = stories.map((story) => {
        const userProfile = userProfiles?.find(
          (profile) => profile.id === story.user_id
        );
        return {
          ...story,
          user_profiles: userProfile
            ? {
                id: userProfile.id,
                display_name: userProfile.display_name || "Usuario",
              }
            : {
                id: story.user_id,
                display_name: "Usuario",
              },
        };
      });

      console.log(
        `✅ Vista previa obtenida: ${storiesWithUsers.length} historias`
      );
      console.log(
        "🏆 Top 3:",
        storiesWithUsers.slice(0, 3).map((s) => ({
          titulo: s.title,
          autor: s.user_profiles.display_name,
          likes: s.likes_count,
        }))
      );

      return {
        success: true,
        winners: storiesWithUsers,
      };
    } catch (err) {
      const errorMessage = err.message || "Error al obtener vista previa";
      console.error("💥 Error en vista previa:", errorMessage);
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  // Función para finalizar concurso (SIN JOIN)
  const finalizeContest = useCallback(
    async (contestId) => {
      if (!contestId) {
        return { success: false, error: "ID de concurso requerido" };
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🏁 Iniciando finalización del concurso:", contestId);

        // 1. Verificar concurso
        const { data: contest, error: contestError } = await supabase
          .from("contests")
          .select("*")
          .eq("id", contestId)
          .single();

        if (contestError) {
          throw new Error("Concurso no encontrado");
        }

        if (contest.status === "results") {
          return { success: false, error: "Este concurso ya fue finalizado" };
        }

        console.log("📋 Concurso encontrado:", contest.title);

        // 2. Obtener historias SIN JOIN
        const { data: stories, error: storiesError } = await supabase
          .from("stories")
          .select("id, title, user_id, likes_count, created_at, word_count")
          .eq("contest_id", contestId)
          .order("likes_count", { ascending: false }) // 1º criterio: Más likes
          .order("created_at", { ascending: true }) // 2º criterio: Más antiguo (en empates)
          .order("word_count", { ascending: false }) // 3º criterio: Más palabras (calidad)
          .order("title", { ascending: true });

        if (storiesError) {
          console.error("Error obteniendo historias:", storiesError);
          throw storiesError;
        }

        if (!stories || stories.length === 0) {
          return {
            success: false,
            error: "No hay historias en este concurso para finalizar",
          };
        }

        // 3. Obtener usuarios por separado
        const userIds = [...new Set(stories.map((story) => story.user_id))];
        const { data: userProfiles } = await supabase
          .from("user_profiles")
          .select("id, display_name")
          .in("id", userIds);

        // 4. Combinar datos - SOLO display_name
        const storiesWithUsers = stories.map((story) => {
          const userProfile = userProfiles?.find(
            (profile) => profile.id === story.user_id
          );
          return {
            ...story,
            user_profiles: userProfile
              ? {
                  id: userProfile.id,
                  display_name: userProfile.display_name || "Usuario",
                }
              : {
                  id: story.user_id,
                  display_name: "Usuario",
                },
          };
        });

        console.log(`📊 Procesando ${storiesWithUsers.length} historias`);

        // NUEVA FUNCIÓN para procesar ranking único
        const processUniqueRanking = (stories) => {
          console.log("🏆 PROCESANDO RANKING ÚNICO (sin empates)");
          console.log("📊 Criterios de desempate:");
          console.log("   1º: Más likes");
          console.log("   2º: Historia más antigua (quien escribió primero)");
          console.log("   3º: Historia más larga (calidad)");
          console.log("   4º: Orden alfabético por título");

          console.log("\n📈 Ranking final:");

          const top3 = stories.slice(0, 3);

          top3.forEach((story, index) => {
            const position = index + 1;
            const positionEmoji =
              position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉";

            console.log(
              `${positionEmoji} ${position}º lugar: ${
                story.user_profiles?.display_name || "Usuario"
              }`
            );
            console.log(`   📖 Historia: "${story.title}"`);
            console.log(`   ❤️ Likes: ${story.likes_count}`);
            console.log(
              `   📅 Escrita: ${new Date(story.created_at).toLocaleDateString(
                "es-ES"
              )}`
            );
            console.log(`   📝 Palabras: ${story.word_count || 0}`);
            console.log(`   👤 User ID: ${story.user_id}`);
            console.log("");
          });

          return {
            first: top3[0] || null,
            second: top3[1] || null,
            third: top3[2] || null,
            allRanked: top3,
          };
        };

        const ranking = processUniqueRanking(storiesWithUsers);

        if (!ranking.first) {
          return {
            success: false,
            error: "No hay suficientes historias para crear un ranking",
          };
        }

        // 5. Actualizar status del concurso
        const { error: updateError } = await supabase
          .from("contests")
          .update({
            status: "results",
            finalized_at: new Date().toISOString(),
          })
          .eq("id", contestId);

        if (updateError) {
          console.error("Error actualizando concurso:", updateError);
          throw updateError;
        }

        console.log("✅ Status del concurso actualizado a 'results'");

        // 6. ASIGNAR badges con lógica única y clara
        console.log("🎖️ INICIANDO ASIGNACIÓN DE BADGES");

        const badgeResults = [];
        const badgeAssignments = [
          {
            story: ranking.first,
            badgeId: "contest_winner",
            position: 1,
            name: "Ganador",
          },
          {
            story: ranking.second,
            badgeId: "contest_second",
            position: 2,
            name: "Segundo Lugar",
          },
          {
            story: ranking.third,
            badgeId: "contest_third",
            position: 3,
            name: "Tercer Lugar",
          },
        ];

        for (const assignment of badgeAssignments) {
          if (!assignment.story) {
            console.log(`⚠️ No hay historia para ${assignment.name}`);
            continue;
          }

          const story = assignment.story;
          const userName = story.user_profiles.display_name;
          const positionEmoji =
            assignment.position === 1
              ? "🥇"
              : assignment.position === 2
              ? "🥈"
              : "🥉";

          console.log(
            `\n${positionEmoji} ===== ASIGNANDO ${assignment.name.toUpperCase()} =====`
          );
          console.log(`👤 Usuario: ${userName}`);
          console.log(`📖 Historia: "${story.title}"`);
          console.log(`❤️ Likes: ${story.likes_count}`);
          console.log(`🏷️ Badge: ${assignment.badgeId}`);
          console.log(`🆔 User ID: ${story.user_id}`);

          try {
            const result = await awardBadge(assignment.badgeId, story.user_id, {
              contestId: contestId,
              contestTitle: contest.title,
              month: contest.month,
              position: assignment.position,
              likes: story.likes_count,
              finalizedAt: new Date().toISOString(),
              ranking: assignment.position,
            });

            console.log(`📋 Resultado:`, {
              success: result.success,
              isNew: result.isNew,
              alreadyExists: result.alreadyExists,
              error: result.error || "ninguno",
            });

            if (result.success && result.isNew) {
              badgeResults.push({
                position: assignment.position,
                userId: story.user_id,
                userName: userName,
                badge: result.badge,
                storyTitle: story.title,
                likes: story.likes_count,
              });

              try {
                queueBadgeNotification(result.badge);
                console.log(`🎉 ✅ Notificación encolada para ${userName}`);
              } catch (notifError) {
                console.error(
                  `❌ Error en notificación para ${userName}:`,
                  notifError
                );
              }
            } else if (result.alreadyExists) {
              console.log(`ℹ️ ${userName} ya tenía este badge`);
            } else {
              console.error(
                `❌ FALLO asignando badge a ${userName}:`,
                result.error
              );
            }

            // AGREGAR DELAY entre asignaciones para evitar conflictos
            if (assignment.position < 3) {
              console.log(`⏳ Esperando 500ms antes del siguiente badge...`);
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error(`💥 EXCEPCIÓN asignando badge a ${userName}:`, error);
          }
        }

        console.log("\n🏁 ===== RESUMEN FINAL =====");
        console.log(
          `✅ Badges asignados exitosamente: ${badgeResults.length} de 3`
        );
        console.log(
          "🎖️ Detalles:",
          badgeResults.map((br) => ({
            [`${br.position}º`]: br.userName,
            badge: br.badge.name,
            likes: br.likes,
          }))
        );

        if (badgeResults.length < 3) {
          console.warn(
            `⚠️ ATENCIÓN: Solo se asignaron ${badgeResults.length} badges de 3 esperados`
          );
        }

        const finalResult = {
          success: true,
          message: `Concurso "${contest.title}" finalizado exitosamente. ${badgeResults.length} badges otorgados.`,
          contest: {
            id: contestId,
            title: contest.title,
            month: contest.month,
          },
          winners: {
            first: storiesWithUsers[0]
              ? {
                  userId: storiesWithUsers[0].user_id,
                  userName: storiesWithUsers[0].user_profiles.display_name,
                  storyTitle: storiesWithUsers[0].title,
                  likes: storiesWithUsers[0].likes_count,
                }
              : null,
            second: storiesWithUsers[1]
              ? {
                  userId: storiesWithUsers[1].user_id,
                  userName: storiesWithUsers[1].user_profiles.display_name,
                  storyTitle: storiesWithUsers[1].title,
                  likes: storiesWithUsers[1].likes_count,
                }
              : null,
            third: storiesWithUsers[2]
              ? {
                  userId: storiesWithUsers[2].user_id,
                  userName: storiesWithUsers[2].user_profiles.display_name,
                  storyTitle: storiesWithUsers[2].title,
                  likes: storiesWithUsers[2].likes_count,
                }
              : null,
          },
          badgesAwarded: badgeResults,
          totalParticipants: storiesWithUsers.length,
          finalizedAt: new Date().toISOString(),
        };

        console.log("🎊 Finalización completada exitosamente!");

        setLastResult(finalResult);
        return finalResult;
      } catch (err) {
        console.error("💥 Error durante la finalización:", err);
        const errorMessage =
          err.message || "Error inesperado al finalizar concurso";
        setError(errorMessage);

        const errorResult = { success: false, error: errorMessage };
        setLastResult(errorResult);
        return errorResult;
      } finally {
        setLoading(false);
      }
    },
    [awardBadge, queueBadgeNotification]
  );

  const clearLastResult = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    lastResult,
    finalizeContest,
    previewWinners,
    clearLastResult,
  };
};
