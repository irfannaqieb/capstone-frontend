<template>
  <div
    class="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20"
  >
    <div
      class="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-8 p-6 md:p-8"
    >
      <!-- Header Section -->
      <div class="w-full space-y-4">
        <div class="text-center space-y-2 mb-6">
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight">
            Image Preference Selection
          </h1>
          <p class="text-sm md:text-base text-muted-foreground">
            Choose the image that best matches the prompt
          </p>
        </div>

        <!-- Progress Section -->
        <div class="w-full max-w-2xl mx-auto">
          <ProgressRow :current="10" :total="300" />
        </div>
      </div>

      <!-- Prompt Display -->
      <div class="w-full max-w-2xl mx-auto flex justify-center">
        <PromptChip :text="prompt" />
      </div>

      <!-- Image Comparison Grid -->
      <div class="w-full max-w-4xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          <ImageChoice
            :label="pair.left.label"
            :src="pair.left.url"
            :ratio="0"
            @choose="choose('left')"
          />
          <ImageChoice
            :label="pair.right.label"
            :src="pair.right.url"
            :ratio="0"
            @choose="choose('right')"
          />
        </div>
      </div>

      <!-- Footer hint -->
      <div class="text-center text-xs md:text-sm text-muted-foreground/60 mt-4">
        Click on an image to make your selection
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";

const prompt = ref("Portrait of an astronaut in a futuristic city");

const pair = ref({
  left: { label: "A" as const, url: "/01.png" },
  right: { label: "B" as const, url: "/02.png" },
});
function choose(side: "left" | "right") {
  // handle vote here
}
</script>
