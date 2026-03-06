// OverdueItemsPanel.tsx
// Table of items that are:
//   (a) not in a completedStatus, AND
//   (b) age in days since dateField > threshold

import * as React from "react";
import { Alert, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { IRegistryConfig } from "../config/registryConfig";
import { IRegistryItem } from "../hooks/useRegistryData";

const { Text } = Typography;

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((Date.now() - d.getTime()) / msPerDay);
}

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
  daysOverdue: number;
}

const OverdueItemsPanel: React.FC<IOverdueItemsPanelProps> = ({
  registry,
  items,
  thresholdDays,
}) => {
  const overdueItems: ITableRow[] = React.useMemo(() => {
    return items
      .filter((item) => registry.completedStatuses.indexOf(item.status) === -1)
      .map((item) => ({
        key: item.id,
        id: item.id,
        title: item.title,
        status: item.status,
        daysOverdue: daysSince(item.date),
      }))
      .filter((row) => row.daysOverdue > thresholdDays)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
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
      title: "Days overdue",
      dataIndex: "daysOverdue",
      key: "daysOverdue",
      width: 120,
      align: "right" as const,
      sorter: (a: ITableRow, b: ITableRow) => a.daysOverdue - b.daysOverdue,
      render: (days: number) => {
        const critical = days > thresholdDays * 2;
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
              {overdueItems.length !== 1 ? "s are" : " is"} overdue
            </Text>
          }
          description={`Items open longer than ${thresholdDays} days are listed below.`}
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
        scroll={{ x: 500 }}
        style={{ fontSize: 13 }}
      />
    </div>
  );
};

export default OverdueItemsPanel;
