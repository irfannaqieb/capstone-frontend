import type { PromptDTO, VotePayload, ModelName, PromptHistory } from "~/types/vote";

export const useVoting = () => {
  const { $api } = useNuxtApp();
  const { sessionId, isInitializing, resetSession, sessionStatus } = useSessionId();

  // Initialize history from localStorage if available
  const history = useState<PromptHistory[]>("promptHistory", () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('hp_prompt_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Track current position in history (-1 means at the latest/end)
  const currentHistoryIndex = useState<number>("currentHistoryIndex", () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('hp_history_index');
      return saved ? parseInt(saved, 10) : -1;
    }
    return -1;
  });

  // Current prompt is derived from history
  const prompt = computed(() => {
    if (history.value.length === 0) return null;
    const index = currentHistoryIndex.value === -1 
      ? history.value.length - 1 
      : currentHistoryIndex.value;
    return history.value[index]?.prompt || null;
  });

  const isLoading = useState<boolean>("v_loading", () => false);
  const errorMsg = useState<string | null>("v_error", () => null);
  const isDone = useState<boolean>("v_done", () => false);

  // Check if we can go back in history
  const canGoBack = computed(() => {
    const index = currentHistoryIndex.value === -1 
      ? history.value.length - 1 
      : currentHistoryIndex.value;
    return index > 0;
  });
  
  // Check if session is already completed on mount
  if (import.meta.client) {
    watch(sessionStatus, (status) => {
      if (status === "completed") {
        isDone.value = true;
        history.value = []; // Clear history
      }
    }, { immediate: true });
  }
  
  // Track when each prompt is shown (map of prompt_id to timestamp)
  const promptStartTimes = useState<Record<string, number>>("promptStartTimes", () => ({}));

  // Watch for history changes and persist to localStorage
  if (import.meta.client) {
    watch(history, (newHistory) => {
      localStorage.setItem('hp_prompt_history', JSON.stringify(newHistory));
    }, { deep: true });

    watch(currentHistoryIndex, (newIndex) => {
      localStorage.setItem('hp_history_index', newIndex.toString());
    });

    // Listen for browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.historyIndex !== undefined) {
        currentHistoryIndex.value = event.state.historyIndex;
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Cleanup on unmount
    onUnmounted(() => {
      window.removeEventListener('popstate', handlePopState);
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

      // Add new prompt to history
      history.value.push({
        prompt: data,
        vote: null
      });
      
      // Set current index to the new prompt (end of history)
      currentHistoryIndex.value = -1;
      
      isDone.value = data.done;
      
      // Record when the prompt is shown to the user
      if (!data.done && import.meta.client) {
        promptStartTimes.value[data.prompt_id] = Date.now();
        
        // Push browser history state
        window.history.pushState(
          { historyIndex: history.value.length - 1 },
          '',
          window.location.href
        );
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

    const currentPrompt = prompt.value;
    const currentIndex = currentHistoryIndex.value === -1 
      ? history.value.length - 1 
      : currentHistoryIndex.value;

    // Calculate reaction time
    const startTime = promptStartTimes.value[currentPrompt.prompt_id];
    const reactionTimeMs = startTime ? Date.now() - startTime : 0;

    const payload: VotePayload = {
      session_id: sessionId.value,
      prompt_id: currentPrompt.prompt_id,
      winner_model: winnerModel,
      reaction_time_ms: reactionTimeMs,
    };

    try {
      isLoading.value = true;
      await $api("/votes", { method: "POST", body: payload });
      
      // Update the vote in history
      if (history.value[currentIndex]) {
        history.value[currentIndex].vote = winnerModel;
      }

      // Check if we're at the end of history
      const isAtEnd = currentIndex === history.value.length - 1;
      
      if (isAtEnd) {
        // Fetch next prompt
        await getNext();
      } else {
        // Move forward in history (preserve future rounds)
        currentHistoryIndex.value = currentIndex + 1;
        
        // Push browser history state
        if (import.meta.client) {
          window.history.pushState(
            { historyIndex: currentIndex + 1 },
            '',
            window.location.href
          );
          
          // Record start time for this prompt if not already recorded
          const nextPrompt = history.value[currentIndex + 1]?.prompt;
          if (nextPrompt && !promptStartTimes.value[nextPrompt.prompt_id]) {
            promptStartTimes.value[nextPrompt.prompt_id] = Date.now();
          }
        }
      }
    } catch (error: any) {
      // Handle session-related errors
      const status = error?.status || error?.statusCode;
      const isSessionError = status === 404 || status === 401 || status === 422;
      
      if (isSessionError && retryCount === 0) {
        console.log("Session error during vote, resetting session...");
        await resetSession();
        // Retry once with new session
        return vote(winnerModel, 1);
      }
      
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // Navigate back in history
  const goBack = () => {
    if (!canGoBack.value) return;
    
    const currentIndex = currentHistoryIndex.value === -1 
      ? history.value.length - 1 
      : currentHistoryIndex.value;
    
    const newIndex = currentIndex - 1;
    currentHistoryIndex.value = newIndex;
    
    // Update browser history
    if (import.meta.client) {
      window.history.pushState(
        { historyIndex: newIndex },
        '',
        window.location.href
      );
      
      // Record start time for this prompt if not already recorded
      const prevPrompt = history.value[newIndex]?.prompt;
      if (prevPrompt && !promptStartTimes.value[prevPrompt.prompt_id]) {
        promptStartTimes.value[prevPrompt.prompt_id] = Date.now();
      }
    }
  };

  // Get current vote from history
  const getCurrentVote = (): ModelName | "tie" | null => {
    if (history.value.length === 0) return null;
    const index = currentHistoryIndex.value === -1 
      ? history.value.length - 1 
      : currentHistoryIndex.value;
    return history.value[index]?.vote || null;
  };

  // Clear history on reset
  const clearHistory = () => {
    history.value = [];
    currentHistoryIndex.value = -1;
    promptStartTimes.value = {};
    if (import.meta.client) {
      localStorage.removeItem('hp_prompt_history');
      localStorage.removeItem('hp_history_index');
    }
  };

  return {
    prompt,
    isLoading,
    errorMsg,
    isDone,
    getNext,
    vote,
    goBack,
    canGoBack,
    getCurrentVote,
    clearHistory,
  };
};
