// RegistrySectionCard.tsx
// Full-width card shown on the Overview landing page for one registry.
// Fetches its own data, renders a StatusPieChart + OverdueSummaryCard side-by-side,
// and provides a "View Details" button to navigate to the full detail view.

import * as React from "react";
import { Alert, Button, Card, Col, Row, Spin, Tag, Typography } from "antd";
import { IRegistryConfig } from "../config/registryConfig";
import { useRegistryData } from "../hooks/useRegistryData";
import StatusPieChart from "./StatusPieChart";
import OverdueSummaryCard from "./OverdueSummaryCard";

const { Title } = Typography;

interface IRegistrySectionCardProps {
  registry: IRegistryConfig;
  siteUrl: string;
  thresholdDays: number;
  onViewDetails: (registryId: string) => void;
}

const RegistrySectionCard: React.FC<IRegistrySectionCardProps> = ({
  registry,
  siteUrl,
  thresholdDays,
  onViewDetails,
}) => {
  const { items, loading, error } = useRegistryData(registry, siteUrl);

  const handleViewDetails = (): void => onViewDetails(registry.id);

  const headerContent = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Title level={5} style={{ margin: 0, fontSize: 15, color: "#1d1d1d" }}>
          {registry.label}
        </Title>
        {!loading && !error && (
          <Tag
            color="blue"
            style={{ fontSize: 11, lineHeight: "18px", padding: "0 6px" }}
          >
            {items.length} item{items.length !== 1 ? "s" : ""}
          </Tag>
        )}
      </div>
      <Button
        prefixCls="iso-ant-btn"
        type="primary"
        size="small"
        onClick={handleViewDetails}
        disabled={loading || !!error}
        style={{ fontSize: 12 }}
      >
        View Details →
      </Button>
    </div>
  );

  return (
    <Card
      prefixCls="iso-ant-card"
      title={headerContent}
      size="small"
      style={{
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        marginBottom: 16,
      }}
      headStyle={{ padding: "10px 16px" }}
      bodyStyle={{ padding: 16 }}
    >
      {loading && (
        <div style={{ textAlign: "center", padding: "28px 0" }}>
          <Spin prefixCls="iso-ant-spin" tip={`Loading ${registry.label}…`} />
        </div>
      )}

      {!loading && error && (
        <Alert
          prefixCls="iso-ant-alert"
          type="error"
          showIcon
          message="Failed to load registry data"
          description={error}
          style={{ borderRadius: 6 }}
        />
      )}

      {!loading && !error && (
        <Row gutter={[16, 16]} align="stretch">
          {/* Status doughnut */}
          <Col xs={24} md={14}>
            <StatusPieChart items={items} registry={registry} />
          </Col>

          {/* Overdue notification */}
          <Col xs={24} md={10}>
            <OverdueSummaryCard
              registry={registry}
              items={items}
              thresholdDays={thresholdDays}
              onClick={handleViewDetails}
            />
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default RegistrySectionCard;
