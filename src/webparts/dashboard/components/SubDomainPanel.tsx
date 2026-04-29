// SubDomainPanel.tsx

import * as React from "react";
import { Typography } from "antd";
import { ISubDomain } from "../utils/objectivesParser";
import { formatScore } from "../utils/scoreUtils";
import MetricRow from "./MetricRow";

const { Text } = Typography;

function weightColor(score: number | undefined, weighting: number): string {
  if (score === undefined || score === 0) return "#ff4d4f"; // red — nothing achieved
  if (score >= weighting - 0.001) return "#52c41a"; // green — fully achieved
  return "#faad14"; // amber — partial
}

interface ISubDomainPanelProps {
  subDomain: ISubDomain;
}

const SubDomainPanel: React.FC<ISubDomainPanelProps> = ({ subDomain }) => {
  const [expanded, setExpanded] = React.useState(false);
  const scoreColor = weightColor(subDomain.subDomainScore, subDomain.weighting);
  // Strip the leading code (e.g. "1.A ") from the label so it isn't shown twice
  const displayLabel =
    subDomain.code && subDomain.label.startsWith(subDomain.code)
      ? subDomain.label.slice(subDomain.code.length).replace(/^\.?\s*/, "")
      : subDomain.label;

  return (
    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: 6,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      {/* Sub-domain header — always visible */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "#fafafa",
          cursor: "pointer",
          userSelect: "none",
          flexWrap: "wrap",
        }}
      >
        {/* Code badge */}
        {subDomain.code && (
          <span
            style={{
              background: "#e6f4ff",
              color: "#0958d9",
              border: "1px solid #91caff",
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {subDomain.code}
          </span>
        )}

        {/* Label — code prefix already shown in the badge above */}
        <Text
          style={{
            flex: 1,
            fontSize: 12,
            color: "#323130",
            fontWeight: 500,
            minWidth: 120,
          }}
        >
          {displayLabel}
        </Text>

        {/* Score + metadata */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {/* Numeric score — color-coded vs weighting */}
          <Text style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>
            {formatScore(subDomain.subDomainScore)}
          </Text>
          <Text style={{ fontSize: 10, color: "#8c8c8c" }}>
            / {subDomain.weighting}
          </Text>

          {/* Weighting label */}
          <Text style={{ fontSize: 10, color: "#8c8c8c" }}>
            W: {subDomain.weighting}
          </Text>

          {/* Metric count */}
          <Text style={{ fontSize: 10, color: "#8c8c8c" }}>
            {subDomain.metrics.length} metric
            {subDomain.metrics.length !== 1 ? "s" : ""}
          </Text>

          {/* Toggle chevron */}
          <span
            style={{
              fontSize: 12,
              color: "#8c8c8c",
              transition: "transform 0.2s",
              display: "inline-block",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Collapsible metrics body */}
      {expanded && subDomain.metrics.length > 0 && (
        <div>
          {subDomain.metrics.map((metric, idx) => (
            <MetricRow key={idx} metric={metric} />
          ))}
        </div>
      )}

      {expanded && subDomain.metrics.length === 0 && (
        <div style={{ padding: "12px 16px" }}>
          <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
            No metrics found for this sub-domain.
          </Text>
        </div>
      )}
    </div>
  );
};

export default SubDomainPanel;
