import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface AllocationData {
  type: string;
  value: number;
  percentage: number;
  count: number;
}

interface AssetAllocationChartProps {
  data: AllocationData[];
  currency?: string;
  height?: number;
  showLegend?: boolean;
}

const COLORS = [
  '#059669', // Green
  '#2563eb', // Blue
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#be123c', // Rose
  '#65a30d', // Lime
  '#7e22ce', // Violet
  '#c2410c', // Amber
];

const CustomTooltip = ({ active, payload, currency = 'USD' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.type}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatCurrency(data.value, currency)} ({data.percentage.toFixed(1)}%)
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {data.count} asset{data.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <li key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  data,
  currency = 'USD',
  height = 400,
  showLegend = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No allocation data available</p>
      </div>
    );
  }

  // Filter out zero values
  const filteredData = data.filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percentage }) => `${percentage.toFixed(1)}%`}
          outerRadius={Math.min(height * 0.25, 120)}
          fill="#8884d8"
          dataKey="value"
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={currency} />} />
        {showLegend && <Legend content={<CustomLegend />} />}
      </PieChart>
    </ResponsiveContainer>
  );
}; 