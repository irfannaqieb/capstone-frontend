<template>
  <div class="flex items-center gap-2 max-w-full">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <!-- Badge with single-line truncate -->
          <Badge
            variant="secondary"
            class="max-w-full cursor-default whitespace-nowrap overflow-hidden text-ellipsis px-3 py-1.5"
            :title="text"
          >
            {{ text }}
          </Badge>
        </TooltipTrigger>

        <!-- Full prompt on hover -->
        <TooltipContent side="bottom" :side-offset="6" class="max-w-[80ch]">
          <p class="text-sm leading-snug">{{ text }}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <!-- Copy button (tiny, optional) -->
    <button
      v-if="showCopy"
      @click="copy"
      class="text-xs px-2 py-1 rounded-md ring-1 ring-border hover:bg-muted transition"
      aria-label="Copy prompt"
      :title="copied ? 'Copied!' : 'Copy prompt'"
    >
      {{ copied ? "Copied!" : "Copy" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
