import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartData[];
  dataKeys: string[];
  title?: string;
  colors?: string[];
}

const PREMIUM_COLORS = [
  'url(#barGradientBlue)',
  'url(#barGradientGreen)',
  'url(#barGradientPurple)',
  'url(#barGradientOrange)',
  'url(#barGradientPink)',
];

const FALLBACK_COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200 backdrop-blur-sm">
        <p className="font-bold text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm mb-1">
            <span
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            ></span>
            <span className="font-semibold text-slate-700">{entry.name}: </span>
            <span className="font-bold text-blue-600">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  return (
    <g>
      <defs>
        <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
          <stop offset="100%" stopColor="#0284c7" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
          <stop offset="100%" stopColor="#059669" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="barGradientPurple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="barGradientOrange" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
          <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="barGradientPink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
          <stop offset="100%" stopColor="#db2777" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={8}
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
          transition: 'all 0.3s ease',
        }}
      />
    </g>
  );
};

export const BarChart: React.FC<BarChartProps> = ({ data, dataKeys, title, colors = PREMIUM_COLORS }) => {
  return (
    <div className="w-full animate-fade-in">
      {title && (
        <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></span>
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={350}>
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#059669" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="barGradientPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="barGradientOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
              <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="barGradientPink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
              <stop offset="100%" stopColor="#db2777" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
          />
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
              radius={[8, 8, 0, 0]}
              animationBegin={index * 100}
              animationDuration={600}
              animationEasing="ease-out"
              shape={<CustomBar />}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
