// ObjectivesSection.tsx
// Top-level shell for the ISMS Objectives (Information Security Metrics) section.
// Renders a section header, a year selector dropdown, and delegates to
// ObjectivesView for the full domain-tree display.

import * as React from "react";
import { Alert, Select, Skeleton, Typography } from "antd";
import { IExcelObjectivesSource } from "../config/excelSourcesConfig";
import { useObjectivesData } from "../hooks/useObjectivesData";
import ObjectivesView from "./ObjectivesView";

const { Title, Text } = Typography;

interface IObjectivesSectionProps {
  siteUrl: string;
  source: IExcelObjectivesSource;
}

const ObjectivesSection: React.FC<IObjectivesSectionProps> = ({
  siteUrl,
  source,
}) => {
  const [selectedYear, setSelectedYear] = React.useState<string>("");

  const { data, years, loading, error } = useObjectivesData(
    siteUrl,
    source,
    selectedYear,
  );

  // Auto-select the most recent year once the workbook is parsed
  React.useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const yearOptions = years.map((y) => ({ label: y, value: y }));

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 10,
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "14px 20px",
          borderBottom: "1px solid #f0f0f0",
          background: "linear-gradient(135deg, #f0f5ff 0%, #fff 100%)",
        }}
      >
        <div>
          <Title
            level={5}
            style={{ margin: 0, fontSize: 15, color: "#0078d4" }}
          >
            {source.label}
          </Title>
          {!loading && data && (
            <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
              {data.length} domain{data.length !== 1 ? "s" : ""} •{" "}
              {data.reduce((sum, d) => sum + d.subDomains.length, 0)}{" "}
              sub-domains •{" "}
              {data.reduce(
                (sum, d) =>
                  sum +
                  d.subDomains.reduce((s, sd) => s + sd.metrics.length, 0),
                0,
              )}{" "}
              metrics
            </Text>
          )}
        </div>

        {/* Year selector */}
        {years.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 12, color: "#595959" }}>Year:</Text>
            <Select
              prefixCls="iso-ant-select"
              value={selectedYear || undefined}
              options={yearOptions}
              onChange={(val: string) => setSelectedYear(val)}
              style={{ width: 100 }}
              size="small"
              loading={loading && years.length === 0}
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px" }}>
        {/* Loading state */}
        {loading && (
          <div>
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <Alert
            prefixCls="iso-ant-alert"
            type="error"
            showIcon
            message="Failed to load objectives data"
            description={error}
            style={{ borderRadius: 6 }}
          />
        )}

        {/* Empty state — file loaded but no year sheets found */}
        {!loading && !error && years.length === 0 && (
          <Alert
            prefixCls="iso-ant-alert"
            type="warning"
            showIcon
            message="No year sheets detected"
            description="The objectives workbook was loaded but no sheets with 4-digit year names (e.g. 2025, 2026) were found."
            style={{ borderRadius: 6 }}
          />
        )}

        {/* Data view */}
        {!loading && !error && data && data.length > 0 && (
          <ObjectivesView domains={data} thresholds={source.scoreThresholds} />
        )}

        {/* Loaded but empty */}
        {!loading && !error && data !== undefined && data.length === 0 && (
          <Alert
            prefixCls="iso-ant-alert"
            type="info"
            showIcon
            message={`No domain data found for ${selectedYear}`}
            description="The selected year sheet was found but contained no domain rows."
            style={{ borderRadius: 6 }}
          />
        )}
      </div>
    </div>
  );
};

export default ObjectivesSection;
