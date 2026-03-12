// ObjectivesView.tsx
// Full tree renderer for one year's objectives data.
// Renders OverallScoreSummary at the top followed by one DomainCard per domain.
// Manages the per-domain refs so that clicking a summary card can scroll to
// and expand the corresponding DomainCard.

import * as React from "react";
import { IDomain } from "../utils/objectivesParser";
import { IScoreThresholds } from "../config/objectivesConfig";
import OverallScoreSummary from "./OverallScoreSummary";
import DomainCard from "./DomainCard";

interface IObjectivesViewProps {
  domains: IDomain[];
  thresholds: IScoreThresholds;
}

const ObjectivesView: React.FC<IObjectivesViewProps> = ({
  domains,
  thresholds,
}) => {
  return (
    <div>
      <OverallScoreSummary domains={domains} thresholds={thresholds} />

      {domains.map((domain, idx) => (
        <DomainCard key={idx} domain={domain} thresholds={thresholds} />
      ))}
    </div>
  );
};

export default ObjectivesView;
