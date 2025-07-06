import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Login function
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // TODO: Implementar login real con Supabase
          const mockUser = {
            id: "1",
            email,
            name: email.split("@")[0],
            avatar: null,
            joinedAt: new Date().toISOString(),
            stats: {
              textsWritten: 0,
              wins: 0,
              streak: 0,
            },
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true, user: mockUser };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Register function
      register: async (email, name, password) => {
        set({ isLoading: true });
        try {
          // TODO: Implementar registro real con Supabase
          const newUser = {
            id: Date.now().toString(),
            email,
            name,
            avatar: null,
            joinedAt: new Date().toISOString(),
            stats: {
              textsWritten: 0,
              wins: 0,
              streak: 0,
            },
          };

          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true, user: newUser };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Logout function
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      // Update user profile
      updateProfile: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
