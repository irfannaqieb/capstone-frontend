import type { PairDTO, VotePayload, ModelName } from "~/types/vote";

export const useVoting = () => {
  const { $api } = useNuxtApp();
  const { sessionId, isInitializing, resetSession, sessionStatus } = useSessionId();

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
  
  // Check if session is already completed on mount
  if (import.meta.client) {
    watch(sessionStatus, (status) => {
      if (status === "completed") {
        isDone.value = true;
        pair.value = null; // Clear any cached pair
      }
    }, { immediate: true });
  }
  
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

  const getNext = async (retryCount = 0) => {
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

      // If session is already completed, don't fetch next pair
      if (sessionStatus.value === "completed") {
        isDone.value = true;
        return;
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
      // Handle session-related errors (404, 401, 422, etc.)
      const status = error?.status || error?.statusCode;
      const isSessionError = status === 404 || status === 401 || status === 422;
      
      if (isSessionError && retryCount === 0) {
        console.log("Session error detected, resetting session and retrying...");
        await resetSession();
        // Retry once with new session
        return getNext(1);
      }
      
      errorMsg.value =
        error?.data?.detail || error?.message || "Failed to load next pair";
    } finally {
      isLoading.value = false;
    }
  };

  const vote = async (choice: "left" | "right" | "tie", retryCount = 0) => {
    if (!pair.value) return;
    
    // Prevent voting if session is completed
    if (sessionStatus.value === "completed") {
      errorMsg.value = "This session has been completed. Thank you for voting!";
      return;
    }

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
      // Handle session-related errors
      const status = error?.status || error?.statusCode;
      const isSessionError = status === 404 || status === 401 || status === 422;
      
      if (isSessionError && retryCount === 0) {
        console.log("Session error during vote, resetting session...");
        pair.value = prev; // restore pair for retry
        await resetSession();
        // Retry once with new session
        return vote(choice, 1);
      }
      
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
