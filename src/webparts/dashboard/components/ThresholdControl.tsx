// ThresholdControl.tsx
// Number input that lets the user adjust the overdue threshold (in days).

import * as React from "react";
import { InputNumber, Typography } from "antd";

const { Text } = Typography;

interface IThresholdControlProps {
  value: number;
  onChange: (days: number) => void;
}

const ThresholdControl: React.FC<IThresholdControlProps> = ({
  value,
  onChange,
}) => {
  const handleChange = (val: number | null): void => {
    if (val !== null && val > 0) onChange(val);
  };

  return (
    <div className="iso-threshold-wrapper">
      <Text>Flag items overdue after</Text>
      <InputNumber
        prefixCls="iso-ant-input-number"
        min={1}
        max={365}
        value={value}
        onChange={handleChange}
        style={{ width: 80, margin: "0 8px" }}
        size="middle"
      />
      <Text>days</Text>
    </div>
  );
};

export default ThresholdControl;
