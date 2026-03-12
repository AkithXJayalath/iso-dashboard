import * as React from "react";
import { Alert, Button, Empty, Skeleton, Typography } from "antd";
import { IExcelFindingsSource } from "../config/excelSourcesConfig";
import { IFindingItem, useExcelSource } from "../hooks/useExcelSource";

const { Title, Text, Paragraph } = Typography;

interface IBadgeStyle {
  bg: string;
  text: string;
  border: string;
}

const CATEGORY_COLORS: Record<string, IBadgeStyle> = {
  Observation: { bg: "#e6f4ff", text: "#0958d9", border: "#91caff" },
  "Minor Non Conformity": { bg: "#fff7e6", text: "#d46b08", border: "#ffd591" },
  "Major Non Conformity": { bg: "#fff1f0", text: "#cf1322", border: "#ffa39e" },
};
const DEFAULT_BADGE: IBadgeStyle = {
  bg: "#f5f5f5",
  text: "#595959",
  border: "#d9d9d9",
};

interface ITextSection {
  label: string;
  content: string;
}

// Matches a line that is purely a section heading — with or without a trailing
// colon, and supports plural forms (Requirements, Observations, etc.)
const SECTION_HEADER_RE =
  /^(Requirements?|Observations?|Evidence|Non-conformity)\s*:?\s*$/i;

