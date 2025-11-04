import type { PromptDTO, VotePayload, ModelName } from "~/types/vote";

export const useVoting = () => {
  const { $api } = useNuxtApp();
  const { sessionId, isInitializing, resetSession, sessionStatus } = useSessionId();

  // Initialize prompt from localStorage if available
  const prompt = useState<PromptDTO | null>("currentPrompt", () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('hp_current_prompt');
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
        prompt.value = null; // Clear any cached prompt
      }
    }, { immediate: true });
  }
  
  // Initialize promptStartTime from localStorage if available
  const promptStartTime = useState<number | null>("promptStartTime", () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('hp_prompt_start_time');
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });

  // Watch for prompt changes and persist to localStorage
  if (import.meta.client) {
    watch(prompt, (newPrompt) => {
      if (newPrompt) {
        localStorage.setItem('hp_current_prompt', JSON.stringify(newPrompt));
      } else {
        localStorage.removeItem('hp_current_prompt');
      }
    }, { deep: true });

    watch(promptStartTime, (newTime) => {
      if (newTime !== null) {
        localStorage.setItem('hp_prompt_start_time', newTime.toString());
      } else {
        localStorage.removeItem('hp_prompt_start_time');
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

      // If session is already completed, don't fetch next prompt
      if (sessionStatus.value === "completed") {
        isDone.value = true;
        return;
      }

      // Ensure we have a valid session ID (only available on client)
      if (!sessionId.value) {
        throw new Error("Session ID not available. Please refresh the page.");
      }

      const data = await $api<PromptDTO>(
        `/prompts/next?session_id=${sessionId.value}`,
        {
          method: "GET",
        }
      );

      prompt.value = data;
      isDone.value = data.done;
      // Record when the prompt is shown to the user
      if (!data.done) {
        promptStartTime.value = Date.now();
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
        error?.data?.detail || error?.message || "Failed to load next prompt";
    } finally {
      isLoading.value = false;
    }
  };

  const vote = async (winnerModel: ModelName | "tie", retryCount = 0) => {
    if (!prompt.value) return;
    
    // Prevent voting if session is completed
    if (sessionStatus.value === "completed") {
      errorMsg.value = "This session has been completed. Thank you for voting!";
      return;
    }

    // Calculate reaction time
    const reactionTimeMs = promptStartTime.value 
      ? Date.now() - promptStartTime.value 
      : 0;

    const payload: VotePayload = {
      session_id: sessionId.value,
      prompt_id: prompt.value.prompt_id,
      winner_model: winnerModel,
      reaction_time_ms: reactionTimeMs,
    };

    const prev = prompt.value;
    prompt.value = null; // clear current prompt to show loading state

    try {
      await $api("/votes", { method: "POST", body: payload });
      
      // Clear localStorage after successful vote
      if (import.meta.client) {
        localStorage.removeItem('hp_current_prompt');
        localStorage.removeItem('hp_prompt_start_time');
      }
      
      await getNext();
    } catch (error: any) {
      // Handle session-related errors
      const status = error?.status || error?.statusCode;
      const isSessionError = status === 404 || status === 401 || status === 422;
      
      if (isSessionError && retryCount === 0) {
        console.log("Session error during vote, resetting session...");
        prompt.value = prev; // restore prompt for retry
        await resetSession();
        // Retry once with new session
        return vote(winnerModel, 1);
      }
      
      prompt.value = prev; // restore previous prompt on error
      throw error;
    }
  };

  return {
    prompt,
    isLoading,
    errorMsg,
    isDone,
    getNext,
    vote,
  };
};
