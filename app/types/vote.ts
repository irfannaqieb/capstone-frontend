export type ModelName = "gpt5" | "gemini25" | "flux1_dev" | "flux1_krea" | "kolors";

export interface ImageDTO {
  image_id: string;
  url: string;
  model: ModelName;
}

export interface PromptDTO {
  done: boolean;
  prompt_id: string;
  prompt_text: string;
  images: ImageDTO[];
  index: number;
  total: number;
  chunk_id: string;
}

export interface VotePayload {
  session_id: string;
  prompt_id: string;
  winner_model: ModelName | "tie";
  reaction_time_ms: number;
}

export interface SessionStatus {
  session_id: string;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  last_activity: string;
  completed_at: string | null;
  total_votes: number;
  total_prompts: number;
}

export interface PromptHistory {
  prompt: PromptDTO;
  vote: ModelName | "tie" | null;
}

export interface ModelResult {
  model_id: ModelName;
  display_name: string;
  wins: number;
  win_percentage: number;
}

export interface VoteResults {
  total_votes: number;
  total_decisive_votes: number;
  tie_votes: number;
  models: ModelResult[];
}