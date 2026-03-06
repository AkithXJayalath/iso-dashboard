import * as React from "react";
import type { IDashboardProps } from "./IDashboardProps";
import ISODashboard from "./ISODashboard";

/**
 * Dashboard – thin wrapper that connects the SPFx web part context
 * (props from DashboardWebPart.ts) to the self-contained ISODashboard.
 */
const Dashboard: React.FC<IDashboardProps> = ({ siteUrl }) => {
  return <ISODashboard siteUrl={siteUrl} />;
};

export default Dashboard;
