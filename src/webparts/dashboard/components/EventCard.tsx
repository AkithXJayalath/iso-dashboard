import * as React from "react";
import { Card, Tag, Button, Typography } from "antd";
import {
  ICalendarEvent,
  getEventStatus,
  formatDate,
} from "../utils/eventUtils";
import { EVENTS_CONFIG } from "../config/eventsConfig";

const { Text, Paragraph } = Typography;

interface IEventCardProps {
  event: ICalendarEvent;
  onMarkCompleted: (event: ICalendarEvent) => void;
  onPlan: (event: ICalendarEvent) => void;
}

const COLORS = {
  overdue: {
    border: "#ff4d4f",
    bg: "#fff1f0",
    tagColor: "error",
    dotColor: "#ff4d4f",
  },
  dueSoon: {
    border: "#fa8c16",
    bg: "#fffbe6",
    tagColor: "warning",
    dotColor: "#fa8c16",
  },
  upcoming: {
    border: "#52c41a",
    bg: "#f6ffed",
    tagColor: "success",
    dotColor: "#52c41a",
  },
  complete: {
    border: "#d9d9d9",
    bg: "#fafafa",
    tagColor: "default",
    dotColor: "#d9d9d9",
  },
} as const;

type TColorKey = keyof typeof COLORS;

function isToBePlanned(event: ICalendarEvent): boolean {
  return (
    event.status.toLowerCase() === EVENTS_CONFIG.toBePlannedStatus.toLowerCase()
  );
}

function isExecuted(event: ICalendarEvent): boolean {
  return (
    event.status.toLowerCase() === EVENTS_CONFIG.executedStatus.toLowerCase()
  );
}

function getColorKey(event: ICalendarEvent): TColorKey {
  if (event.actualDate !== null || isExecuted(event)) return "complete";
  if (isToBePlanned(event)) return "dueSoon"; // orange until a planned date is set
  const { isOverdue, daysOffset } = getEventStatus(event);
  if (isOverdue) return "overdue";
  if (daysOffset >= -7) return "dueSoon"; // within 7 days remaining
  return "upcoming";
}

function urgencyLabel(event: ICalendarEvent): string {
  if (event.actualDate !== null || isExecuted(event)) return "Completed";
  if (isToBePlanned(event)) return "To be Planned";
  const { isOverdue, daysOffset } = getEventStatus(event);
  if (!event.plannedDate) return "No date";
  if (isOverdue) {
    return daysOffset === 1 ? "1 day overdue" : `${daysOffset} days overdue`;
  }
  const remaining = -daysOffset;
  if (remaining === 0) return "Due today";
  if (remaining === 1) return "Due tomorrow";
  return `${remaining} days remaining`;
}

// ─────────────────────────────────────────────────────────────────────────────

const EventCard: React.FC<IEventCardProps> = ({
  event,
  onMarkCompleted,
  onPlan,
}) => {
  const colorKey = getColorKey(event);
  const colors = COLORS[colorKey];
  const isComplete = event.actualDate !== null || isExecuted(event);
  const needsPlan = isToBePlanned(event);

  return (
    <Card
      prefixCls="iso-ant-card"
      size="small"
      style={{
        borderLeft: `4px solid ${colors.border}`,
        background: colors.bg,
        borderRadius: 6,
        opacity: isComplete ? 0.75 : 1,
        transition: "box-shadow 0.2s",
      }}
      bodyStyle={{ padding: "10px 14px" }}
    >
      {/* ── Header row ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <Text
          strong
          style={{
            fontSize: 13,
            flex: 1,
            color: isComplete ? "#8c8c8c" : "#1a1a1a",
          }}
        >
          {event.action}
        </Text>
        <Tag
          prefixCls="iso-ant-tag"
          color={colors.tagColor}
          style={{ flexShrink: 0, fontSize: 11 }}
        >
          {urgencyLabel(event)}
        </Tag>
      </div>

      {/* ── Meta row ── */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: isComplete ? 0 : 8,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          <span style={{ marginRight: 4 }}>📅</span>
          Planned: {formatDate(event.plannedDate)}
        </Text>
        <Tag
          prefixCls="iso-ant-tag"
          style={{
            fontSize: 11,
            background: "transparent",
            border: `1px solid ${colors.border}`,
            color: colors.dotColor,
          }}
        >
          {event.month}
        </Tag>
        {event.status && (
          <Text type="secondary" style={{ fontSize: 11, fontStyle: "italic" }}>
            {event.status}
          </Text>
        )}
      </div>

      {/* ── Actual date (if completed) ── */}
      {isComplete && (
        <Text
          type="secondary"
          style={{ fontSize: 12, display: "block", marginBottom: 4 }}
        >
          <span style={{ marginRight: 4 }}>✅</span>
          Completed: {formatDate(event.actualDate)}
          {event.evidence && (
            <Paragraph
              type="secondary"
              style={{ fontSize: 11, margin: "2px 0 0 20px" }}
              ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
            >
              {event.evidence}
            </Paragraph>
          )}
        </Text>
      )}

      {/* ── Action button (only for incomplete events) ── */}
      {!isComplete && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {needsPlan ? (
            <Button
              prefixCls="iso-ant-btn"
              type="primary"
              size="small"
              onClick={() => onPlan(event)}
              style={{
                fontSize: 12,
                background: COLORS.dueSoon.border,
                borderColor: COLORS.dueSoon.border,
              }}
            >
              Plan
            </Button>
          ) : (
            <Button
              prefixCls="iso-ant-btn"
              type="primary"
              size="small"
              onClick={() => onMarkCompleted(event)}
              style={{
                fontSize: 12,
                background: colors.border,
                borderColor: colors.border,
              }}
            >
              Mark as Completed
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default EventCard;
