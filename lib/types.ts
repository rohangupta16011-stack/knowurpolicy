export type Flag = "green" | "yellow" | "red";

export type ClauseItem = {
  title: string;
  explanation: string;
  flag: Flag;
};

export type ComplexityLabel = "Easy" | "Moderate" | "Complex" | "Very Complex";

export type AnalysisResult = {
  summary: string;
  covered: ClauseItem[];
  not_covered: ClauseItem[];
  deadlines_and_limits: ClauseItem[];
  your_obligations: ClauseItem[];
  watch_list: ClauseItem[];
  plain_english_score: {
    score: number;
    label: ComplexityLabel;
    note: string;
  };
};

export type AnalyzeError =
  | { kind: "file_too_large" }
  | { kind: "unsupported_type" }
  | { kind: "extraction_failed" }
  | { kind: "scanned_image" }
  | { kind: "too_short" }
  | { kind: "not_a_policy" }
  | { kind: "model_failed" }
  | { kind: "unknown"; message?: string };
