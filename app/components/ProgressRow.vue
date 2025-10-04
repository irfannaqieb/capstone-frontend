<template>
  <div class="w-full">
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm md:text-base text-foreground/90">
        <span class="font-semibold">{{ current }}</span>
        <span class="opacity-70"> / {{ total }}</span>
      </p>
    </div>
    <Progress :model-value="pct" class="h-2" aria-label="Progress" />
  </div>
</template>

<script setup lang="ts">
import { Progress } from "@/components/ui/progress";

const props = defineProps<{
  current: number;
  total: number;
}>();

const pct = computed(() => {
  const t = Math.max(1, props.total || 1);
  const c = Math.min(props.current || 0, t);
  return Math.round((c / t) * 100);
});
</script>