function parseFindingText(text: string): ITextSection[] {
  if (!text) return [];

  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  const sections: ITextSection[] = [];
  let currentLabel = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const headerMatch = SECTION_HEADER_RE.exec(line.trim());
    if (headerMatch) {
      // Flush previous section
      const content = currentLines.join("\n").trim();
      if (content) sections.push({ label: currentLabel, content });
      currentLabel = headerMatch[1];
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush last section
  const lastContent = currentLines.join("\n").trim();
  if (lastContent) sections.push({ label: currentLabel, content: lastContent });

  return sections.length > 0 ? sections : [{ label: "", content: text.trim() }];
}

const DetailRow: React.FC<{
  label: string;
  value: string | undefined;
  inline?: boolean;
}> = ({ label, value, inline }) => {
  if (!value) return null;
  return (
    <div
      style={inline ? { display: "flex", flexDirection: "column", gap: 1 } : {}}
    >
      <Text
        strong
        style={{
          fontSize: 11,
          color: "#8c8c8c",
          display: "block",
          marginBottom: 2,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 13, color: "#323130" }}>{value}</Text>
    </div>
  );
};

interface IFindingCardProps {
  item: IFindingItem;
  source: IExcelFindingsSource;
}

const FindingCard: React.FC<IFindingCardProps> = ({ item, source }) => {
  const [textExpanded, setTextExpanded] = React.useState(false);
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);
  const cols = source.columns;

  const hasField = (key: keyof typeof cols): boolean => cols[key] !== undefined;

  const categoryStyle = item.category
    ? (CATEGORY_COLORS[item.category] ?? DEFAULT_BADGE)
    : DEFAULT_BADGE;

  const findingSections = item.finding ? parseFindingText(item.finding) : [];
  const hasDetails =
    hasField("causeAnalysis") ||
    hasField("immediateAction") ||
    hasField("correctiveAction") ||
    hasField("plannedDate") ||
    hasField("auditee") ||
    hasField("auditor") ||
    hasField("followUpComments");

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
        }}
      >
        {/* Finding # badge */}
        {hasField("number") && item.number && (
          <span
            style={{
              background: "#f0f5ff",
              color: "#2f54eb",
              border: "1px solid #adc6ff",
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            #{item.number}
          </span>
        )}

        {/* Category badge */}
        {hasField("category") && item.category && (
          <span
            style={{
              background: categoryStyle.bg,
              color: categoryStyle.text,
              border: `1px solid ${categoryStyle.border}`,
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {item.category}
          </span>
        )}

        {/* ISO clause tag */}
        {hasField("clause") && item.clause && (
          <span
            style={{
              background: "#f6ffed",
              color: "#389e0d",
              border: "1px solid #b7eb8f",
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
            }}
          >
            {item.clause}
          </span>
        )}

        {/* Process area tag */}
        {hasField("processArea") && item.processArea && (
          <span
            style={{
              background: "#fafafa",
              color: "#595959",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 11,
            }}
          >
            {item.processArea}
          </span>
        )}
      </div>

      {/* Finding text*/}
      {hasField("finding") && findingSections.length > 0 && (
        <div>
          {findingSections.length === 1 && !findingSections[0].label ? (
            // No structured sections — plain truncated text
            <div>
              <Paragraph
                ellipsis={
                  !textExpanded ? { rows: 3, expandable: false } : false
                }
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#323130",
                  whiteSpace: "pre-wrap",
                }}
              >
                {findingSections[0].content}
              </Paragraph>
              {findingSections[0].content.length > 180 && (
                <Button
                  prefixCls="iso-ant-btn"
                  type="link"
                  size="small"
                  style={{ padding: 0, fontSize: 12, height: "auto" }}
                  onClick={() => setTextExpanded((e) => !e)}
                >
                  {textExpanded ? "Show less" : "Read more"}
                </Button>
              )}
            </div>
          ) : (
            // Structured sections (Requirement / Observation / Evidence)
            <div>
              {/* Always show first section */}
              <div style={{ marginBottom: 6 }}>
                {findingSections[0].label && (
                  <Text
                    strong
                    style={{
                      fontSize: 12,
                      color: "#595959",
                      display: "block",
                      marginBottom: 2,
                    }}
                  >
                    {findingSections[0].label}
                  </Text>
                )}
                <Paragraph
                  ellipsis={
                    !textExpanded ? { rows: 3, expandable: false } : false
                  }
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#323130",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {findingSections[0].content}
                </Paragraph>
              </div>

              {/* Remaining sections shown only when expanded */}
              {textExpanded &&
                findingSections.slice(1).map((sec, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    {sec.label && (
                      <Text
                        strong
                        style={{
                          fontSize: 12,
                          color: "#595959",
                          display: "block",
                          marginBottom: 2,
                        }}
                      >
                        {sec.label}
                      </Text>
                    )}
                    <Paragraph
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: "#323130",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {sec.content}
                    </Paragraph>
                  </div>
                ))}

              {findingSections.length > 1 && (
                <Button
                  prefixCls="iso-ant-btn"
                  type="link"
                  size="small"
                  style={{
                    padding: 0,
                    fontSize: 12,
                    height: "auto",
                    marginTop: 4,
                  }}
                  onClick={() => setTextExpanded((e) => !e)}
                >
                  {textExpanded
                    ? "Show less"
                    : `Read more (${findingSections.length - 1} more section${findingSections.length > 2 ? "s" : ""})`}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsible details */}
      {hasDetails && (
        <div>
          <Button
            prefixCls="iso-ant-btn"
            type="link"
            size="small"
            style={{ padding: 0, fontSize: 12, height: "auto" }}
            onClick={() => setDetailsExpanded((e) => !e)}
          >
            {detailsExpanded ? "▲ Hide details" : "▼ Show details"}
          </Button>

          {detailsExpanded && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {hasField("causeAnalysis") && item.causeAnalysis && (
                <DetailRow label="Cause Analysis" value={item.causeAnalysis} />
              )}
              {hasField("immediateAction") && item.immediateAction && (
                <DetailRow
                  label="Immediate Action"
                  value={item.immediateAction}
                />
              )}
              {hasField("correctiveAction") && item.correctiveAction && (
                <DetailRow
                  label="Corrective Action"
                  value={item.correctiveAction}
                />
              )}
              {hasField("plannedDate") && item.plannedDate && (
                <DetailRow
                  label="Planned Implementation Date"
                  value={item.plannedDate}
                />
              )}
              {(hasField("auditee") || hasField("auditor")) &&
                (item.auditee || item.auditor) && (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {hasField("auditee") && item.auditee && (
                      <DetailRow label="Auditee" value={item.auditee} inline />
                    )}
                    {hasField("auditor") && item.auditor && (
                      <DetailRow label="Auditor" value={item.auditor} inline />
                    )}
                  </div>
                )}
              {hasField("followUpComments") && item.followUpComments && (
                <DetailRow
                  label="Follow-up Comments"
                  value={item.followUpComments}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface IFindingsSectionProps {
  siteUrl: string;
  source: IExcelFindingsSource;
}

const FindingsSection: React.FC<IFindingsSectionProps> = ({
  siteUrl,
  source,
}) => {
  const { rows, loading, error, refresh } = useExcelSource(siteUrl, source);

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Title
            level={5}
            style={{ margin: 0, color: "#0078d4", fontSize: 15 }}
          >
            {source.label}
          </Title>
          {!loading && !error && rows.length > 0 && (
            <span
              style={{
                background: "#fff7e6",
                color: "#d46b08",
                border: "1px solid #ffd591",
                borderRadius: 10,
                padding: "1px 8px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {rows.length} in progress
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Showing {source.filterStatus} findings only
          </Text>
          <Button
            prefixCls="iso-ant-btn"
            size="small"
            onClick={refresh}
            title="Refresh findings from SharePoint"
            style={{ fontSize: 12 }}
          >
            ↻ Refresh
          </Button>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {/* Content */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 10,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} active paragraph={{ rows: 4 }} />
            ))}
          </div>
        ) : error ? (
          <Alert
            type="error"
            message={`Failed to load ${source.label}`}
            description={error}
            showIcon
            action={
              <Button prefixCls="iso-ant-btn" size="small" onClick={refresh}>
                Retry
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <Empty
            description={
              <Text type="secondary" style={{ fontSize: 13 }}>
                No {source.filterStatus} findings — all clear!
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: "16px 0" }}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 10,
            }}
          >
            {rows.map((item) => (
              <FindingCard
                key={`${source.id}-${item.rowIndex}`}
                item={item}
                source={source}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindingsSection;
