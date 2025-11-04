<template>
  <div
    class="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20"
  >
    <div
      class="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-8 p-4 md:p-8 lg:p-12"
    >
      <!-- Loading State -->
      <div v-if="isLoading && !prompt" class="text-center space-y-4">
        <div
          class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"
        ></div>
        <p class="text-muted-foreground">Loading images...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMsg" class="text-center space-y-4">
        <div class="text-destructive text-lg font-medium">{{ errorMsg }}</div>
        <Button @click="getNext">Try Again</Button>
      </div>

      <!-- Done State -->
      <div v-else-if="isDone" class="text-center space-y-6 max-w-md mx-auto">
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
      </div>

      <!-- Main Content -->
      <template v-else-if="prompt">
        <!-- Header Section -->
        <div class="w-full space-y-4">
          <div class="text-center space-y-2 mb-6">
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight">
              Image Preference Selection
            </h1>
            <p class="text-sm md:text-base text-muted-foreground">
              Choose the image that you think looks best, or select "Tie" if you
              can't decide
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
              @choose="choose(image.model)"
            />
          </div>
        </div>

        <!-- Tie Button -->
        <div class="w-full flex justify-center">
          <Button
            variant="outline"
            size="lg"
            class="min-w-[200px] border-2 hover:border-primary hover:bg-primary/5"
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
import { onMounted } from "vue";
import { Button } from "@/components/ui/button";
import type { ModelName } from "~/types/vote";

const { prompt, isLoading, errorMsg, isDone, getNext, vote } = useVoting();

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
</script>
