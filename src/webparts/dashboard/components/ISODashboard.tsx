import * as React from "react";
import { Button, ConfigProvider, Typography } from "antd";
import { StyleProvider, createCache } from "@ant-design/cssinjs";
import { REGISTRIES } from "../config/registryConfig";
import {
  EXCEL_FINDINGS_SOURCES,
  EXCEL_OBJECTIVES_SOURCES,
} from "../config/excelSourcesConfig";
import RegistryDashboardView from "./RegistryDashboardView";
import OverviewPage from "./OverviewPage";
import UpcomingEventsSection from "./UpcomingEventsSection";
import FindingsSection from "./FindingsSection";
import ObjectivesSection from "./ObjectivesSection";
import AllRegistersSection from "./AllRegistersSection";
import styles from "./ISODashboard.module.scss";

const { Title } = Typography;

interface IISODashboardProps {
  siteUrl: string;
}

// Stable cache instance — created once per web part load
const styleCache = createCache();

type TView = "overview" | "detail";

const ISODashboard: React.FC<IISODashboardProps> = ({ siteUrl }) => {
  const [view, setView] = React.useState<TView>("overview");
  const [selectedRegistryId, setSelectedRegistryId] = React.useState<string>(
    REGISTRIES[0].id,
  );
  const selectedRegistry =
    REGISTRIES.find((r) => r.id === selectedRegistryId) || REGISTRIES[0];

  const handleViewDetails = (registryId: string): void => {
    if (REGISTRIES.find((r) => r.id === registryId)) {
      setSelectedRegistryId(registryId);
    }
    setView("detail");
  };

  const handleBack = (): void => {
    setView("overview");
  };

  return (
    // StyleProvider scopes antd CSS-in-JS to this div so styles don't leak
    // into SharePoint's global stylesheet.
    <StyleProvider cache={styleCache}>
      <ConfigProvider
        prefixCls="iso-ant"
        theme={{
          token: {
            colorPrimary: "#0078d4",
            colorBgBase: "#ffffff",
            colorTextBase: "#323130",
            borderRadius: 6,
            fontFamily:
              '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
            fontSize: 13,
          },
          components: {
            Card: { paddingLG: 16 },
            Table: { cellFontSize: 13 },
          },
        }}
      >
        <div className={styles.isoDashboardScope}>
          {/*  Top bar  */}
          <div className={styles.topBar}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {view === "detail" && (
                <Button
                  prefixCls="iso-ant-btn"
                  size="small"
                  onClick={handleBack}
                  style={{ fontSize: 12 }}
                >
                  ← Back
                </Button>
              )}
              <Title
                level={3}
                style={{ margin: 0, color: "#0078d4", fontSize: 20 }}
              >
                {view === "overview" ? "ISO Dashboard" : selectedRegistry.label}
              </Title>
            </div>
          </div>

          {/*  Main content  */}
          <div className={styles.mainContent}>
            {/* Upcoming ISMS Events — shown on the overview page only */}
            {view === "overview" && <UpcomingEventsSection siteUrl={siteUrl} />}

            {/* Findings sections — one per entry in EXCEL_FINDINGS_SOURCES */}
            {view === "overview" &&
              EXCEL_FINDINGS_SOURCES.map((source) => (
                <FindingsSection
                  key={source.id}
                  siteUrl={siteUrl}
                  source={source}
                />
              ))}

            {/* ISMS Objectives sections — one per entry in EXCEL_OBJECTIVES_SOURCES */}
            {view === "overview" &&
              EXCEL_OBJECTIVES_SOURCES.map((source) => (
                <ObjectivesSection
                  key={source.id}
                  siteUrl={siteUrl}
                  source={source}
                />
              ))}

            {/* All Registers — files in the configured SharePoint folder */}
            {view === "overview" && <AllRegistersSection siteUrl={siteUrl} />}

            {view === "overview" ? (
              <OverviewPage
                siteUrl={siteUrl}
                onViewDetails={handleViewDetails}
              />
            ) : (
              <RegistryDashboardView
                key={selectedRegistry.id} // force remount on registry switch = clean state
                registry={selectedRegistry}
                thresholdDays={selectedRegistry.defaultThresholdDays}
                siteUrl={siteUrl}
              />
            )}
          </div>
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
};

export default ISODashboard;
