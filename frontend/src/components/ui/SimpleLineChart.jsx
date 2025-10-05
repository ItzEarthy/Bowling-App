import React from 'react';

/**
 * Simple Line Chart Component
 * Renders a line chart using SVG for trend visualization
 */
const SimpleLineChart = ({ 
  data, 
  xKey, 
  yKey, 
  width = 800, 
  height = 300,
  color = '#3B82F6',
  label = 'Value',
  showGrid = true,
  showDots = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Extract values
  const yValues = data.map(d => d[yKey]);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY || 1;

  // Scale functions
  const scaleX = (index) => (index / (data.length - 1)) * chartWidth;
  const scaleY = (value) => chartHeight - ((value - minY) / yRange) * chartHeight;

  // Generate path
  const pathData = data.map((d, i) => {
    const x = scaleX(i);
    const y = scaleY(d[yKey]);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate grid lines
  const gridLines = [];
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const y = (chartHeight / numGridLines) * i;
    const value = maxY - (yRange / numGridLines) * i;
    gridLines.push({ y, value });
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg 
        width={width} 
        height={height}
        className="mx-auto"
        style={{ minWidth: '600px' }}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {showGrid && gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={0}
                y1={line.y}
                x2={chartWidth}
                y2={line.y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text
                x={-10}
                y={line.y + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                {Math.round(line.value)}
              </text>
            </g>
          ))}

          {/* Line path */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Area under line (gradient) */}
          <defs>
            <linearGradient id={`gradient-${yKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d={`${pathData} L ${scaleX(data.length - 1)} ${chartHeight} L 0 ${chartHeight} Z`}
            fill={`url(#gradient-${yKey})`}
          />

          {/* Data points */}
          {showDots && data.map((d, i) => {
            const x = scaleX(i);
            const y = scaleY(d[yKey]);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                />
                {/* Tooltip on hover */}
                <title>
                  {d[xKey]}: {d[yKey]}
                </title>
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.map((d, i) => {
            const x = scaleX(i);
            const showLabel = data.length <= 12 || i % Math.ceil(data.length / 12) === 0;
            if (!showLabel) return null;
            
            return (
              <text
                key={i}
                x={x}
                y={chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {d[xKey]}
              </text>
            );
          })}
        </g>

        {/* Y-axis label */}
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
          className="text-sm fill-gray-700 font-medium"
        >
          {label}
        </text>
      </svg>
    </div>
  );
};

export default SimpleLineChart;
