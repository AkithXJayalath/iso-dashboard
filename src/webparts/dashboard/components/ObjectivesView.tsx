// ObjectivesView.tsx
// Full tree renderer for one year's objectives data.
// Renders OverallScoreSummary at the top followed by one DomainCard per domain.
// Manages the per-domain refs so that clicking a summary card can scroll to
// and expand the corresponding DomainCard.

import * as React from "react";
import { Button } from "antd";
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
  const [showAll, setShowAll] = React.useState(false);

  const PAGE = 4;
  const visibleDomains = showAll ? domains : domains.slice(0, PAGE);
  const hasMore = domains.length > PAGE;

  return (
    <div>
      <OverallScoreSummary domains={domains} thresholds={thresholds} />

      {visibleDomains.map((domain, idx) => (
        <DomainCard key={idx} domain={domain} thresholds={thresholds} />
      ))}

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 8, marginBottom: 4 }}>
          <Button
            prefixCls="iso-ant-btn"
            size="small"
            onClick={() => setShowAll((v) => !v)}
            style={{ fontSize: 12, minWidth: 140 }}
          >
            {showAll
              ? `▲ Show less`
              : `▼ View ${domains.length - PAGE} more domains`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ObjectivesView;
