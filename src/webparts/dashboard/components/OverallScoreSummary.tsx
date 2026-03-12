// OverallScoreSummary.tsx
// Year-level aggregate stats for all domains.
// Shows Achieved / Acceptable / Not Achieved counts and an overall progress bar.

import * as React from "react";
import { Col, Row, Statistic, Typography } from "antd";
import { IDomain } from "../utils/objectivesParser";
import { IScoreThresholds } from "../config/objectivesConfig";
const { Text } = Typography;

// ── Stats computation ─────────────────────────────────────────────────────────

interface IDomainStats {
  achieved: number;
  acceptable: number;
  notAchieved: number;
  total: number;
}

function computeDomainStats(
  domains: IDomain[],
  thresholds: IScoreThresholds,
): IDomainStats {
  let achieved = 0;
  let acceptable = 0;
  let notAchieved = 0;

  for (const domain of domains) {
    const score = domain.domainScore ?? 0;
    if (score > thresholds.acceptable.max) {
      achieved++;
    } else if (score > thresholds.low.max) {
      acceptable++;
    } else {
      notAchieved++;
    }
  }

  return {
    achieved,
    acceptable,
    notAchieved,
    total: achieved + acceptable + notAchieved,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface IOverallScoreSummaryProps {
  domains: IDomain[];
  thresholds: IScoreThresholds;
}

const OverallScoreSummary: React.FC<IOverallScoreSummaryProps> = ({
  domains,
  thresholds,
}) => {
  const stats = React.useMemo(
    () => computeDomainStats(domains, thresholds),
    [domains, thresholds],
  );

  if (stats.total === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <Text
        strong
        style={{
          display: "block",
          fontSize: 11,
          color: "#8c8c8c",
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Year Summary
      </Text>

      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <Statistic
              prefixCls="iso-ant-statistic"
              title="Achieved"
              value={stats.achieved}
              suffix={` / ${stats.total}`}
              valueStyle={{ color: "#52c41a", fontSize: 24, fontWeight: 700 }}
            />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#fffbe6",
              border: "1px solid #ffe58f",
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <Statistic
              prefixCls="iso-ant-statistic"
              title="Acceptable"
              value={stats.acceptable}
              suffix={` / ${stats.total}`}
              valueStyle={{ color: "#faad14", fontSize: 24, fontWeight: 700 }}
            />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#fff1f0",
              border: "1px solid #ffa39e",
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <Statistic
              prefixCls="iso-ant-statistic"
              title="Not Achieved"
              value={stats.notAchieved}
              suffix={` / ${stats.total}`}
              valueStyle={{ color: "#ff4d4f", fontSize: 24, fontWeight: 700 }}
            />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#f0f5ff",
              border: "1px solid #adc6ff",
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <Statistic
              prefixCls="iso-ant-statistic"
              title="Total Domains"
              value={stats.total}
              valueStyle={{ color: "#2f54eb", fontSize: 24, fontWeight: 700 }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default OverallScoreSummary;
