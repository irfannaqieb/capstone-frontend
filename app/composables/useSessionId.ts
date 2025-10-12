export const useSessionId = () => {
  const key = "hp_session_id";

  const sessionId = useState<string>("sessionId", () => {
    if (import.meta.client) {
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const sid = crypto.randomUUID();
      localStorage.setItem(key, sid);
      return sid;
    }
    return "";
  });
  return sessionId;
};
