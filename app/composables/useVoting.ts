import type { PairDTO, VotePayload, ModelName } from "~/types/vote";

export const useVoting = () => {
  const { $api } = useNuxtApp();
  const sessionId = useSessionId();

  const pair = useState<PairDTO | null>("currentPair", () => null);
  const isLoading = useState<boolean>("v_loading", () => false);
  const errorMsg = useState<string | null>("v_error", () => null);

  const getNext = async () => {
    try {
      isLoading.value = true;
      errorMsg.value = null;

      const data = await $api<PairDTO>("/pair/next", {
        method: "GET",
        query: { session_id: sessionId.value },
      });
      pair.value = data;
    } catch (error: any) {
      errorMsg.value =
        error?.data?.detail || error?.message || "Failed to load next pair";
    } finally {
      isLoading.value = false;
    }
  };

  const vote = async (choice: ModelName | "tie") => {
    if (!pair.value) return;
    const payload: VotePayload = {
      session_id: sessionId.value,
      pair_id: pair.value.pair_id,
      winner_model: choice,
    };

    const prev = pair.value;
    pair.value = null; // clear current pair to show loading state

    try {
      await $api("/votes", { method: "POST", body: payload });
      await getNext();
    } catch (error: any) {
      pair.value = prev; // restore previous pair on error
      throw error;
    }
  };

  return {
    pair,
    isLoading,
    errorMsg,
    getNext,
    vote,
  };
};
