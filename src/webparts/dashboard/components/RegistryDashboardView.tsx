// RegistryDashboardView.tsx
// Renders TimelineChart + StatusPieChart + OverdueItemsPanel for one registry.
// Handles loading / error states from useRegistryData.

import * as React from "react";
import { Row, Col, Card, Spin, Alert, Typography } from "antd";
import { IRegistryConfig } from "../config/registryConfig";
import { useRegistryData } from "../hooks/useRegistryData";
import TimelineChart from "./TimelineChart";
import StatusPieChart from "./StatusPieChart";
import OverdueItemsPanel from "./OverdueItemsPanel";

const { Title } = Typography;

interface IRegistryDashboardViewProps {
  registry: IRegistryConfig;
  thresholdDays: number;
  siteUrl: string;
}

const RegistryDashboardView: React.FC<IRegistryDashboardViewProps> = ({
  registry,
  thresholdDays,
  siteUrl,
}) => {
  const { items, loading, error } = useRegistryData(registry, siteUrl);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spin
          prefixCls="iso-ant-spin"
          size="large"
          tip={`Loading ${registry.label}…`}
        />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        prefixCls="iso-ant-alert"
        type="error"
        showIcon
        message="Failed to load registry data"
        description={error}
        style={{ margin: "24px 0", borderRadius: 6 }}
      />
    );
  }

  return (
    <div className="iso-registry-view">
      <Title level={4} style={{ marginBottom: 16, color: "#1d1d1d" }}>
        {registry.label}
        <span
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: "#8c8c8c",
            marginLeft: 12,
          }}
        >
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </Title>

      {/* Charts row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            prefixCls="iso-ant-card"
            title="Items Added Over Time"
            size="small"
            style={{ borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            headStyle={{ fontSize: 13, fontWeight: 600 }}
          >
            <TimelineChart items={items} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            prefixCls="iso-ant-card"
            title="Status Distribution"
            size="small"
            style={{ borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            headStyle={{ fontSize: 13, fontWeight: 600 }}
          >
            <StatusPieChart registry={registry} items={items} />
          </Card>
        </Col>
      </Row>

      {/* Overdue panel */}
      <Card
        prefixCls="iso-ant-card"
        title="Overdue Items"
        size="small"
        style={{ borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
        headStyle={{ fontSize: 13, fontWeight: 600 }}
      >
        <OverdueItemsPanel
          registry={registry}
          items={items}
          thresholdDays={thresholdDays}
        />
      </Card>
    </div>
  );
};

export default RegistryDashboardView;
