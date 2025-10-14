import type { SessionStatus } from "~/types/vote";

export const useSessionId = () => {
  const key = "hp_session_id";
  const { $api } = useNuxtApp();

  const sessionId = useState<string>("sessionId", () => "");
  const isInitializing = useState<boolean>("sessionInitializing", () => false);
  const sessionStatus = useState<"active" | "completed" | "abandoned" | null>("sessionStatus", () => null);

  // Validate if session exists and is active/completed on backend
  const validateSession = async (sid: string): Promise<boolean> => {
    try {
      const status = await $api<SessionStatus>(`/session/${sid}/status`, {
        method: "GET",
      });
      
      sessionStatus.value = status.status;
      
      // Session is valid if it exists and is either active or completed
      // We keep completed sessions to show thank you message
      return status.status === "active" || status.status === "completed";
    } catch (error: any) {
      // Session not found (404) or any other error means invalid session
      console.warn("Session validation failed:", error?.status || error?.message);
      sessionStatus.value = null;
      return false;
    }
  };

  // Create a new session via backend
  const createNewSession = async (): Promise<string> => {
    const response = await $api<{ user_session_id: string }>(
      "/session/start",
      {
        method: "POST",
      }
    );
    return response.user_session_id;
  };

  // Clear session from localStorage and state
  const clearSession = () => {
    if (import.meta.client) {
      localStorage.removeItem(key);
      // Also clear any cached pair data since it's tied to the old session
      localStorage.removeItem('hp_current_pair');
      localStorage.removeItem('hp_pair_start_time');
    }
    sessionId.value = "";
  };

  // Force create a new session (used for recovery)
  const resetSession = async () => {
    if (import.meta.server) return;
    
    clearSession();
    await initSession();
  };

  // Initialize session ID on client side only
  const initSession = async () => {
    if (import.meta.server || isInitializing.value) return;

    isInitializing.value = true;

    try {
      // Check if we have an existing session in localStorage
      const existing = localStorage.getItem(key);
      if (existing) {
        // Validate the existing session with backend
        const isValid = await validateSession(existing);
        
        if (isValid) {
          sessionId.value = existing;
          return;
        } else {
          // Session is invalid (not found, abandoned, or completed)
          console.log("Existing session is invalid, creating new session...");
          clearSession();
        }
      }

      // Create a new session via backend
      const sid = await createNewSession();
      localStorage.setItem(key, sid);
      sessionId.value = sid;
    } catch (error) {
      console.error("Failed to initialize session:", error);
      // Fallback to client-side UUID if backend fails
      const sid = crypto.randomUUID();
      localStorage.setItem(key, sid);
      sessionId.value = sid;
    } finally {
      isInitializing.value = false;
    }
  };

  // Auto-initialize on client
  if (import.meta.client && !sessionId.value && !isInitializing.value) {
    initSession();
  }

  return { sessionId, initSession, isInitializing, validateSession, resetSession, clearSession, sessionStatus };
};
