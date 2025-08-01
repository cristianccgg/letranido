// utils/fix-badges.js - Función de emergencia para asignar badges faltantes
import { supabase } from '../lib/supabase';

export const fixWinnerBadges = async () => {
  try {
    console.log('🚀 Iniciando corrección de badges de ganadores...');

    // 1. Nota: La función award_specific_badge debe actualizarse manualmente en la base de datos
    console.log('ℹ️ Asegúrate de que la función award_specific_badge incluya contest_winner_veteran');

    // 2. Obtener el concurso cerrado más reciente
    const { data: closedContest, error: contestError } = await supabase
      .from('contests')
      .select('id')
      .eq('status', 'results')
      .order('finalized_at', { ascending: false })
      .limit(1)
      .single();

    if (contestError || !closedContest) {
      throw new Error('No se encontró concurso cerrado: ' + contestError?.message);
    }

    console.log('📝 Concurso cerrado encontrado:', closedContest.id);

    // 3. Obtener ganadores del concurso (sin join por limitaciones de Supabase)
    const { data: winnerStories, error: winnersError } = await supabase
      .from('stories')
      .select('user_id, title, likes_count')
      .eq('contest_id', closedContest.id)
      .eq('is_winner', true)
      .order('likes_count', { ascending: false });

    if (winnersError) {
      throw new Error('Error obteniendo ganadores: ' + winnersError.message);
    }

    console.log('🏆 Historias ganadoras encontradas:', winnerStories.length);

    // 4. Obtener datos de usuarios por separado
    const userIds = winnerStories.map(story => story.user_id);
    const { data: userProfiles, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, display_name, wins_count')
      .in('id', userIds);

    if (usersError) {
      throw new Error('Error obteniendo perfiles de usuario: ' + usersError.message);
    }

    // 5. Combinar datos
    const winners = winnerStories.map(story => ({
      ...story,
      user_profile: userProfiles.find(profile => profile.id === story.user_id)
    }));

    // 6. Asignar badges
    for (let i = 0; i < winners.length && i < 3; i++) {
      const winner = winners[i];
      const position = i + 1;
      
      console.log(`🎖️ Procesando ${winner.user_profile?.display_name || 'Usuario'} (posición ${position})`);

      // Badge según posición
      const badgeType = position === 1 ? 'contest_winner' : 'contest_finalist';
      
      const { error: badgeError } = await supabase.rpc('award_specific_badge', {
        target_user_id: winner.user_id,
        badge_type: badgeType,
        contest_id: closedContest.id
      });

      if (badgeError) {
        console.error(`Error asignando badge ${badgeType}:`, badgeError);
      } else {
        console.log(`✅ Badge ${badgeType} asignado a ${winner.user_profile?.display_name}`);
      }

      // Badge veterano si tiene 2+ victorias
      if (winner.user_profile?.wins_count >= 2) {
        const { error: veteranError } = await supabase.rpc('award_specific_badge', {
          target_user_id: winner.user_id,
          badge_type: 'contest_winner_veteran',
          contest_id: closedContest.id
        });

        if (veteranError) {
          console.error(`Error asignando badge veterano:`, veteranError);
        } else {
          console.log(`🏆 Badge veterano asignado a ${winner.user_profile?.display_name}`);
        }
      }
    }

    // 7. Verificar resultados
    const { data: verification, error: verifyError } = await supabase
      .from('user_badges')
      .select('user_id, badge_id, earned_at, metadata')
      .in('badge_id', ['contest_winner', 'contest_finalist', 'contest_winner_veteran'])
      .in('user_id', userIds);

    if (!verifyError) {
      console.log('🔍 Badges verificados:', verification);
    }

    return {
      success: true,
      message: `Badges asignados correctamente a ${winners.length} ganadores`,
      winners: winners.map(w => w.user_profile?.display_name || 'Usuario')
    };

  } catch (error) {
    console.error('💥 Error en corrección de badges:', error);
    return {
      success: false,
      error: error.message
    };
  }
};