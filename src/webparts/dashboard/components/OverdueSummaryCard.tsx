// OverdueSummaryCard.tsx
// Notification-style card summarising both overdue types for one registry.
// Displayed on the Overview landing page inside each RegistrySectionCard.

import * as React from "react";
import { Typography } from "antd";
import { IRegistryConfig } from "../config/registryConfig";
import { IRegistryItem } from "../hooks/useRegistryData";
import { buildOverdueSummary } from "../utils/overdueUtils";

const { Text } = Typography;

interface IOverdueSummaryCardProps {
  registry: IRegistryConfig;
  items: IRegistryItem[];
  thresholdDays: number;
  onClick?: () => void;
}

const OverdueSummaryCard: React.FC<IOverdueSummaryCardProps> = ({
  registry,
  items,
  thresholdDays,
  onClick,
}) => {
  const summary = React.useMemo(
    () => buildOverdueSummary(items, registry, thresholdDays),
    [items, registry, thresholdDays],
  );

  const baseStyle: React.CSSProperties = {
    borderRadius: 8,
    padding: "14px 16px",
    cursor: onClick ? "pointer" : "default",
    transition: "box-shadow 0.15s",
  };

  if (summary.totalFlagged === 0) {
    return (
      <div
        onClick={onClick}
        style={{
          ...baseStyle,
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text strong style={{ color: "#389e0d", fontSize: 13 }}>
            All items on track
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyle,
        background: "#fffbe6",
        border: "1px solid #ffe58f",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Text strong style={{ color: "#d48806", fontSize: 13 }}>
          Overdue Summary
        </Text>
      </div>

      {/* Type A — completion overdue */}
      {summary.completionOverdueCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#cf1322",
              flexShrink: 0,
            }}
          />
          <Text style={{ fontSize: 12, color: "#5c0011" }}>
            <strong>{summary.completionOverdueCount}</strong> item
            {summary.completionOverdueCount !== 1 ? "s" : ""} not completed past{" "}
            {thresholdDays}-day threshold
          </Text>
        </div>
      )}

      {/* Type B — stalling per status */}
      {summary.stallingByStatus.map((s) => (
        <div
          key={s.status}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#d46b08",
              flexShrink: 0,
            }}
          />
          <Text style={{ fontSize: 12, color: "#612500" }}>
            <strong>{s.count}</strong> item{s.count !== 1 ? "s" : ""} stalling
            in &ldquo;{s.status}&rdquo; &gt; {s.threshold} days
          </Text>
        </div>
      ))}

      {/* Total */}
      <div
        style={{
          borderTop: "1px solid #ffe58f",
          marginTop: 8,
          paddingTop: 8,
        }}
      >
        <Text style={{ fontSize: 12, color: "#614700" }}>
          Total flagged:{" "}
          <strong style={{ color: "#cf1322" }}>{summary.totalFlagged}</strong>{" "}
          item{summary.totalFlagged !== 1 ? "s" : ""}
        </Text>
      </div>
    </div>
  );
};

export default OverdueSummaryCard;
