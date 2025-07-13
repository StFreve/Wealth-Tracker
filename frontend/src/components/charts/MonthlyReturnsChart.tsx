import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface MonthlyReturn {
  month: string;
  value: number;
  return: number;
  returnPercent: number;
}

interface MonthlyReturnsChartProps {
  data: MonthlyReturn[];
  currency?: string;
  height?: number;
  showValue?: boolean;
}

const CustomTooltip = ({ active, payload, label, currency = 'USD' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatCurrency(data.value, currency)}
        </p>
        <p className={`text-sm font-medium ${data.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {data.return >= 0 ? '+' : ''}{formatCurrency(data.return, currency)} ({data.returnPercent?.toFixed(2)}%)
        </p>
      </div>
    );
  }
  return null;
};

export const MonthlyReturnsChart: React.FC<MonthlyReturnsChartProps> = ({
  data,
  currency = 'USD',
  height = 400,
  showValue = false
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No monthly returns data available</p>
      </div>
    );
  }

  const dataKey = showValue ? 'value' : 'return';
  const yAxisFormatter = showValue 
    ? (value: number) => `${currency === 'USD' ? '$' : currency} ${(value / 1000).toFixed(0)}k`
    : (value: number) => `${currency === 'USD' ? '$' : currency} ${(value / 1000).toFixed(0)}k`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart 
        data={data} 
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="month" 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
          tickFormatter={yAxisFormatter}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        
        {!showValue && <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />}
        
        <Bar 
          dataKey={dataKey}
          fill="#059669"
          radius={[2, 2, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.return >= 0 ? '#059669' : '#dc2626'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}; 