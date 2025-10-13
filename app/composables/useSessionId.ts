export const useSessionId = () => {
  const key = "hp_session_id";
  const { $api } = useNuxtApp();

  const sessionId = useState<string>("sessionId", () => "");
  const isInitializing = useState<boolean>("sessionInitializing", () => false);

  // Initialize session ID on client side only
  const initSession = async () => {
    if (import.meta.server || isInitializing.value) return;

    isInitializing.value = true;

    try {
      // Check if we have an existing session in localStorage
      const existing = localStorage.getItem(key);
      if (existing) {
        sessionId.value = existing;
        return;
      }

      // Create a new session via backend
      const response = await $api<{ user_session_id: string }>(
        "/session/start",
        {
          method: "POST",
        }
      );

      const sid = response.user_session_id;
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

  return { sessionId, initSession, isInitializing };
};
