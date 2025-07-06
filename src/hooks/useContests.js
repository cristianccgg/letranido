// hooks/useContests.js - Versión con debug
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const useContests = () => {
  const [contests, setContests] = useState([]);
  const [currentContest, setCurrentContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);

      console.log("🔍 Fetching contests...");

      // Consulta más simple para debug
      const { data: allContests, error: contestsError } = await supabase
        .from("contests")
        .select("*");

      console.log("📊 Contests response:", { allContests, contestsError });

      if (contestsError) {
        console.error("❌ Contests error details:", contestsError);
        throw contestsError;
      }

      console.log("✅ Contests loaded:", allContests);
      setContests(allContests || []);

      // Encontrar el concurso actual
      const current =
        allContests && allContests.length > 0 ? allContests[0] : null;
      console.log("🎯 Current contest:", current);
      setCurrentContest(current);
    } catch (err) {
      console.error("💥 Error fetching contests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getContestById = async (id) => {
    try {
      console.log("🔍 Fetching contest by ID:", id);

      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("id", id)
        .single();

      console.log("📊 Contest by ID response:", { data, error });

      if (error) {
        console.error("❌ Contest by ID error:", error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error("💥 Error fetching contest by ID:", err);
      return null;
    }
  };

  return {
    contests,
    currentContest,
    loading,
    error,
    refetch: fetchContests,
    getContestById,
  };
};
