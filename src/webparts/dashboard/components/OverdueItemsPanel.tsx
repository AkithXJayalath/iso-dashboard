// OverdueItemsPanel.tsx
// Table of items flagged by either overdue type:
//   Type A — Not completed past creation threshold
//   Type B — Stalling in a non-completed status past per-status threshold

import * as React from "react";
import { Alert, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { IRegistryConfig } from "../config/registryConfig";
import { IRegistryItem } from "../hooks/useRegistryData";
import { getItemOverdueInfo, IStallingOverdue } from "../utils/overdueUtils";

const { Text } = Typography;

// ── Component ─────────────────────────────────────────────────────────────────
interface IOverdueItemsPanelProps {
  registry: IRegistryConfig;
  items: IRegistryItem[];
  thresholdDays: number;
}

interface ITableRow {
  key: number;
  id: number;
  title: string;
  status: string;
  completionOverdue: boolean;
  completionDaysOver: number;
  stallingOverdue: IStallingOverdue | undefined;
  maxDaysOver: number;
}

const OverdueItemsPanel: React.FC<IOverdueItemsPanelProps> = ({
  registry,
  items,
  thresholdDays,
}) => {
  const overdueItems: ITableRow[] = React.useMemo(() => {
    const rows: ITableRow[] = [];
    items.forEach((item) => {
      const info = getItemOverdueInfo(item, registry, thresholdDays);
      if (!info.isFlagged) return;

      const completionDaysOver = info.completionOverdue
        ? Math.max(0, info.completionDaysOver)
        : 0;

      const stallingDaysOver = info.stallingOverdue
        ? info.stallingOverdue.daysOver
        : 0;

      rows.push({
        key: item.id,
        id: item.id,
        title: item.title,
        status: item.status,
        completionOverdue: info.completionOverdue,
        completionDaysOver,
        stallingOverdue: info.stallingOverdue,
        maxDaysOver: Math.max(completionDaysOver, stallingDaysOver),
      });
    });
    rows.sort((a, b) => b.maxDaysOver - a.maxDaysOver);
    return rows;
  }, [items, registry, thresholdDays]);

  const titleColumnHeader = registry.titleField || "Item";

  const columns: ColumnsType<ITableRow> = [
    {
      title: titleColumnHeader,
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => (
        <Tag color="orange" style={{ fontSize: 11 }}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Overdue type",
      key: "overdueType",
      width: 220,
      render: (_: unknown, row: ITableRow) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {row.completionOverdue && (
            <Tag
              color="error"
              style={{ fontSize: 11, margin: 0, width: "fit-content" }}
            >
              Not completed +{row.completionDaysOver}d
            </Tag>
          )}
          {row.stallingOverdue && (
            <Tag
              color="warning"
              style={{ fontSize: 11, margin: 0, width: "fit-content" }}
            >
              Stalling in &ldquo;{row.stallingOverdue.status}&rdquo; +
              {row.stallingOverdue.daysOver}d
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Days over",
      dataIndex: "maxDaysOver",
      key: "maxDaysOver",
      width: 100,
      align: "right" as const,
      sorter: (a: ITableRow, b: ITableRow) => a.maxDaysOver - b.maxDaysOver,
      render: (days: number) => {
        const critical = days > thresholdDays;
        return (
          <Text
            strong
            style={{ color: critical ? "#cf1322" : "#d46b08", fontSize: 13 }}
          >
            {days}d
          </Text>
        );
      },
    },
  ];

  return (
    <div className="iso-overdue-panel">
      {overdueItems.length > 0 ? (
        <Alert
          prefixCls="iso-ant-alert"
          type="warning"
          showIcon
          style={{ marginBottom: 12, borderRadius: 6 }}
          message={
            <Text strong>
              {overdueItems.length} item
              {overdueItems.length !== 1 ? "s are" : " is"} flagged as overdue
            </Text>
          }
          description="Items flagged by not-completed or status-stalling thresholds."
        />
      ) : (
        <Alert
          prefixCls="iso-ant-alert"
          type="success"
          showIcon
          style={{ marginBottom: 12, borderRadius: 6 }}
          message={
            <Text strong>
              All items are within the {thresholdDays}-day threshold.
            </Text>
          }
        />
      )}

      <Table<ITableRow>
        prefixCls="iso-ant-table"
        dataSource={overdueItems}
        columns={columns}
        size="small"
        pagination={{ pageSize: 10, size: "small", hideOnSinglePage: true }}
        locale={{ emptyText: "No overdue items." }}
        scroll={{ x: 560 }}
        style={{ fontSize: 13 }}
      />
    </div>
  );
};

export default OverdueItemsPanel;
