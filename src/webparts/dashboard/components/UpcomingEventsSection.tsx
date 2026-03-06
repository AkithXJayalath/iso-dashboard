// UpcomingEventsSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Section component that renders the "Upcoming ISMS Events" panel.
//
// Layout:
//   ┌─────────────────────────────────────────────────────────────────┐
//   │  Upcoming ISMS Events          [Overdue] [All Upcoming] [Month▼]│
//   │  ─────────────────────────────────────────────────────────────  │
//   │  [EventCard]  [EventCard]  [EventCard]  …                       │
//   └─────────────────────────────────────────────────────────────────┘
//
// Filter modes:
//   upcoming  (default) — all overdue + items due within the config window
//   overdue             — only overdue items
//   month               — items in the selected month (from month dropdown)
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react";
import {
  Alert,
  Button,
  Empty,
  Select,
  Skeleton,
  Space,
  Spin,
  Typography,
} from "antd";
import { useEventsData } from "../hooks/useEventsData";
import { EVENTS_CONFIG } from "../config/eventsConfig";
import {
  ICalendarEvent,
  filterUpcoming,
  filterOverdue,
  sortEvents,
} from "../utils/eventUtils";
import EventCard from "./EventCard";
import CompletionModal from "./CompletionModal";

const { Title, Text } = Typography;

interface IUpcomingEventsSectionProps {
  siteUrl: string;
}

type TFilterMode = "upcoming" | "overdue" | "month";

