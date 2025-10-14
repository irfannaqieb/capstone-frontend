<template>
  <div
    class="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20"
  >
    <div
      class="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-8 p-6 md:p-8"
    >
      <!-- Loading State -->
      <div v-if="isLoading && !pair" class="text-center space-y-4">
        <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p class="text-muted-foreground">Loading image pair...</p>
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
            Thank you for participating in this preference survey. Your contributions help improve AI-generated images.
          </p>
        </div>
        <div class="text-sm text-muted-foreground/80 bg-muted/50 rounded-lg p-4">
          You've completed all available image pairs. Feel free to close this page.
        </div>
      </div>

      <!-- Main Content -->
      <template v-else-if="pair">
        <!-- Header Section -->
        <div class="w-full space-y-4">
          <div class="text-center space-y-2 mb-6">
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight">
              Image Preference Selection
            </h1>
            <p class="text-sm md:text-base text-muted-foreground">
              Choose the image that you think looks better. Don't overthink it!
            </p>
          </div>

          <!-- Progress Section -->
          <div class="w-full max-w-2xl mx-auto">
            <ProgressRow :current="pair.pairs_completed" :total="pair.total_pairs" />
          </div>
        </div>

        <!-- Prompt Display -->
        <div class="w-full max-w-2xl mx-auto flex justify-center">
          <PromptChip :text="pair.prompt_text" />
        </div>

        <!-- Image Comparison Grid -->
        <div class="w-full max-w-4xl">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <ImageChoice
              label="A"
              :src="pair.left.url"
              :ratio="0"
              :disabled="isLoading"
              @choose="choose('left')"
            />
            <ImageChoice
              label="B"
              :src="pair.right.url"
              :ratio="0"
              :disabled="isLoading"
              @choose="choose('right')"
            />
          </div>
        </div>

        <!-- Footer hint -->
        <div class="text-center text-xs md:text-sm text-muted-foreground/60 mt-4">
          Click on an image to make your selection
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { Button } from "@/components/ui/button";

const { pair, isLoading, errorMsg, isDone, getNext, vote } = useVoting();

// Load first pair on mount
onMounted(() => {
  if (!pair.value) {
    getNext();
  }
});

async function choose(side: "left" | "right") {
  if (isLoading.value) return;
  
  try {
    await vote(side);
  } catch (error: any) {
    console.error("Vote failed:", error);
    // Error is already handled in the composable
  }
}
</script>
