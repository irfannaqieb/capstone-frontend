export type ModelName = "gpt" | "gemini";

export interface ImageDTO {
  id: string;
  url: string;
  model: ModelName;
}

export interface PairDTO {
  pair_id: string;
  prompt_id: string;
  prompt_text: string;
  image_a: ImageDTO;
  image_b: ImageDTO;
  progress?: { done: number; total: number };
}

export interface VotePayload {
  session_id: string;
  pair_id: string;
  winner_model: ModelName | "tie";
}
