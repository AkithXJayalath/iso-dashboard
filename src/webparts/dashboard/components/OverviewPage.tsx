// OverviewPage.tsx
// Landing page that scrolls through all registries at once.
// Each registry renders its own RegistrySectionCard (fetches independently).
// Calls onViewDetails(registryId) to navigate to the full detail view.

import * as React from "react";
import { Typography } from "antd";
import { REGISTRIES } from "../config/registryConfig";
import RegistrySectionCard from "./RegistrySectionCard";

const { Text } = Typography;

interface IOverviewPageProps {
  siteUrl: string;
  thresholdDays: number;
  onViewDetails: (registryId: string) => void;
}

const OverviewPage: React.FC<IOverviewPageProps> = ({
  siteUrl,
  thresholdDays,
  onViewDetails,
}) => {
  return (
    <div style={{ padding: "8px 0" }}>
      <Text
        style={{
          display: "block",
          fontSize: 12,
          color: "#8c8c8c",
          marginBottom: 16,
        }}
      >
        Showing all {REGISTRIES.length} registries — click{" "}
        <strong>View Details</strong> to drill into any one.
      </Text>

      {REGISTRIES.map((registry) => (
        <RegistrySectionCard
          key={registry.id}
          registry={registry}
          siteUrl={siteUrl}
          thresholdDays={thresholdDays}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default OverviewPage;
