<template>
  <div class="flex items-center gap-2 max-w-full">
    <!-- Badge with single-line truncate -->
    <Badge
      variant="secondary"
      class="max-w-full cursor-default whitespace-nowrap overflow-hidden text-ellipsis px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-semibold bg-primary/10 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-sm"
      :title="text"
    >
      {{ text }}
    </Badge>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    showCopy?: boolean;
  }>(),
  {
    showCopy: true,
  }
);

const copied = ref(false);

async function copy() {
  try {
    await navigator.clipboard?.writeText(props.text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1200);
  } catch {}
}
</script>
