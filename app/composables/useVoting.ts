import type { PairDTO, VotePayload, ModelName } from "~/types/vote";

export const useVoting = () => {
  const { $api } = useNuxtApp();
  const { sessionId, isInitializing } = useSessionId();

  // Initialize pair from localStorage if available
  const pair = useState<PairDTO | null>("currentPair", () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('hp_current_pair');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const isLoading = useState<boolean>("v_loading", () => false);
  const errorMsg = useState<string | null>("v_error", () => null);
  const isDone = useState<boolean>("v_done", () => false);
  
  // Initialize pairStartTime from localStorage if available
  const pairStartTime = useState<number | null>("pairStartTime", () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('hp_pair_start_time');
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });

  // Watch for pair changes and persist to localStorage
  if (import.meta.client) {
    watch(pair, (newPair) => {
      if (newPair) {
        localStorage.setItem('hp_current_pair', JSON.stringify(newPair));
      } else {
        localStorage.removeItem('hp_current_pair');
      }
    }, { deep: true });

    watch(pairStartTime, (newTime) => {
      if (newTime !== null) {
        localStorage.setItem('hp_pair_start_time', newTime.toString());
      } else {
        localStorage.removeItem('hp_pair_start_time');
      }
    });
  }

  const getNext = async () => {
    try {
      isLoading.value = true;
      errorMsg.value = null;

      // Wait for session to be initialized
      if (isInitializing.value) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (!isInitializing.value) {
              clearInterval(interval);
              resolve(true);
            }
          }, 100);
        });
      }

      // Ensure we have a valid session ID (only available on client)
      if (!sessionId.value) {
        throw new Error("Session ID not available. Please refresh the page.");
      }

      const data = await $api<PairDTO>(
        `/pairs/next?session_id=${sessionId.value}`,
        {
          method: "GET",
        }
      );

      pair.value = data;
      isDone.value = data.done;
      // Record when the pair is shown to the user
      if (!data.done) {
        pairStartTime.value = Date.now();
      }
    } catch (error: any) {
      errorMsg.value =
        error?.data?.detail || error?.message || "Failed to load next pair";
    } finally {
      isLoading.value = false;
    }
  };

  const vote = async (choice: "left" | "right" | "tie") => {
    if (!pair.value) return;

    // Determine the winner model based on user's choice
    let winnerModel: ModelName | "tie";
    if (choice === "tie") {
      winnerModel = "tie";
    } else if (choice === "left") {
      winnerModel = pair.value.left.model;
    } else {
      winnerModel = pair.value.right.model;
    }

    // Calculate reaction time
    const reactionTimeMs = pairStartTime.value 
      ? Date.now() - pairStartTime.value 
      : 0;

    const payload: VotePayload = {
      session_id: sessionId.value,
      pair_id: pair.value.pair_id,
      winner_model: winnerModel,
      left_model: pair.value.left.model,
      reaction_time_ms: reactionTimeMs,
    };

    const prev = pair.value;
    pair.value = null; // clear current pair to show loading state

    try {
      await $api("/votes", { method: "POST", body: payload });
      
      // Clear localStorage after successful vote
      if (import.meta.client) {
        localStorage.removeItem('hp_current_pair');
        localStorage.removeItem('hp_pair_start_time');
      }
      
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
    isDone,
    getNext,
    vote,
  };
};
