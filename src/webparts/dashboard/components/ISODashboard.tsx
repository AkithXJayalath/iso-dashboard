// ISODashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Main shell for the ISO Registry Tracker Dashboard.
//
// Style isolation strategy for SharePoint:
//   1. ConfigProvider with prefixCls="iso-ant" so antd component CSS classes
//      are namespaced and never clash with Fluent UI / SharePoint globals.
//   2. StyleProvider injects antd's CSS-in-JS styles into a scoped container
//      element (the iso-dashboard-scope div) rather than <head>.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react";
import { ConfigProvider, Divider, Typography } from "antd";
import { StyleProvider, createCache } from "@ant-design/cssinjs";
import { REGISTRIES, IRegistryConfig } from "../config/registryConfig";
import RegistrySelector from "./RegistrySelector";
import ThresholdControl from "./ThresholdControl";
import RegistryDashboardView from "./RegistryDashboardView";
import styles from "./ISODashboard.module.scss";

const { Title } = Typography;

interface IISODashboardProps {
  siteUrl: string;
}

// Stable cache instance — created once per web part load
const styleCache = createCache();

const ISODashboard: React.FC<IISODashboardProps> = ({ siteUrl }) => {
  const [selectedRegistry, setSelectedRegistry] =
    React.useState<IRegistryConfig>(REGISTRIES[0]);
  const [thresholdDays, setThresholdDays] = React.useState<number>(
    REGISTRIES[0].defaultThresholdDays,
  );

  // When the user switches registries, reset threshold to that registry's default
  const handleRegistryChange = (registry: IRegistryConfig): void => {
    setSelectedRegistry(registry);
    setThresholdDays(registry.defaultThresholdDays);
  };

  return (
    // StyleProvider scopes antd CSS-in-JS to this div so styles don't leak
    // into SharePoint's global stylesheet.
    <StyleProvider cache={styleCache}>
      <ConfigProvider
        prefixCls="iso-ant"
        theme={{
          token: {
            colorPrimary: "#0078d4", // SharePoint blue
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
          {/* ── Top bar ──────────────────────────────────────────────────── */}
          <div className={styles.topBar}>
            <Title
              level={3}
              style={{ margin: 0, color: "#0078d4", fontSize: 20 }}
            >
              ISO Registry Tracker
            </Title>
            <div className={styles.controls}>
              <RegistrySelector
                selected={selectedRegistry}
                onSelect={handleRegistryChange}
              />
              <Divider
                type="vertical"
                style={{ height: 28, margin: "0 12px" }}
              />
              <ThresholdControl
                value={thresholdDays}
                onChange={setThresholdDays}
              />
            </div>
          </div>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className={styles.mainContent}>
            <RegistryDashboardView
              key={selectedRegistry.id} // force remount on switch = clean state
              registry={selectedRegistry}
              thresholdDays={thresholdDays}
              siteUrl={siteUrl}
            />
          </div>
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
};

export default ISODashboard;
