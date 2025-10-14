export type ModelName = "gpt5" | "gemini25" | string;

export interface ImageDTO {
  url: string;
  model: ModelName;
}

export interface PairDTO {
  done: boolean;
  pair_id: string;
  prompt_id: string;
  prompt_text: string;
  left: ImageDTO;
  right: ImageDTO;
  total_pairs: number;
  pairs_completed: number;
  pairs_remaining: number;
}

export interface VotePayload {
  session_id: string;
  pair_id: string;
  winner_model: ModelName | "tie";
  left_model: ModelName;
  reaction_time_ms: number;
}

export interface SessionStatus {
  session_id: string;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  last_activity: string;
  completed_at: string | null;
  total_votes: number;
  total_pairs: number;
}