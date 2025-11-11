<template>
  <div
    class="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/10 dark:to-muted/5"
  >
    <div
      class="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-8 p-4 md:p-8 lg:p-12"
    >
      <!-- Loading State -->
      <div v-if="isLoading && !prompt" class="text-center space-y-4">
        <div class="absolute top-4 right-4 lg:right-8 z-10">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            @click="toggleTheme"
          >
            <Sun v-if="theme === 'light'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </Button>
        </div>
        <div
          class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"
        ></div>
        <p class="text-muted-foreground">Loading images...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMsg" class="text-center space-y-4">
        <div class="absolute top-4 right-4 lg:right-8 z-10">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            @click="toggleTheme"
          >
            <Sun v-if="theme === 'light'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </Button>
        </div>
        <div class="text-destructive text-lg font-medium">{{ errorMsg }}</div>
        <div class="flex gap-3 justify-center">
          <Button @click="getNext">Try Again</Button>
          <Button 
            variant="outline" 
            @click="handleStartFresh"
            :disabled="isResetting"
          >
            {{ isResetting ? 'Resetting...' : 'Start Fresh' }}
          </Button>
        </div>
      </div>

      <!-- Done State -->
      <div v-else-if="isDone" class="text-center space-y-6 max-w-md mx-auto">
        <div class="absolute top-4 right-4 lg:right-8 z-10">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            @click="toggleTheme"
          >
            <Sun v-if="theme === 'light'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </Button>
        </div>
        <div class="text-6xl">🎉</div>
        <div class="space-y-2">
          <h2 class="text-2xl md:text-3xl font-bold">All Done!</h2>
          <p class="text-muted-foreground">
            Thank you for participating in this preference survey. Your
            contributions help improve AI-generated images.
          </p>
        </div>
        <div
          class="text-sm text-muted-foreground/80 bg-muted/50 rounded-lg p-4"
        >
          You've completed all available prompts. Feel free to close this page.
        </div>
        
        <!-- Start Fresh Session Button -->
        <Button
          variant="outline"
          size="lg"
          class="mt-4"
          @click="handleStartFresh"
          :disabled="isResetting"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          {{ isResetting ? 'Starting Fresh...' : 'Start Fresh Session' }}
        </Button>
      </div>

      <!-- Main Content -->
      <template v-else-if="prompt">
        <!-- Top Navigation Bar -->
        <div class="w-full flex justify-between items-center gap-2 mb-2 md:mb-0 md:absolute md:top-4 md:left-4 md:right-4 lg:left-8 lg:right-8 md:z-10">
          <!-- Back Button - Left Side -->
          <Button
            variant="ghost"
            size="sm"
            class="text-xs"
            @click="goBack"
            :disabled="!canGoBack || isLoading"
          >
            <ChevronLeft class="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <!-- Theme & Start Fresh - Right Side -->
          <div class="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              @click="toggleTheme"
            >
              <Sun v-if="theme === 'light'" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="text-xs text-muted-foreground hover:text-destructive"
              @click="confirmReset"
              :disabled="isLoading"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              Start Fresh
            </Button>
          </div>
        </div>

        <!-- Header Section -->
        <div class="w-full space-y-4">
          <div class="text-center space-y-2 mb-6">
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight">
              Image Preference Selection
            </h1>
            <p class="text-sm md:text-base text-muted-foreground">
              Select <span class="font-semibold">one image</span> that you think looks best, or choose "Tie" if you
              can't decide between them
            </p>
          </div>

          <!-- Progress Section -->
          <div class="w-full max-w-2xl mx-auto">
            <ProgressRow :current="prompt.index" :total="prompt.total" />
          </div>
        </div>

        <!-- Prompt Display -->
        <div class="w-full max-w-4xl mx-auto flex justify-center">
          <PromptChip :text="prompt.prompt_text" />
        </div>

        <!-- Image Grid -->
        <div class="w-full px-4 md:px-8">
          <div
            class="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 max-w-[1800px] mx-auto"
          >
            <ImageChoice
              v-for="(image, index) in prompt.images"
              :key="image.image_id"
              :label="getLabel(index)"
              :src="image.url"
              :disabled="isLoading"
              :selected="currentVote === image.model"
              @choose="choose(image.model)"
            />
          </div>
        </div>

        <!-- Tie Button -->
        <div class="w-full flex justify-center">
          <Button
            variant="outline"
            size="lg"
            :class="[
              'min-w-[200px] border-2 hover:bg-primary/5',
              currentVote === 'tie' 
                ? 'border-primary ring-2 ring-primary' 
                : 'hover:border-primary'
            ]"
            :disabled="isLoading"
            @click="choose('tie')"
          >
            <span class="text-base font-semibold">It's a Tie</span>
          </Button>
        </div>

        <!-- Footer hint -->
        <div
          class="text-center text-xs md:text-sm text-muted-foreground/60 mt-2"
        >
          Click on an image to select it, or choose "Tie" if they're equally
          good
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Sun, Moon, ChevronLeft } from "lucide-vue-next";
import type { ModelName } from "~/types/vote";

const { prompt, isLoading, errorMsg, isDone, getNext, vote, goBack, canGoBack, getCurrentVote, clearHistory } = useVoting();
const { resetSession } = useSessionId();
const { theme, toggleTheme } = useColorMode();

// Get current vote to highlight selected choice
const currentVote = computed(() => getCurrentVote());

const isResetting = ref(false);

// Load first prompt on mount
onMounted(() => {
  if (!prompt.value) {
    getNext();
  }
});

// Convert index to label (A, B, C, D, E)
function getLabel(index: number): "A" | "B" | "C" | "D" | "E" {
  const labels = ["A", "B", "C", "D", "E"] as const;
  return labels[index] || "A";
}

async function choose(model: ModelName | "tie") {
  if (isLoading.value) return;

  try {
    await vote(model);
  } catch (error: any) {
    console.error("Vote failed:", error);
    // Error is already handled in the composable
  }
}

// Handle start fresh session with confirmation
async function confirmReset() {
  const confirmed = confirm(
    "Are you sure you want to start a fresh session? This will reset all your progress."
  );
  
  if (confirmed) {
    await handleStartFresh();
  }
}

// Start fresh session
async function handleStartFresh() {
  if (isResetting.value) return;
  
  try {
    isResetting.value = true;
    clearHistory();
    await resetSession();
    // Session is reset, now fetch the first prompt
    await getNext();
  } catch (error: any) {
    console.error("Failed to start fresh session:", error);
  } finally {
    isResetting.value = false;
  }
}
</script>
