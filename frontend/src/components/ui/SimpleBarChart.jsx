import React from 'react';

/**
 * Simple Bar Chart Component
 * Renders a bar chart using SVG for categorical data visualization
 */
const SimpleBarChart = ({ 
  data, 
  xKey, 
  yKey, 
  width = 800, 
  height = 300,
  color = '#3B82F6',
  label = 'Value',
  showValues = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 60, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Extract values
  const yValues = data.map(d => d[yKey]);
  const maxY = Math.max(...yValues);
  const minY = Math.min(0, ...yValues);
  const yRange = maxY - minY || 1;

  // Bar dimensions
  const barWidth = chartWidth / data.length * 0.7;
  const barSpacing = chartWidth / data.length;

  // Scale function
  const scaleY = (value) => chartHeight - ((value - minY) / yRange) * chartHeight;
  const baselineY = scaleY(0);

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
          {gridLines.map((line, i) => (
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

          {/* Bars */}
          {data.map((d, i) => {
            const x = i * barSpacing + (barSpacing - barWidth) / 2;
            const y = scaleY(d[yKey]);
            const barHeight = Math.abs(y - baselineY);
            const actualY = d[yKey] >= 0 ? y : baselineY;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={actualY}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  opacity="0.8"
                  rx="4"
                  className="transition-opacity hover:opacity-100 cursor-pointer"
                >
                  <title>
                    {d[xKey]}: {d[yKey]}
                  </title>
                </rect>
                
                {/* Value label on top of bar */}
                {showValues && (
                  <text
                    x={x + barWidth / 2}
                    y={actualY - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-700 font-medium"
                  >
                    {Math.round(d[yKey])}
                  </text>
                )}
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.map((d, i) => {
            const x = i * barSpacing + barSpacing / 2;
            const label = String(d[xKey]);
            const showLabel = data.length <= 15 || i % Math.ceil(data.length / 15) === 0;
            
            if (!showLabel) return null;
            
            return (
              <text
                key={i}
                x={x}
                y={chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
                transform={data.length > 10 ? `rotate(-45, ${x}, ${chartHeight + 20})` : undefined}
              >
                {label.length > 10 ? label.substring(0, 10) + '...' : label}
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

export default SimpleBarChart;
