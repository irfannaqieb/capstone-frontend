<template>
  <div
    class="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/10 dark:to-muted/5 p-4 md:p-8 lg:p-12"
  >
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      <!-- Per-Prompt Breakdown -->
      <div
        v-if="!loading && !error && promptResults.length > 0"
        class="mt-6 space-y-4"
      >
        <div>
          <h2 class="text-xl md:text-2xl font-semibold mb-1">
            Per-Prompt Breakdown
          </h2>
          <p class="text-sm text-muted-foreground mb-4">
            Scroll to explore detailed results for each prompt.
          </p>
          
          <!-- Search Bar -->
          <div class="relative max-w-md">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by prompt text..."
                class="w-full pl-10 pr-10 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
            <p v-if="searchQuery" class="text-xs text-muted-foreground mt-2">
              Showing {{ filteredPromptResults.length }} of {{ promptResults.length }} prompt{{ promptResults.length !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>

        <!-- Scrollable Container -->
        <div
          class="rounded-xl border bg-background/60 p-4 md:p-6 space-y-4 max-h-[600px] overflow-y-auto"
        >
          <div
            v-if="filteredPromptResults.length === 0"
            class="text-center py-8 text-muted-foreground text-sm"
          >
            No prompts found matching "{{ searchQuery }}"
          </div>
          <div
            v-for="prompt in filteredPromptResults"
            :key="prompt.prompt_id"
            class="rounded-lg border bg-background p-4 md:p-5 space-y-3"
          >
            <!-- Prompt Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 class="text-base md:text-lg font-semibold">
                Prompt #{{ promptResults.findIndex(p => p.prompt_id === prompt.prompt_id) + 1 }}
              </h3>
              <div class="flex gap-3 text-xs md:text-sm text-muted-foreground">
                <span>Total: {{ prompt.total_votes }}</span>
                <span>Ties: {{ prompt.tie_votes }}</span>
                <span>Decisive: {{ getDecisiveVotes(prompt) }}</span>
              </div>
            </div>

            <!-- Prompt Text -->
            <div class="flex justify-start">
              <PromptChip :text="prompt.prompt_text" />
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <!-- Left Column: Model Percentages -->
              <div class="space-y-3">
                <h4 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Model Performance
                </h4>
                <div v-if="prompt.total_votes === 0" class="text-sm text-muted-foreground py-4">
                  No votes yet for this prompt.
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="model in prompt.models"
                    :key="model.model_id"
                    class="space-y-1.5"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">{{ model.display_name }}</span>
                        <Badge
                          v-if="prompt.winning_model_id === model.model_id && getDecisiveVotes(prompt) > 0"
                          variant="default"
                          class="text-xs"
                        >
                          Winner
                        </Badge>
                      </div>
                      <span class="text-sm text-muted-foreground">
                        {{ model.win_percentage.toFixed(2) }}%
                      </span>
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ model.wins }} / {{ getDecisiveVotes(prompt) }} decisive wins
                    </div>
                    <div class="bg-muted/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-1.5 rounded-full transition-all"
                        :style="{ 
                          width: Math.max(model.win_percentage || 0, 0.5) + '%',
                          backgroundColor: getModelColor(model.model_id)
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column: Winning Image(s) -->
              <div class="space-y-3">
                <h4 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Winning Image{{ getTiedWinners(prompt).length > 1 ? 's' : '' }}
                </h4>
                <!-- Tie Scenario -->
                <div v-if="getTiedWinners(prompt).length > 1" class="space-y-2">
                  <p class="text-sm text-muted-foreground">
                    {{ getTiedWinners(prompt).length === 2 ? 'Tied Winners' : `${getTiedWinners(prompt).length} Way Tie` }}
                  </p>
                  <div class="grid grid-cols-2 gap-2">
                    <Card
                      v-for="winner in getTiedWinners(prompt).slice(0, 2)"
                      :key="winner.image.image_id"
                      class="overflow-hidden"
                    >
                      <CardContent class="p-0">
                        <AspectRatio :ratio="1">
                          <img
                            :src="winner.image.url"
                            :alt="`Tied winner image for ${winner.model.display_name}`"
                            class="block h-full w-full object-cover"
                            loading="lazy"
                          />
                        </AspectRatio>
                      </CardContent>
                    </Card>
                    <!-- Show "+X more" indicator if more than 2 tied -->
                    <div
                      v-if="getTiedWinners(prompt).length > 2"
                      class="flex items-center justify-center border-2 border-dashed border-muted rounded-lg"
                    >
                      <p class="text-xs text-muted-foreground text-center px-2">
                        +{{ getTiedWinners(prompt).length - 2 }} more
                      </p>
                    </div>
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ getTiedWinners(prompt).slice(0, 2).map(w => w.model.display_name).join(', ') }}
                    <span v-if="getTiedWinners(prompt).length > 2">
                      , +{{ getTiedWinners(prompt).length - 2 }} more
                    </span>
                  </div>
                </div>
                <!-- Single Winner -->
                <div v-else-if="getWinningImage(prompt) && getWinningModel(prompt)" class="space-y-2">
                  <p class="text-sm text-muted-foreground">
                    {{ getWinningModel(prompt)?.display_name }}
                  </p>
                  <Card class="overflow-hidden">
                    <CardContent class="p-0">
                      <AspectRatio :ratio="1">
                        <img
                          :src="getWinningImage(prompt)?.url"
                          :alt="`Winning image for ${getWinningModel(prompt)?.display_name}`"
                          class="block h-full w-full object-cover"
                          loading="lazy"
                        />
                      </AspectRatio>
                    </CardContent>
                  </Card>
                </div>
                <!-- No Winner -->
                <div v-else>
                  <div class="border-2 border-dashed border-muted rounded-lg p-6 flex items-center justify-center">
                    <p class="text-sm text-muted-foreground text-center">
                      No winning image yet for this prompt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty per-prompt state -->
      <div
        v-else-if="!loading && !error && results && promptResults.length === 0"
        class="mt-6 rounded-xl border bg-background/60 p-4 md:p-6"
      >
        <h2 class="text-xl md:text-2xl font-semibold mb-2">
          Per-Prompt Breakdown
        </h2>
        <p class="text-sm text-muted-foreground">
          No per-prompt results available yet.
        </p>
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
import { Home, Sun, Moon, Search, X } from "lucide-vue-next";
import type { VoteResults, PromptResultsResponse, PromptResult, PromptResultImage, PromptResultModel, ModelName } from "~/types/vote";
import PromptChip from "@/components/PromptChip.vue";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";

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
const promptResults = ref<PromptResult[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const isResetting = ref(false);
const searchQuery = ref("");

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
    // Fetch both overall results and per-prompt results
    const [overallData, promptsData] = await Promise.all([
      $api<VoteResults>("/results", { method: "GET" }),
      $api<PromptResultsResponse>("/results/prompts", { method: "GET" }),
    ]);
    results.value = overallData;
    promptResults.value = promptsData.prompts || [];
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

// Filter prompts based on search query
const filteredPromptResults = computed(() => {
  if (!searchQuery.value.trim()) {
    return promptResults.value;
  }
  const query = searchQuery.value.toLowerCase().trim();
  return promptResults.value.filter((prompt) =>
    prompt.prompt_text.toLowerCase().includes(query)
  );
});

// Helper function to get color for each model
const getModelColor = (modelId: ModelName): string => {
  const colorMap: Record<ModelName, string> = {
    gpt5: "hsl(217, 91%, 60%)",        // Blue
    gemini25: "hsl(142, 71%, 45%)",    // Green
    flux1_dev: "hsl(280, 70%, 50%)",   // Purple
    flux1_krea: "hsl(0, 72%, 51%)",    // Red
    kolors: "hsl(38, 92%, 50%)",       // Orange/Yellow
  };
  return colorMap[modelId] || "hsl(217, 91%, 60%)"; // Default to blue
};

// Helper functions for per-prompt data
const getDecisiveVotes = (prompt: PromptResult): number => {
  return Math.max(0, prompt.total_votes - prompt.tie_votes);
};

const getWinningImage = (prompt: PromptResult): PromptResultImage | null => {
  if (!prompt.winning_image_id) return null;
  return prompt.images.find((img) => img.image_id === prompt.winning_image_id) || null;
};

const getWinningModel = (prompt: PromptResult): PromptResultModel | null => {
  if (!prompt.winning_model_id) return null;
  return prompt.models.find((model) => model.model_id === prompt.winning_model_id) || null;
};

// Helper to detect ties and get tied models/images
const getTiedWinners = (prompt: PromptResult): Array<{ model: PromptResultModel; image: PromptResultImage }> => {
  const decisiveVotes = getDecisiveVotes(prompt);
  if (decisiveVotes === 0) return [];
  
  // Find the highest win percentage
  const maxWinPercentage = Math.max(...prompt.models.map(m => m.win_percentage));
  
  // Get all models tied for the highest percentage
  const tiedModels = prompt.models.filter(m => m.win_percentage === maxWinPercentage && m.win_percentage > 0);
  
  // Get images for tied models
  const tiedWinners = tiedModels
    .map(model => {
      const image = prompt.images.find(img => img.model === model.model_id);
      return image ? { model, image } : null;
    })
    .filter((item): item is { model: PromptResultModel; image: PromptResultImage } => item !== null);
  
  return tiedWinners;
};

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
