<template>
  <div
    class="min-h-screen w-screen overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/10 dark:to-muted/5 p-4 md:p-8 lg:p-12"
  >
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">
            Voting Results
          </h1>
          <p class="text-sm md:text-base text-muted-foreground mt-1">
            Overview of model win percentages based on all decisive votes.
          </p>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            class="text-xs whitespace-nowrap flex-shrink-0"
            @click="goHome"
          >
            <Home class="h-4 w-4 mr-1" />
            Home
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            class="flex-shrink-0"
            @click="toggleTheme"
          >
            <Sun v-if="theme === 'light'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="text-xs text-muted-foreground hover:text-destructive whitespace-nowrap flex-shrink-0"
            :disabled="isResetting"
            @click="confirmReset"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            {{ isResetting ? "Starting Fresh..." : "Start Fresh Session" }}
          </Button>
        </div>
      </div>

      <!-- Summary -->
      <div
        v-if="results"
        class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm md:text-base"
      >
        <div class="rounded-lg border bg-background/60 p-4 space-y-1">
          <div class="text-muted-foreground text-xs uppercase tracking-wide">
            Total Votes
          </div>
          <div class="text-xl font-semibold">
            {{ results.total_votes.toLocaleString() }}
          </div>
        </div>

        <div class="rounded-lg border bg-background/60 p-4 space-y-1">
          <div class="text-muted-foreground text-xs uppercase tracking-wide">
            Decisive Votes
          </div>
          <div class="text-xl font-semibold">
            {{ results.total_decisive_votes.toLocaleString() }}
          </div>
        </div>

        <div class="rounded-lg border bg-background/60 p-4 space-y-1">
          <div class="text-muted-foreground text-xs uppercase tracking-wide">
            Tie Votes
          </div>
          <div class="text-xl font-semibold">
            {{ results.tie_votes.toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- Loading / Error -->
      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
        ></div>
      </div>
      <div
        v-else-if="error"
        class="text-center text-destructive font-medium py-8"
      >
        {{ error }}
      </div>

      <!-- Chart -->
      <div v-else-if="results" class="rounded-xl border bg-background/60 p-4 md:p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg md:text-xl font-semibold">
            Model Win Percentage
          </h2>
          <span class="text-xs text-muted-foreground">
            Higher bar = more preferred
          </span>
        </div>

        <ClientOnly>
          <div class="h-[320px] md:h-[420px]">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
          <template #fallback>
            <div class="flex justify-center py-8 text-muted-foreground text-sm">
              Preparing chart...
            </div>
          </template>
        </ClientOnly>
      </div>

      <!-- No data -->
      <div
        v-else
        class="text-center text-muted-foreground text-sm py-8"
      >
        No results available yet. Try again later after some votes have been
        recorded.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type ChartData, type ChartOptions } from "chart.js";
import { Bar } from "vue-chartjs";
import { Button } from "@/components/ui/button";
import { Home, Sun, Moon } from "lucide-vue-next";
import type { VoteResults } from "~/types/vote";

// Register Chart.js components on client
if (import.meta.client) {
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
}

const router = useRouter();
const { $api } = useNuxtApp();
const { resetSession } = useSessionId();
const { clearHistory, isDone } = useVoting();
const { theme, toggleTheme } = useColorMode();

const results = ref<VoteResults | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const isResetting = ref(false);

// Helper to read a CSS variable from the Tailwind theme
const getCssVar = (name: string, fallback: string): string => {
  if (import.meta.client && typeof window !== "undefined") {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name);
    if (value) return value.trim();
  }
  return fallback;
};

const fetchResults = async () => {
  try {
    loading.value = true;
    error.value = null;
    // Update this endpoint path if your backend uses a different URL
    const data = await $api<VoteResults>("/results", { method: "GET" });
    results.value = data;
  } catch (err: any) {
    console.error("Failed to load results:", err);
    error.value =
      err?.data?.detail || err?.message || "Failed to load voting results.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchResults();
});

// Navigate to home (voting page)
const goHome = () => {
  router.push("/");
};

// Handle start fresh session with confirmation
const confirmReset = async () => {
  const confirmed = confirm(
    "Are you sure you want to start a fresh session? This will reset all your progress."
  );
  
  if (confirmed) {
    await handleStartFresh();
  }
};

// Start fresh session and go back to voting
const handleStartFresh = async () => {
  if (isResetting.value) return;

  try {
    isResetting.value = true;
    clearHistory(); // This now also resets isDone to false
    await resetSession();
    // Ensure isDone is false before navigating
    isDone.value = false;
    await router.push("/");
  } catch (err) {
    console.error("Failed to start fresh session from results page:", err);
  } finally {
    isResetting.value = false;
  }
};

const chartData = computed<ChartData<"bar">>(() => {
  // Make this reactive to theme changes
  const currentTheme = theme.value;
  
  if (!results.value) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const labels = results.value.models.map((m) => m.display_name);
  const data = results.value.models.map((m) =>
    Number(m.win_percentage.toFixed(2))
  );

  const barColor = getCssVar("--chart-1", currentTheme === "dark" ? "rgba(99, 102, 241, 0.7)" : "rgba(59, 130, 246, 0.7)");
  const barBorderColor = getCssVar("--primary", currentTheme === "dark" ? "rgba(148, 163, 184, 1)" : "rgba(37, 99, 235, 1)");

  return {
    labels,
    datasets: [
      {
        label: "Win Percentage",
        data,
        backgroundColor: barColor,
        borderColor: barBorderColor,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };
});

const chartOptions = computed<ChartOptions<"bar">>(() => {
  // Make this reactive to theme changes
  const currentTheme = theme.value;
  
  const foreground = getCssVar("--foreground", currentTheme === "dark" ? "#f8fafc" : "#020617");
  const mutedForeground = getCssVar("--muted-foreground", currentTheme === "dark" ? "#cbd5e1" : "#6b7280");
  const borderColor = getCssVar("--border", currentTheme === "dark" ? "#334155" : "#e5e7eb");

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: foreground,
          font: {
            family:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return `${value.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: mutedForeground,
          font: {
            family:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: mutedForeground,
          callback: (value) => `${value}%`,
          font: {
            family:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
        },
        grid: {
          color: borderColor,
        },
        title: {
          display: true,
          text: "Win Percentage",
          color: foreground,
          font: {
            family:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
        },
      },
    },
  };
});
</script>
