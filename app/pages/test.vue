<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <ProgressRow :current="current" :total="total" />
  </div>
</template>

<script setup lang="ts">
const current = ref(50);
const total = ref(300);
</script>
