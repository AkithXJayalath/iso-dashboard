// DomainCard.tsx

import * as React from "react";
import { Progress, Typography } from "antd";
import { IDomain } from "../utils/objectivesParser";
import { IScoreThresholds } from "../config/objectivesConfig";
import {
  getScoreStyle,
  formatScore,
  scoreToPercent,
} from "../utils/scoreUtils";
import SubDomainPanel from "./SubDomainPanel";

const { Text } = Typography;

interface IDomainCardProps {
  domain: IDomain;
  thresholds: IScoreThresholds;
}

const DomainCard: React.FC<IDomainCardProps> = ({ domain, thresholds }) => {
  const [expanded, setExpanded] = React.useState(true);

  const scoreStyle = getScoreStyle(domain.domainScore, thresholds);
  const pct = scoreToPercent(domain.domainScore);

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${scoreStyle.color}30`,
        borderRadius: 10,
        marginBottom: 16,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Domain header */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          background: `linear-gradient(135deg, ${scoreStyle.color}12 0%, #fff 100%)`,
          borderBottom: expanded ? "1px solid #f0f0f0" : "none",
          cursor: "pointer",
          userSelect: "none",
          flexWrap: "wrap",
        }}
      >
        {/* Domain number badge */}
        <span
          style={{
            background: scoreStyle.color,
            color: "#fff",
            borderRadius: 20,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {domain.number}
        </span>

        {/* Domain name */}
        <Text
          strong
          style={{
            flex: 1,
            fontSize: 14,
            color: "#1d1d1d",
            minWidth: 160,
          }}
        >
          {domain.label}
        </Text>

        {/* Score section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {/* Label "Domain Score:" */}
          <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Score:</Text>

          {/* Progress bar */}
          <Progress
            prefixCls="iso-ant-progress"
            percent={Math.round(pct)}
            strokeColor={scoreStyle.color}
            trailColor="#e8e8e8"
            showInfo={false}
            size="small"
            style={{ width: 120, marginBottom: 0 }}
          />

          {/* Numeric value */}
          <Text
            strong
            style={{ fontSize: 13, color: scoreStyle.color, minWidth: 32 }}
          >
            {formatScore(domain.domainScore)}
          </Text>

          {/* Band label */}
          <span
            style={{
              background: `${scoreStyle.color}18`,
              color: scoreStyle.color,
              border: `1px solid ${scoreStyle.color}50`,
              borderRadius: 4,
              padding: "1px 8px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {scoreStyle.label}
          </span>

          {/* Toggle chevron */}
          <span
            style={{
              fontSize: 13,
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

      {/* Collapsible sub-domain list */}
      {expanded && (
        <div style={{ padding: "12px 16px" }}>
          {domain.subDomains.length === 0 ? (
            <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
              No sub-domains found.
            </Text>
          ) : (
            domain.subDomains.map((sd, idx) => (
              <SubDomainPanel key={idx} subDomain={sd} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DomainCard;
