// RegistrySelector.tsx
// Dropdown that lists all registries defined in registryConfig.ts.
// Selecting one fires onSelect with the chosen registry's id.

import * as React from "react";
import { Select, Typography } from "antd";
import { REGISTRIES, IRegistryConfig } from "../config/registryConfig";

const { Text } = Typography;

interface IRegistrySelectorProps {
  selected: IRegistryConfig;
  onSelect: (registry: IRegistryConfig) => void;
}

const RegistrySelector: React.FC<IRegistrySelectorProps> = ({
  selected,
  onSelect,
}) => {
  const options = REGISTRIES.map((r) => ({ value: r.id, label: r.label }));

  const handleChange = (value: string): void => {
    const found = REGISTRIES.filter((r: IRegistryConfig) => r.id === value)[0];
    if (found) onSelect(found);
  };

  return (
    <div className="iso-selector-wrapper">
      <Text strong style={{ marginRight: 8 }}>
        Registry:
      </Text>
      <Select
        prefixCls="iso-ant-select"
        value={selected.id}
        options={options}
        onChange={handleChange}
        style={{ minWidth: 220 }}
        size="middle"
      />
    </div>
  );
};

export default RegistrySelector;
