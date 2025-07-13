import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface DataPoint {
  date: string;
  value: number;
  return?: number;
  returnPercent?: number;
}

interface PortfolioValueChartProps {
  data: DataPoint[];
  currency?: string;
  type?: 'line' | 'area';
  height?: number;
  showReturn?: boolean;
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
        {data.return !== undefined && (
          <p className={`text-sm ${data.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.return >= 0 ? '+' : ''}{formatCurrency(data.return, currency)} ({data.returnPercent?.toFixed(2)}%)
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const PortfolioValueChart: React.FC<PortfolioValueChartProps> = ({
  data,
  currency = 'USD',
  type = 'line',
  height = 400,
  showReturn = false
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="date" 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${currency === 'USD' ? '$' : currency} ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        
        {type === 'area' ? (
          <Area
            type="monotone"
            dataKey="value"
            stroke="#059669"
            fill="#059669"
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ) : (
          <Line
            type="monotone"
            dataKey="value"
            stroke="#059669"
            strokeWidth={2}
            dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#059669' }}
          />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}; 