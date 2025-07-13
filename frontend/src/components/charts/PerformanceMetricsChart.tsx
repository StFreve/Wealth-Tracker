import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface MetricData {
  name: string;
  value: number;
  unit?: string;
  color?: string;
  target?: number;
}

interface PerformanceMetricsChartProps {
  data: MetricData[];
  type?: 'bar' | 'radial';
  height?: number;
  currency?: string;
}

const COLORS = ['#059669', '#2563eb', '#dc2626', '#7c3aed', '#ea580c'];

const CustomTooltip = ({ active, payload, label, currency = 'USD' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.name}</p>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {data.unit === '$' ? formatCurrency(data.value, currency) : `${data.value}${data.unit || ''}`}
        </p>
        {data.target && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Target: {data.unit === '$' ? formatCurrency(data.target, currency) : `${data.target}${data.unit || ''}`}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const PerformanceMetricsChart: React.FC<PerformanceMetricsChartProps> = ({
  data,
  type = 'bar',
  height = 400,
  currency = 'USD'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No performance metrics available</p>
      </div>
    );
  }

  if (type === 'radial') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="80%"
          data={data}
        >
          <RadialBar 
            dataKey="value" 
            cornerRadius={10} 
            fill="#059669"
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
        </RadialBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="name" 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            if (Math.abs(value) >= 1000) {
              return `${(value / 1000).toFixed(1)}k`;
            }
            return value.toString();
          }}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        
        <Bar 
          dataKey="value"
          fill="#059669"
          radius={[2, 2, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}; 