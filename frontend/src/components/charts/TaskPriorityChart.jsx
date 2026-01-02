import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function TasksPriorityChart({ tasksByPriority }) {
  const data = [
    { name: 'High Priority', value: tasksByPriority.high, color: '#ef4444' },
    { name: 'Medium Priority', value: tasksByPriority.medium, color: '#f59e0b' },
    { name: 'Low Priority', value: tasksByPriority.low, color: '#10b981' }
  ].filter(item => item.value > 0); // Only show priorities with tasks

  const total = tasksByPriority.high + tasksByPriority.medium + tasksByPriority.low;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#121318] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            {payload[0].value} tasks ({((payload[0].value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#121318] rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold mb-4">Tasks by Priority</h3>
      
      {total > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontWeight: 500 }}>
                  {value}: {entry.payload.value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          No tasks yet
        </div>
      )}
    </div>
  );
}