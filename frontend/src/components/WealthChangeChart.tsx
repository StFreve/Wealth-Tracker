import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WealthChangeData {
  month: string;
  value: number;
  change: number;
  isForecast?: boolean;
}

interface WealthChangeChartProps {
  data: WealthChangeData[];
  currency: string;
  height?: number;
}

export function WealthChangeChart({ data, currency, height = 300 }: WealthChangeChartProps) {
  // Split data into historical and forecast
  const historicalData = data.filter(item => !item.isForecast);
  const forecastData = data.filter(item => item.isForecast);
  
  // Create combined datasets for seamless transition
  const allLabels = data.map(item => item.month);
  
  // Portfolio value datasets
  const historicalValues = data.map(item => item.isForecast ? null : item.value);
  const forecastValues = data.map(item => item.isForecast ? item.value : null);
  
  // Add connection point for smooth transition
  if (historicalData.length > 0 && forecastData.length > 0) {
    const lastHistoricalIndex = historicalData.length - 1;
    forecastValues[lastHistoricalIndex] = historicalData[lastHistoricalIndex].value;
  }
  
  // Monthly change datasets
  const historicalChanges = data.map(item => item.isForecast ? null : item.change);
  const forecastChanges = data.map(item => item.isForecast ? item.change : null);
  
  // Add connection point for monthly changes
  if (historicalData.length > 0 && forecastData.length > 0) {
    const lastHistoricalIndex = historicalData.length - 1;
    forecastChanges[lastHistoricalIndex] = historicalData[lastHistoricalIndex].change;
  }

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: `Portfolio Value - Historical (${currency})`,
        data: historicalValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: false,
      },
      {
        label: `Portfolio Value - Forecast (${currency})`,
        data: forecastValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 0.7)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: false,
      },
      {
        label: `Monthly Change - Historical (${currency})`,
        data: historicalChanges,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y1',
        spanGaps: false,
      },
      {
        label: `Monthly Change - Forecast (${currency})`,
        data: forecastChanges,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 0.7)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        yAxisID: 'y1',
        spanGaps: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          filter: function(legendItem: any, chartData: any) {
            // Group historical and forecast in legend
            const label = legendItem.text;
            if (label.includes('Historical')) {
              legendItem.text = label.replace(' - Historical', '');
              return true;
            }
            if (label.includes('Forecast')) {
              legendItem.text = label.replace(' - Forecast', ' (Forecast)');
              return true;
            }
            return true;
          },
        },
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const dataPoint = data[context[0].dataIndex];
            const forecastLabel = dataPoint?.isForecast ? ' (Forecast)' : '';
            return `${context[0].label}${forecastLabel}`;
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null) return '';
            
            const cleanLabel = label.replace(' - Historical', '').replace(' - Forecast', '');
            return `${cleanLabel}: ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month',
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: `Portfolio Value (${currency})`,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: `Monthly Change (${currency})`,
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
} 