// objectivesConfig.ts

export const OBJECTIVES_COLUMNS = {
  colA: 0,
  colB: 1,
  colC: 2,
  frequency: 3,
  weighting: 4,
  lowerThreshold: 5,
  midThreshold: 6,
  upperThreshold: 7,
  metricValue: 8,
  metricScore: 9,
  subDomainScore: 10,
  domainScore: 11,
  comments: 12,
} as const;

export type IObjectivesColumns = typeof OBJECTIVES_COLUMNS;

export interface IScoreThreshold {
  max: number;
  label: string;
  color: string;
}

export interface IScoreThresholds {
  low: IScoreThreshold;
  acceptable: IScoreThreshold;
  achieved: IScoreThreshold;
}

export const DEFAULT_SCORE_THRESHOLDS: IScoreThresholds = {
  low: { max: 0.69, label: "Not Achieved", color: "#ff4d4f" },
  acceptable: { max: 0.89, label: "Acceptable", color: "#faad14" },
  achieved: { max: 1.0, label: "Achieved", color: "#52c41a" },
};
