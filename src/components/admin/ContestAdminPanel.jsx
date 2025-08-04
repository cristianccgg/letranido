import React, { useState, useEffect } from "react";
import {
  Trophy,
  Settings,
  Eye,
  Clock,
  Users,
  Award,
  AlertTriangle,
  Check,
  X,
  Crown,
  Medal,
  Star,
  Plus,
  Edit,
  Calendar,
  Save,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  TestTube,
  Zap,
  Shield,
  Trash2,
} from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import { useContestFinalization } from "../../hooks/useContestFinalization";
import { supabase } from "../../lib/supabase";
import DataCleanupPanel from "./DataCleanupPanel";
import ReportsPanel from "./ReportsPanel";
import EmailManager from "./EmailManager";
import MaintenanceControl from "./MaintenanceControl";

const ContestAdminPanel = () => {
  const [selectedContest, setSelectedContest] = useState(null);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [winners, setWinners] = useState(null);
  const [finalizationResult, setFinalizationResult] = useState(null);
  const [editingContest, setEditingContest] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [simulatedWinners, setSimulatedWinners] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null); // ID del concurso que se está eliminando
  const [finalizingContestId, setFinalizingContestId] = useState(null); // ID del concurso que se está finalizando

  // Función para determinar si un concurso es de prueba
  const isTestContest = (contest) => {
    if (!contest?.title) return false;
    const title = contest.title.toLowerCase();
    return title.includes('test') || title.includes('prueba') || title.includes('demo');
  };

  // Función para ordenar concursos según prioridad de cola
  const sortContestsByPriority = (contests) => {
    if (!contests || contests.length === 0) return [];
    
    const now = new Date();
    
    // Separar concursos finalizados y activos
    const finalized = contests.filter(c => c.finalized_at !== null);
    const active = contests.filter(c => c.finalized_at === null);
    
    // Separar concursos activos en prueba y producción
    const testContests = active.filter(c => isTestContest(c));
    const productionContests = active.filter(c => !isTestContest(c));
    
    // Ordenar cada grupo
    const sortedTest = testContests.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    const sortedProduction = productionContests.sort((a, b) => {
      const aSubmission = new Date(a.submission_deadline);
      const bSubmission = new Date(b.submission_deadline);
      return aSubmission - bSubmission; // Más cercano a empezar primero
    });
    
    const sortedFinalized = finalized.sort((a, b) => 
      new Date(b.finalized_at) - new Date(a.finalized_at)
    );
    
    // Combinar en orden de prioridad
    return [...sortedTest, ...sortedProduction, ...sortedFinalized];
  };

  // Función para obtener el estilo y label de prioridad
  const getContestPriorityInfo = (contest, index, sortedContests) => {
    const isFinalized = contest.finalized_at !== null;
    const isTest = isTestContest(contest);
    const activeContests = sortedContests.filter(c => c.finalized_at === null);
    const activeIndex = activeContests.findIndex(c => c.id === contest.id);
    
    if (isFinalized) {
      return {
        priority: null,
        className: "bg-gray-100 text-gray-600",
        label: "Finalizado"
      };
    }
    
    if (isTest) {
      return {
        priority: activeIndex === 0 ? "ACTIVO" : "PRUEBA",
        className: activeIndex === 0 ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700",
        label: activeIndex === 0 ? "🎭 ACTIVO (Prueba)" : "🎭 En Cola (Prueba)"
      };
    }
    
    if (activeIndex === 0) {
      return {
        priority: "ACTIVO",
        className: "bg-green-100 text-green-700",
        label: "🏗️ ACTIVO (Producción)"
      };
    }
    
    return {
      priority: `#${activeIndex + 1}`,
      className: "bg-blue-100 text-blue-700",
      label: `🏗️ En Cola #${activeIndex + 1}`
    };
  };

  // Usar el contexto global unificado
  const { user, isAuthenticated, contests, contestsLoading, refreshContests } =
    useGlobalApp();

  const {
    finalizeContest,
    previewWinners,
    revertFinalization,
    loading: finalizationLoading,
  } = useContestFinalization();

  // Solo mostrar a administradores
  const isAdmin = user?.is_admin || user?.email === "admin@literalab.com";

  // Form state para crear/editar concurso
  const [contestForm, setContestForm] = useState({
    title: "",
    description: "",
    category: "Ficción",
    month: "",
    min_words: 100,
    max_words: 1000,
    submission_deadline: "",
    voting_deadline: "",
    prize: "Insignia de Oro + Destacado del mes",
    status: "submission",
  });

  useEffect(() => {
    if (!contestsLoading && contests.length > 0) {
      const finalizableContest = contests.find(
        (contest) =>
          contest.status === "voting" || contest.status === "submission"
      );
      if (finalizableContest) {
        setSelectedContest(finalizableContest);
      }
    }
  }, [contests, contestsLoading]);

  // Resetear form
  const resetForm = () => {
    const now = new Date();
    const thisMonth = now.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });

    // ✅ CORREGIDO: Sugerir fechas por defecto en hora de Colombia
    const submissionEnd = new Date(now);
    submissionEnd.setDate(now.getDate() + 20); // 20 días para envíos
    submissionEnd.setHours(19, 0, 0, 0); // 7:00 PM Colombia

    const votingEnd = new Date(submissionEnd);
    votingEnd.setDate(submissionEnd.getDate() + 7); // 7 días para votación
    votingEnd.setHours(19, 0, 0, 0); // 7:00 PM Colombia

    // Función para convertir a formato datetime-local (sin zona horaria)
    const toDateTimeLocal = (date) => {
      // Para datetime-local necesitamos formato YYYY-MM-DDTHH:mm
      // pero interpretado como hora local de Colombia
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setContestForm({
      title: "",
      description: "",
      category: "Ficción",
      month: thisMonth,
      min_words: 100,
      max_words: 1000,
      submission_deadline: toDateTimeLocal(submissionEnd),
      voting_deadline: toDateTimeLocal(votingEnd),
      prize: "Insignia de Oro + Destacado del mes",
      status: "submission",
    });
  };

  // Crear nuevo concurso usando Supabase directamente
  const createContest = async (contestData) => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .insert([contestData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, contest: data };
    } catch (err) {
      console.error("Error creating contest:", err);
      return { success: false, error: err.message };
    }
  };

  // Actualizar concurso usando Supabase directamente
  const updateContest = async (contestId, updates) => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .update(updates)
        .eq("id", contestId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, contest: data };
    } catch (err) {
      console.error("Error updating contest:", err);
      return { success: false, error: err.message };
    }
  };

  // 🆕 FUNCIONES PARA CONTROL DE ESTADOS DE PRUEBA

  // Revertir finalización (deshacer badges y puntos)
  const handleRevertFinalization = async (contest) => {
    if (contest.status !== "results") {
      alert("❌ Solo se pueden revertir concursos finalizados");
      return;
    }

    const isTestContest =
      contest.title.toLowerCase().includes("test") ||
      contest.title.toLowerCase().includes("prueba");

    let confirmMessage = `¿Revertir la finalización de "${contest.title}"?`;

    if (!isTestContest) {
      confirmMessage +=
        "\n\n⚠️ ADVERTENCIA: Esto eliminará:\n• Badges otorgados a los ganadores\n• Puntos asignados\n• Marcas de ganador en historias\n\n¿Continuar?";
    } else {
      confirmMessage +=
        "\n\nEsto revertirá:\n• Badges de prueba\n• Puntos de prueba\n• Estado del concurso";
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    const result = await revertFinalization(contest.id);
    if (result.success) {
      alert("✅ Finalización revertida exitosamente");
    } else {
      alert("❌ Error revirtiendo: " + result.error);
    }
  };

  // Eliminar concurso completamente
  const deleteContest = async (contest) => {
    const isTestContest =
      contest.title.toLowerCase().includes("test") ||
      contest.title.toLowerCase().includes("prueba");

    let confirmMessage = `¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE el concurso "${contest.title}"?`;

    if (!isTestContest) {
      confirmMessage +=
        "\n\n⚠️ ADVERTENCIA: Este no parece ser un concurso de prueba. Esta acción eliminará:\n• El concurso\n• Todas sus historias\n• Todos los votos asociados\n\n¿Continuar?";
    } else {
      confirmMessage +=
        "\n\nEsto eliminará:\n• El concurso\n• Todas sus historias\n• Todos los votos asociados";
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleteLoading(contest.id);

    try {
      console.log("🗑️ Iniciando eliminación del concurso:", contest.title);

      // 1. Eliminar todos los votos de las historias del concurso
      const { data: contestStories, error: storiesError } = await supabase
        .from("stories")
        .select("id")
        .eq("contest_id", contest.id);

      if (storiesError) {
        console.warn(
          "⚠️ Error obteniendo historias para eliminar votos:",
          storiesError
        );
      }

      if (contestStories && contestStories.length > 0) {
        const storyIds = contestStories.map((s) => s.id);

        // Eliminar votos
        const { error: votesError } = await supabase
          .from("votes")
          .delete()
          .in("story_id", storyIds);

        if (votesError) {
          console.warn("⚠️ Error eliminando votos:", votesError);
        } else {
          console.log("✅ Votos eliminados:", storyIds.length, "historias");
        }
      }

      // 2. Eliminar todas las historias del concurso
      const { error: deleteStoriesError } = await supabase
        .from("stories")
        .delete()
        .eq("contest_id", contest.id);

      if (deleteStoriesError) {
        throw new Error(
          "Error eliminando historias: " + deleteStoriesError.message
        );
      }

      console.log("✅ Historias del concurso eliminadas");

      // 3. Eliminar el concurso
      const { error: deleteContestError } = await supabase
        .from("contests")
        .delete()
        .eq("id", contest.id);

      if (deleteContestError) {
        throw new Error(
          "Error eliminando concurso: " + deleteContestError.message
        );
      }

      console.log("✅ Concurso eliminado exitosamente");

      // 4. Refrescar la lista
      await refreshContests();

      alert(`✅ Concurso "${contest.title}" eliminado completamente`);
    } catch (error) {
      console.error("❌ Error eliminando concurso:", error);
      alert("❌ Error eliminando concurso: " + error.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Cambio de estado simple (sin badges)
  const changeContestStatus = async (contest, newStatus) => {
    // ✅ CORREGIDO: Usar hora de Colombia para calcular fechas
    const now = new Date();
    let updates = { status: newStatus };

    // Función helper para convertir fecha local del navegador a UTC para BD
    const toColombiaUTC = (localDate) => {
      // La fecha localDate ya está en la zona horaria del navegador
      // Solo necesitamos convertirla a UTC directamente
      return localDate.toISOString();
    };

    // Ajustar fechas según el nuevo estado
    if (newStatus === "submission") {
      const submissionEnd = new Date(now);
      submissionEnd.setDate(now.getDate() + 7);
      submissionEnd.setHours(19, 0, 0, 0); // 7:00 PM Colombia
      
      const votingEnd = new Date(submissionEnd);
      votingEnd.setDate(votingEnd.getDate() + 5);
      votingEnd.setHours(19, 0, 0, 0); // 7:00 PM Colombia

      updates.submission_deadline = toColombiaUTC(submissionEnd);
      updates.voting_deadline = toColombiaUTC(votingEnd);
    } else if (newStatus === "voting") {
      // ✅ CORREGIDO: Para test de votación, establecer fechas apropiadas
      // submission_deadline debe estar en el pasado inmediato
      const submissionPast = new Date(now.getTime() - (5 * 60 * 1000)); // 5 minutos atrás
      
      // voting_deadline debe estar en el futuro cercano para pruebas
      const votingEnd = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 horas adelante
      
      updates.submission_deadline = toColombiaUTC(submissionPast);
      updates.voting_deadline = toColombiaUTC(votingEnd);
    }

    const result = await updateContest(contest.id, updates);
    if (result.success) {
      alert(`✅ Estado cambiado a "${newStatus}"`);
      await refreshContests();
    } else {
      alert("❌ Error: " + result.error);
    }
  };

  // Simular ganadores (sin badges)
  const simulateWinners = async (contest) => {
    try {
      console.log("🎭 Simulando ganadores para:", contest.title);

      // Obtener todas las historias del concurso
      const { data: stories, error } = await supabase
        .from("stories")
        .select("*")
        .eq("contest_id", contest.id)
        .order("likes_count", { ascending: false });

      if (error) throw error;

      if (!stories || stories.length === 0) {
        alert("⚠️ No hay historias para simular ganadores");
        return;
      }

      // Obtener información de los usuarios
      const userIds = stories.map(story => story.user_id).filter(Boolean);
      const { data: userProfiles, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, display_name, email")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Combinar historias con perfiles de usuario
      const storiesWithUsers = stories.map(story => ({
        ...story,
        user_profiles: userProfiles?.find(profile => profile.id === story.user_id) || null
      }));

      const mockWinners = storiesWithUsers.slice(0, 3).map((story, index) => ({
        ...story,
        position: index + 1,
        simulatedPoints: index === 0 ? 100 : index === 1 ? 50 : 25,
      }));

      setSimulatedWinners(mockWinners);
      setSelectedContest(contest);
      setShowPreviewModal(true);

      console.log(
        "🎭 Ganadores simulados:",
        mockWinners.map((w) => w.title)
      );
    } catch (error) {
      console.error("❌ Error simulando ganadores:", error);
      alert("Error simulando ganadores: " + error.message);
    }
  };

  // Finalización REAL con badges
  const handlePreviewWinners = async (contest) => {
    setFinalizingContestId(contest.id);
    const result = await previewWinners(contest.id);
    if (result.success) {
      setWinners(result.winners);
      setSelectedContest(contest);
      setShowFinalizationModal(true);
    } else {
      alert("Error al obtener vista previa: " + result.error);
    }
    setFinalizingContestId(null);
  };

  const handleFinalizeContest = async () => {
    if (!selectedContest) return;

    setFinalizingContestId(selectedContest.id);
    const result = await finalizeContest(selectedContest.id);
    setFinalizationResult(result);

    if (result.success) {
      await refreshContests();
      setShowFinalizationModal(false);
      setSelectedContest(null);
      setWinners(null);
    }
    setFinalizingContestId(null);
  };

  // Crear nuevo concurso
  const handleCreateContest = async (e) => {
    e.preventDefault();

    if (!contestForm.title.trim() || !contestForm.description.trim()) {
      alert("Título y descripción son obligatorios");
      return;
    }

    setCreateLoading(true);
    try {
      // ✅ CORREGIDO: Solo usar columnas que existen en la tabla
      // ⚠️ IMPORTANTE: Convertir fechas a ISO con zona horaria de Colombia
      const toColombiaISO = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;
        
        // datetime-local da formato "2025-07-28T19:00" (sin zona horaria)
        // Necesitamos interpretarlo explícitamente como hora de Colombia y convertir a UTC para la BD
        
        // Crear la fecha especificando que es hora de Colombia (UTC-5)
        // Agregamos la zona horaria de Colombia para que se interprete correctamente
        const colombiaDateTime = dateTimeLocal + '-05:00'; // Formato ISO con zona horaria de Colombia
        const colombiaDate = new Date(colombiaDateTime);
        
        return colombiaDate.toISOString();
      };

      const contestData = {
        title: contestForm.title.trim(),
        description: contestForm.description.trim(),
        category: contestForm.category,
        month: contestForm.month,
        min_words: contestForm.min_words,
        max_words: contestForm.max_words,
        submission_deadline: toColombiaISO(contestForm.submission_deadline),
        voting_deadline: toColombiaISO(contestForm.voting_deadline),
        prize: contestForm.prize,
        status: contestForm.status,
        // created_at y updated_at se manejan automáticamente por la BD
      };

      const result = await createContest(contestData);

      if (result.success) {
        alert("¡Concurso creado exitosamente!");
        setShowCreateModal(false);
        resetForm();
        await refreshContests();
      } else {
        alert("Error al crear concurso: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado: " + error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Editar concurso existente
  const handleEditContest = (contest) => {
    setEditingContest(contest);

    // ✅ CORREGIDO: Convertir fechas UTC de BD a formato datetime-local de Colombia
    const utcToColombiaLocal = (utcISOString) => {
      if (!utcISOString) return "";
      
      const utcDate = new Date(utcISOString);
      // Restar 5 horas para convertir de UTC a Colombia (UTC-5)
      const colombiaOffset = 5 * 60; // 5 horas en minutos
      const colombiaDate = new Date(utcDate.getTime() - (colombiaOffset * 60 * 1000));
      
      // Formatear para datetime-local
      const year = colombiaDate.getFullYear();
      const month = String(colombiaDate.getMonth() + 1).padStart(2, '0');
      const day = String(colombiaDate.getDate()).padStart(2, '0');
      const hours = String(colombiaDate.getHours()).padStart(2, '0');
      const minutes = String(colombiaDate.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setContestForm({
      title: contest.title,
      description: contest.description,
      category: contest.category,
      month: contest.month,
      min_words: contest.min_words,
      max_words: contest.max_words,
      submission_deadline: utcToColombiaLocal(contest.submission_deadline),
      voting_deadline: utcToColombiaLocal(contest.voting_deadline),
      prize: contest.prize || "Insignia de Oro + Destacado del mes",
      status: contest.status,
    });
    setShowEditModal(true);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingContest) return;

    setUpdateLoading(true);
    try {
      // ✅ CORREGIDO: Solo usar columnas que existen en la tabla
      // ⚠️ IMPORTANTE: Convertir fechas a ISO con zona horaria de Colombia
      const toColombiaISO = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;
        
        // datetime-local da formato "2025-07-28T19:00" (sin zona horaria)
        // Necesitamos interpretarlo explícitamente como hora de Colombia y convertir a UTC para la BD
        
        // Crear la fecha especificando que es hora de Colombia (UTC-5)
        // Agregamos la zona horaria de Colombia para que se interprete correctamente
        const colombiaDateTime = dateTimeLocal + '-05:00'; // Formato ISO con zona horaria de Colombia
        const colombiaDate = new Date(colombiaDateTime);
        
        return colombiaDate.toISOString();
      };

      const updateData = {
        title: contestForm.title.trim(),
        description: contestForm.description.trim(),
        category: contestForm.category,
        month: contestForm.month,
        min_words: contestForm.min_words,
        max_words: contestForm.max_words,
        submission_deadline: toColombiaISO(contestForm.submission_deadline),
        voting_deadline: toColombiaISO(contestForm.voting_deadline),
        prize: contestForm.prize,
        status: contestForm.status,
        // updated_at se maneja automáticamente por la BD
      };

      const result = await updateContest(editingContest.id, updateData);

      if (result.success) {
        alert("¡Concurso actualizado exitosamente!");
        setShowEditModal(false);
        setEditingContest(null);
        resetForm();
        await refreshContests();
      } else {
        alert("Error al actualizar concurso: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado: " + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const categories = [
    "Ficción",
    "Drama",
    "Poesía",
    "Ensayo",
    "Humor",
    "Terror",
    "Romance",
    "Ciencia Ficción",
    "Fantasía",
    "Misterio",
  ];

  const statusOptions = [
    { value: "submission", label: "Envíos abiertos", color: "blue" },
    { value: "voting", label: "En votación", color: "green" },
    { value: "results", label: "Finalizado", color: "gray" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-gray-500 mb-4">
          <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold">Acceso requerido</h2>
          <p>Debes iniciar sesión para acceder a este panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-gray-500 mb-4">
          <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold">Acceso restringido</h2>
          <p>Solo los administradores pueden acceder a este panel.</p>
        </div>
      </div>
    );
  }

  if (contestsLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="h-8 w-8 mr-3 text-primary-600" />
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión completa de concursos con controles de prueba
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Concurso
          </button>
          <div className="text-sm text-gray-500">
            Conectado como: <span className="font-medium">{user?.name}</span>
          </div>
        </div>
      </div>

      {/* Resultado de finalización */}
      {finalizationResult && (
        <div
          className={`rounded-lg p-6 border ${
            finalizationResult.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start">
            {finalizationResult.success ? (
              <Check className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
            ) : (
              <X className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3
                className={`font-bold ${
                  finalizationResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {finalizationResult.success
                  ? "¡Concurso finalizado exitosamente!"
                  : "Error al finalizar"}
              </h3>
              <p
                className={`mt-1 ${
                  finalizationResult.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {finalizationResult.message || finalizationResult.error}
              </p>

              {finalizationResult.success &&
                finalizationResult.badgesAwarded && (
                  <div className="mt-4">
                    <h4 className="font-medium text-green-800 mb-2">
                      Badges otorgados:
                    </h4>
                    <div className="space-y-2">
                      {finalizationResult.badgesAwarded.map((award, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <span className="mr-2">
                            {award.position === 1
                              ? "🥇"
                              : award.position === 2
                              ? "🥈"
                              : "🥉"}
                          </span>
                          <span className="font-medium">{award.userName}</span>
                          <span className="mx-2">→</span>
                          <span className="text-green-700">
                            {award.badge.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <button
              onClick={() => setFinalizationResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de concursos */}
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Concursos ({contests.length})
            </h2>
            {(() => {
              const sortedContests = sortContestsByPriority(contests);
              const activeContests = sortedContests.filter(c => c.finalized_at === null);
              const testActive = activeContests.filter(c => isTestContest(c));
              const prodActive = activeContests.filter(c => !isTestContest(c));
              
              return (
                <div className="flex items-center gap-2 mt-1">
                  {testActive.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      🎭 {testActive.length} prueba{testActive.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {prodActive.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      🏗️ {prodActive.length} producción
                    </span>
                  )}
                  {activeContests.length === 0 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      Sin concursos activos
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
          <button
            onClick={() => refreshContests()}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>

        {contests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No hay concursos disponibles</p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
            >
              Crear primer concurso
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortContestsByPriority(contests).map((contest, index, sortedContests) => {
              const priorityInfo = getContestPriorityInfo(contest, index, sortedContests);
              return (
              <div
                key={contest.id}
                className={`bg-white border-2 rounded-lg p-6 hover:shadow-md transition-shadow ${
                  priorityInfo.priority === "ACTIVO" ? "border-green-400 shadow-lg" : 
                  priorityInfo.priority && priorityInfo.priority.includes("#") ? "border-blue-400" :
                  priorityInfo.priority === "PRUEBA" ? "border-yellow-400" :
                  "border-gray-200"
                } ${contest.status === "results" ? "opacity-75" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {/* Indicador de prioridad */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${priorityInfo.className}`}
                    >
                      {priorityInfo.label}
                    </span>
                    
                    {/* Estado del concurso */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        contest.status === "submission"
                          ? "bg-blue-100 text-blue-700"
                          : contest.status === "voting"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {contest.status === "submission"
                        ? "Envíos"
                        : contest.status === "voting"
                        ? "Votación"
                        : "Finalizado"}
                    </span>
                    
                    {/* Mes */}
                    <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-xs">
                      {contest.month}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditContest(contest)}
                      className="text-gray-400 hover:text-blue-600 p-1"
                      title="Editar concurso"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteContest(contest)}
                      disabled={deleteLoading === contest.id}
                      className="text-gray-400 hover:text-red-600 p-1 disabled:opacity-50"
                      title="Eliminar concurso"
                    >
                      {deleteLoading === contest.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                    {contest.status === "results" && (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {contest.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {contest.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {contest.participants_count || 0} participantes
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {contest.voting_deadline
                      ? new Date(contest.voting_deadline).toLocaleDateString(
                          "es-ES"
                        )
                      : "Sin fecha"}
                  </div>
                </div>

                {/* 🆕 CONTROLES DE PRUEBA */}
                {contest.status !== "results" && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <TestTube className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-yellow-800">
                        Controles de Prueba
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {contest.status === "submission" && (
                        <button
                          onClick={() => changeContestStatus(contest, "voting")}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          <Play className="h-3 w-3 inline mr-1" />
                          Test Votación
                        </button>
                      )}
                      {contest.status === "voting" && (
                        <button
                          onClick={() =>
                            changeContestStatus(contest, "submission")
                          }
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          <RotateCcw className="h-3 w-3 inline mr-1" />
                          Volver Envíos
                        </button>
                      )}
                      <button
                        onClick={() => simulateWinners(contest)}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      >
                        <Eye className="h-3 w-3 inline mr-1" />
                        Simular Ganadores
                      </button>
                    </div>
                  </div>
                )}

                {/* Fechas importantes y información de cola */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      <strong>Envíos hasta:</strong>{" "}
                      {contest.submission_deadline
                        ? new Date(contest.submission_deadline).toLocaleString(
                            "es-ES"
                          )
                        : "No definido"}
                    </div>
                    <div>
                      <strong>Votación hasta:</strong>{" "}
                      {contest.voting_deadline
                        ? new Date(contest.voting_deadline).toLocaleString(
                            "es-ES"
                          )
                        : "No definido"}
                    </div>
                    
                    {/* Información adicional de cola */}
                    {priorityInfo.priority === "ACTIVO" && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <strong>🎯 Concurso activo en la aplicación</strong>
                        </div>
                      </div>
                    )}
                    
                    {priorityInfo.priority && priorityInfo.priority.includes("#") && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center text-blue-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <strong>⏳ Posición en cola: {priorityInfo.priority}</strong>
                        </div>
                      </div>
                    )}
                    
                    {priorityInfo.priority === "PRUEBA" && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center text-yellow-600">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          <strong>🎭 Concurso de prueba en espera</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {/* 🆕 FINALIZACIÓN REAL CON BADGES */}
                  {contest.status !== "results" && (
                    <button
                      onClick={() => handlePreviewWinners(contest)}
                      disabled={finalizingContestId === contest.id}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {finalizingContestId === contest.id
                        ? "Cargando..."
                        : "🏆 FINALIZAR REAL (Con Badges)"}
                    </button>
                  )}

                  <a
                    href="/contest/current"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center text-decoration-none"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver en sitio
                  </a>
                </div>

                {contest.status === "results" && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        <span>Concurso finalizado</span>
                      </div>
                      <button
                        onClick={() => handleRevertFinalization(contest)}
                        disabled={finalizingContestId === contest.id}
                        className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                        title="Revertir finalización"
                      >
                        <RotateCcw className="h-3 w-3 inline mr-1" />
                        Revertir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Panel de control de mantenimiento */}
      <MaintenanceControl />

      {/* Panel de limpieza de datos */}
      <DataCleanupPanel />

      {/* Panel de reportes */}
      <ReportsPanel />

      {/* Panel de test de emails */}
      <EmailManager />

      {/* Modal de simulación de ganadores */}
      {showPreviewModal && selectedContest && simulatedWinners && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <TestTube className="h-6 w-6 mr-2 text-purple-600" />
                  Simulación - "{selectedContest.title}"
                </h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <TestTube className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-purple-800 mb-1">
                      Solo Simulación - Sin Badges
                    </h3>
                    <p className="text-purple-700 text-sm">
                      Esta es una vista previa para pruebas. Los ganadores
                      mostrados no recibirán badges ni se registrarán puntos
                      reales.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vista previa de ganadores simulados */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ganadores simulados:
                </h3>
                <div className="space-y-3">
                  {simulatedWinners.map((story, index) => (
                    <div
                      key={story.id}
                      className={`flex items-center p-4 rounded-lg border-2 ${
                        index === 0
                          ? "border-yellow-300 bg-yellow-50"
                          : index === 1
                          ? "border-gray-300 bg-gray-50"
                          : "border-orange-300 bg-orange-50"
                      }`}
                    >
                      <div className="mr-4">
                        {index === 0 ? (
                          <Crown className="h-8 w-8 text-yellow-600" />
                        ) : index === 1 ? (
                          <Medal className="h-8 w-8 text-gray-600" />
                        ) : (
                          <Star className="h-8 w-8 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg">
                            {index === 0 ? "1º" : index === 1 ? "2º" : "3º"}{" "}
                            Lugar
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              index === 0
                                ? "bg-yellow-200 text-yellow-800"
                                : index === 1
                                ? "bg-gray-200 text-gray-800"
                                : "bg-orange-200 text-orange-800"
                            }`}
                          >
                            {story.likes_count || 0} likes
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          {story.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          por {story.user_profiles?.display_name || "Usuario"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Simularía:</div>
                        <div
                          className={`font-medium ${
                            index === 0
                              ? "text-yellow-700"
                              : index === 1
                              ? "text-gray-700"
                              : "text-orange-700"
                          }`}
                        >
                          +{story.simulatedPoints} puntos
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear concurso */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateContest} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Plus className="h-6 w-6 mr-2 text-green-600" />
                  Crear Nuevo Concurso
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del concurso *
                  </label>
                  <input
                    type="text"
                    required
                    value={contestForm.title}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    required
                    value={contestForm.description}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={contestForm.category}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mes
                  </label>
                  <input
                    type="text"
                    value={contestForm.month}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, month: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Palabras mínimas
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={contestForm.min_words}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        min_words: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Palabras máximas
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={contestForm.max_words}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        max_words: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin de envíos
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={contestForm.submission_deadline}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        submission_deadline: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin de votación
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={contestForm.voting_deadline}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        voting_deadline: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Premio
                  </label>
                  <input
                    type="text"
                    value={contestForm.prize}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, prize: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status inicial
                  </label>
                  <select
                    value={contestForm.status}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {createLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Concurso
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar concurso */}
      {showEditModal && editingContest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Edit className="h-6 w-6 mr-2 text-blue-600" />
                  Editar Concurso
                </h2>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del concurso *
                  </label>
                  <input
                    type="text"
                    required
                    value={contestForm.title}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    required
                    value={contestForm.description}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={contestForm.category}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mes
                  </label>
                  <input
                    type="text"
                    value={contestForm.month}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, month: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Palabras mínimas
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={contestForm.min_words}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        min_words: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Palabras máximas
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={contestForm.max_words}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        max_words: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin de envíos
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={contestForm.submission_deadline}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        submission_deadline: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin de votación
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={contestForm.voting_deadline}
                    onChange={(e) =>
                      setContestForm({
                        ...contestForm,
                        voting_deadline: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Premio
                  </label>
                  <input
                    type="text"
                    value={contestForm.prize}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, prize: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status actual
                  </label>
                  <select
                    value={contestForm.status}
                    onChange={(e) =>
                      setContestForm({ ...contestForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={updateLoading}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {updateLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de finalización REAL */}
      {showFinalizationModal && selectedContest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-red-600" />
                  FINALIZACIÓN REAL - "{selectedContest.title}"
                </h2>
                <button
                  onClick={() => setShowFinalizationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">
                      ⚠️ ATENCIÓN: Finalización Real
                    </h3>
                    <p className="text-red-700 text-sm">
                      Esta acción finalizará el concurso DEFINITIVAMENTE,
                      marcará a los ganadores, actualizará estadísticas de victorias
                      y NO se puede deshacer fácilmente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vista previa de ganadores */}
              {winners && winners.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ganadores que recibirán badges:
                  </h3>
                  <div className="space-y-3">
                    {winners.slice(0, 3).map((story, index) => (
                      <div
                        key={story.id}
                        className={`flex items-center p-4 rounded-lg border-2 ${
                          index === 0
                            ? "border-yellow-300 bg-yellow-50"
                            : index === 1
                            ? "border-gray-300 bg-gray-50"
                            : "border-orange-300 bg-orange-50"
                        }`}
                      >
                        <div className="mr-4">
                          {index === 0 ? (
                            <Crown className="h-8 w-8 text-yellow-600" />
                          ) : index === 1 ? (
                            <Medal className="h-8 w-8 text-gray-600" />
                          ) : (
                            <Star className="h-8 w-8 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg">
                              {index === 0 ? "1º" : index === 1 ? "2º" : "3º"}{" "}
                              Lugar
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                index === 0
                                  ? "bg-yellow-200 text-yellow-800"
                                  : index === 1
                                  ? "bg-gray-200 text-gray-800"
                                  : "bg-orange-200 text-orange-800"
                              }`}
                            >
                              {story.likes_count || 0} likes
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {story.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            por {story.user_profiles?.display_name || "Usuario"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Recibirá:</div>
                          <div
                            className={`font-medium ${
                              index === 0
                                ? "text-yellow-700"
                                : index === 1
                                ? "text-gray-700"
                                : "text-orange-700"
                            }`}
                          >
                            {index === 0
                              ? "🏆 Primer lugar (+1 victoria)"
                              : index === 1
                              ? "🥈 Segundo lugar (+1 victoria)"
                              : "🥉 Tercer lugar (+1 victoria)"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {winners && winners.length === 0 && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 text-center">
                    No hay participaciones en este concurso para finalizar.
                  </p>
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowFinalizationModal(false)}
                  disabled={finalizationLoading}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalizeContest}
                  disabled={
                    finalizationLoading || !winners || winners.length === 0
                  }
                  className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {finalizationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      SÍ, FINALIZAR CONCURSO
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug en desarrollo */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-bold mb-2">
            🚨 DEBUG - Solo desarrollo
          </h4>
          <div className="flex gap-4">
            <button
              onClick={() => {
                localStorage.clear();
                alert("LocalStorage limpiado");
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Limpiar LocalStorage
            </button>
            <button
              onClick={() => {
                console.log("🔍 Estado actual del contexto:", {
                  contests,
                  user,
                  isAuthenticated,
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Log Estado
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestAdminPanel;
