// MetricRow.tsx
// Displays a single metric within a sub-domain panel.
// Shows: metric code + description, frequency badge, weighting, metric value,
// colored score chip, a 3-zone threshold indicator bar, and optional comments.

import * as React from "react";
import { Typography } from "antd";
import { IMetric } from "../utils/objectivesParser";
import { formatScore } from "../utils/scoreUtils";

const { Text } = Typography;

/** Returns a color based on whether the score meets, partially meets, or misses the weighting. */
function weightColor(score: number | undefined, weighting: number): string {
  if (score === undefined || score === 0) return "#ff4d4f"; // red — nothing achieved
  if (score >= weighting - 0.001) return "#52c41a"; // green — fully achieved
  return "#faad14"; // amber — partial
}

// ── MetricRow ─────────────────────────────────────────────────────────────────

interface IMetricRowProps {
  metric: IMetric;
}

const MetricRow: React.FC<IMetricRowProps> = ({ metric }) => {
  const scoreColor = weightColor(metric.metricScore, metric.weighting);
  // Strip the leading code (e.g. "1.A.1 ") from the label so it isn't shown twice
  const displayLabel =
    metric.code && metric.label.startsWith(metric.code)
      ? metric.label.slice(metric.code.length).replace(/^\.?\s*/, "")
      : metric.label;

  return (
    <div
      style={{
        padding: "10px 12px",
        borderBottom: "1px solid #f0f0f0",
        background: "#fff",
      }}
    >
      {/* Top row: code + description | frequency badge | weighting | score chip */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* Code + description */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {metric.code && (
            <span
              style={{
                background: "#f6f6f6",
                color: "#595959",
                border: "1px solid #d9d9d9",
                borderRadius: 4,
                padding: "1px 6px",
                fontSize: 10,
                fontWeight: 600,
                marginRight: 6,
                whiteSpace: "nowrap",
              }}
            >
              {metric.code}
            </span>
          )}
          <Text style={{ fontSize: 12, color: "#323130" }}>{displayLabel}</Text>
        </div>

        {/* Right-side metadata */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {/* Frequency badge */}
          {metric.frequency && (
            <span
              style={{
                background: "#f0f5ff",
                color: "#2f54eb",
                border: "1px solid #adc6ff",
                borderRadius: 4,
                padding: "1px 6px",
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {metric.frequency}
            </span>
          )}

          {/* Weighting */}
          <Text
            style={{ fontSize: 11, color: "#8c8c8c", whiteSpace: "nowrap" }}
          >
            W: {metric.weighting}
          </Text>

          {/* Metric value → Score (color-coded vs weighting) */}
          <Text
            style={{ fontSize: 11, color: "#8c8c8c", whiteSpace: "nowrap" }}
          >
            val:{" "}
            {metric.metricValue !== undefined
              ? metric.metricValue.toFixed(2)
              : "—"}
            {" → score: "}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: scoreColor,
              whiteSpace: "nowrap",
            }}
          >
            {formatScore(metric.metricScore)}
          </Text>
          <Text
            style={{ fontSize: 10, color: "#8c8c8c", whiteSpace: "nowrap" }}
          >
            / {metric.weighting}
          </Text>
        </div>
      </div>

      {/* Comments */}
      {metric.comments && (
        <div
          style={{
            marginTop: 6,
            paddingTop: 6,
            borderTop: "1px dashed #f0f0f0",
          }}
        >
          <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
            <strong>Note:</strong> {metric.comments}
          </Text>
        </div>
      )}
    </div>
  );
};

export default MetricRow;
