'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const salesData = [
  { Month: 'Jan', Sales: 450000, Orders: 380, Returns: 24 },
  { Month: 'Feb', Sales: 520000, Orders: 440, Returns: 32 },
  { Month: 'Mar', Sales: 680000, Orders: 580, Returns: 40 },
  { Month: 'Apr', Sales: 720000, Orders: 630, Returns: 35 },
  { Month: 'May', Sales: 650000, Orders: 570, Returns: 30 },
  { Month: 'Jun', Sales: 540000, Orders: 610, Returns: 42 },
];

const orderStatusData = [
  { name: 'Delivered', value: 456 },
  { name: 'Processing', value: 124 },
  { name: 'Shipped', value: 186 },
  { name: 'Cancelled', value: 32 }
];

const STATUS_COLORS = [
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--primary))',
  'hsl(var(--destructive))'
];

export function SalesChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={salesData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="Month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)'
            }}
            formatter={(value, name) => {
              if (name === 'Sales') return [`₹${Number(value).toLocaleString()}`, name];
              return [value, name];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Sales"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
            yAxisId={0}
          />
          <Line
            type="monotone"
            dataKey="Orders"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--success))' }}
            yAxisId={1}
          />
          <Line
            type="monotone"
            dataKey="Returns"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--destructive))' }}
            yAxisId={1}
          />
          <YAxis
            yAxisId={0}
            orientation="left"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            yAxisId={1}
            orientation="right"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrderStatusChart() {
  const totalOrders = orderStatusData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={orderStatusData}
            cx="50%"
            cy="50%"
            innerRadius={110}
            outerRadius={130}
            paddingAngle={5}
            dataKey="value"
          >
            {orderStatusData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[index % STATUS_COLORS.length]}
              />
            ))}
          </Pie>
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            fontSize="16px"
            fontWeight="600"
          >
            Total Orders
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            fontSize="18px"
            fontWeight="700"
          >
            {totalOrders}
          </text>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}