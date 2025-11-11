<template>
  <!-- Make the whole card a button for accessibility -->
  <button
    class="group relative w-full text-left focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
    :disabled="disabled"
    @click="emit('choose')"
  >
    <Card
      :class="[
        'overflow-hidden rounded-2xl ring-1 bg-card transition group-hover:shadow md:active:scale-[.995]',
        selected 
          ? 'ring-2 ring-primary' 
          : 'ring-border group-hover:ring-primary/40'
      ]"
    >
      <!-- A/B label pill -->
      <div class="absolute left-3 top-3 z-10">
        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur ring-1 ring-border text-sm font-semibold text-foreground/90 select-none"
        >
          {{ label }}
        </span>
      </div>

      <CardContent class="h-full w-full p-2">
        <!-- 1:1 Aspect Ratio Container for 1024x1024 images -->
        <div class="relative w-full">
          <AspectRatio :ratio="1">
            <img
              :src="src"
              :alt="alt || `Image ${label}`"
              class="block h-full w-full object-cover rounded-xl"
              loading="eager"
              decoding="async"
              @load="onLoad"
              @error="onError"
              v-show="loaded && !errored"
            />
            <Skeleton
              v-show="!loaded && !errored"
              class="h-full w-full rounded-xl"
            />
            
            <!-- Error state -->
            <div
              v-if="errored"
              class="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-xl"
            >
              <div class="text-center space-y-2 px-4">
                <div class="text-destructive text-sm font-medium">
                  Failed to load image
                </div>
                <div class="text-xs text-muted-foreground break-all">
                  {{ src }}
                </div>
              </div>
            </div>
          </AspectRatio>
        </div>
      </CardContent>
    </Card>
  </button>
</template>

<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    label: "A" | "B" | "C" | "D" | "E";
    src: string;
    alt?: string;
    disabled?: boolean;
    selected?: boolean;
  }>(),
  {
    alt: "",
    disabled: false,
    selected: false,
  }
);

const emit = defineEmits<{ (e: "choose"): void }>();
const loaded = ref(false);
const errored = ref(false);

// Reset loading state when src changes
watch(
  () => props.src,
  () => {
    loaded.value = false;
    errored.value = false;
  },
  { immediate: true }
);

function onLoad() {
  loaded.value = true;
}

function onError() {
  errored.value = true;
  loaded.value = true;
}
</script>