const UpcomingEventsSection: React.FC<IUpcomingEventsSectionProps> = ({
  siteUrl,
}) => {
  const { events, loading, error, markAsCompleted, markAsPlanned, refresh } =
    useEventsData(siteUrl);

  const [filterMode, setFilterMode] = React.useState<TFilterMode>("upcoming");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [completingEvent, setCompletingEvent] =
    React.useState<ICalendarEvent | null>(null);
  const [planningEvent, setPlanningEvent] =
    React.useState<ICalendarEvent | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // ── Exclude already-executed events (by status) before any filter ───────
  // actualDate may be null even for executed rows, so check status directly.
  // Use case-insensitive comparison to guard against casing variants in Excel.
  const activeEvents = React.useMemo(
    () =>
      events.filter(
        (e) =>
          e.status.toLowerCase() !== EVENTS_CONFIG.executedStatus.toLowerCase(),
      ),
    [events],
  );

  // ── Derive available month options from data ────────────────────────────
  const monthOptions = React.useMemo(() => {
    const months = new Set<string>();
    activeEvents.forEach((e) => {
      if (e.month) months.add(e.month);
    });
    return Array.from(months).map((m) => ({ label: m, value: m }));
  }, [activeEvents]);

  // ── Apply selected filter ───────────────────────────────────────────────
  const displayedEvents = React.useMemo((): ICalendarEvent[] => {
    let filtered: ICalendarEvent[];
    if (filterMode === "overdue") {
      filtered = filterOverdue(activeEvents);
    } else if (filterMode === "month" && selectedMonth) {
      filtered = activeEvents.filter(
        (e) => e.month === selectedMonth && e.actualDate == null,
      );
    } else {
      // "upcoming" — default: all overdue + within window
      filtered = filterUpcoming(activeEvents, EVENTS_CONFIG.upcomingWindowDays);
    }
    return sortEvents(filtered);
  }, [activeEvents, filterMode, selectedMonth]);

  // ── Summary counts ──────────────────────────────────────────────────────
  const overdueCount = React.useMemo(
    () => filterOverdue(activeEvents).length,
    [activeEvents],
  );

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleFilterChange = (mode: TFilterMode): void => {
    setFilterMode(mode);
    if (mode !== "month") setSelectedMonth("");
  };

  const handleMarkCompleted = (event: ICalendarEvent): void => {
    setSaveError(null);
    setCompletingEvent(event);
  };

  const handlePlan = (event: ICalendarEvent): void => {
    setSaveError(null);
    setPlanningEvent(event);
  };

  const handleSubmit = async (
    event: ICalendarEvent,
    actualDate: Date,
    evidence: string,
  ): Promise<void> => {
    setSaving(true);
    setSaveError(null);
    try {
      await markAsCompleted(event, actualDate, evidence);
      setCompletingEvent(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save completion. Please try again.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePlanSubmit = async (
    event: ICalendarEvent,
    plannedDate: Date,
  ): Promise<void> => {
    setSaving(true);
    setSaveError(null);
    try {
      await markAsPlanned(event, plannedDate);
      setPlanningEvent(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save planned date. Please try again.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleModalCancel = (): void => {
    setCompletingEvent(null);
    setPlanningEvent(null);
    setSaveError(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ marginBottom: 28 }}>
      {/* ── Section header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Title
            level={4}
            style={{ margin: 0, color: "#0078d4", fontSize: 17 }}
          >
            Upcoming ISMS Events
          </Title>
          {overdueCount > 0 && (
            <span
              style={{
                background: "#ff4d4f",
                color: "#fff",
                borderRadius: 10,
                padding: "1px 8px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {overdueCount} overdue
            </span>
          )}
        </div>

        {/* ── Filter bar ── */}
        <Space size={6} wrap>
          <Button
            prefixCls="iso-ant-btn"
            size="small"
            type={filterMode === "upcoming" ? "primary" : "default"}
            onClick={() => handleFilterChange("upcoming")}
            style={{ fontSize: 12 }}
          >
            All Upcoming
          </Button>
          <Button
            prefixCls="iso-ant-btn"
            size="small"
            type={filterMode === "overdue" ? "primary" : "default"}
            danger={filterMode !== "overdue" && overdueCount > 0}
            onClick={() => handleFilterChange("overdue")}
            style={{ fontSize: 12 }}
          >
            Overdue {overdueCount > 0 ? `(${overdueCount})` : ""}
          </Button>
          <Select
            prefixCls="iso-ant-select"
            size="small"
            placeholder="By month…"
            value={filterMode === "month" ? selectedMonth : undefined}
            options={monthOptions}
            onChange={(v: string) => {
              setSelectedMonth(v);
              setFilterMode("month");
            }}
            allowClear
            onClear={() => handleFilterChange("upcoming")}
            style={{ width: 130, fontSize: 12 }}
          />
          <Button
            prefixCls="iso-ant-btn"
            size="small"
            onClick={refresh}
            title="Refresh events from SharePoint"
            style={{ fontSize: 12 }}
          >
            ↻ Refresh
          </Button>
        </Space>
      </div>

      {/* ── Save error banner ── */}
      {saveError && (
        <Alert
          type="error"
          message={saveError}
          closable
          onClose={() => setSaveError(null)}
          style={{ marginBottom: 10 }}
        />
      )}

      {/* ── Content ── */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 10,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} active paragraph={{ rows: 3 }} />
          ))}
        </div>
      ) : error ? (
        <Alert
          type="error"
          message="Failed to load ISMS events"
          description={error}
          showIcon
          action={
            <Button prefixCls="iso-ant-btn" size="small" onClick={refresh}>
              Retry
            </Button>
          }
        />
      ) : displayedEvents.length === 0 ? (
        <Empty
          description={
            <Text type="secondary" style={{ fontSize: 13 }}>
              {filterMode === "overdue"
                ? "No overdue events — everything is on track!"
                : filterMode === "month"
                  ? `No pending events for ${selectedMonth}.`
                  : "No upcoming events in the next " +
                    EVENTS_CONFIG.upcomingWindowDays +
                    " days."}
            </Text>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: "16px 0" }}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 10,
          }}
        >
          {displayedEvents.map((event) => (
            <EventCard
              key={`${event.rowIndex}-${event.action}`}
              event={event}
              onMarkCompleted={handleMarkCompleted}
              onPlan={handlePlan}
            />
          ))}
        </div>
      )}

      {/* Saving spinner overlay for the modal submit */}
      {saving && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.15)",
            zIndex: 2000,
          }}
        >
          <Spin size="large" />
        </div>
      )}

      {/* ── Completion modal ── */}
      <CompletionModal
        event={completingEvent}
        mode="complete"
        onSubmit={handleSubmit}
        onPlan={() => Promise.resolve()}
        onCancel={handleModalCancel}
      />

      {/* ── Plan modal ── */}
      <CompletionModal
        event={planningEvent}
        mode="plan"
        onSubmit={() => Promise.resolve()}
        onPlan={handlePlanSubmit}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default UpcomingEventsSection;
