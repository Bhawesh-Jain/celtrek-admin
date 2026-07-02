'use client';

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

const dummyData = [
  { Month: 'Jan', Loans: 45, Approvals: 38, Rejections: 7 },
  { Month: 'Feb', Loans: 52, Approvals: 44, Rejections: 8 },
  { Month: 'Mar', Loans: 68, Approvals: 58, Rejections: 10 },
  { Month: 'Apr', Loans: 72, Approvals: 63, Rejections: 9 },
  { Month: 'May', Loans: 65, Approvals: 57, Rejections: 8 },
  { Month: 'Jun', Loans: 54, Approvals: 61, Rejections: 10 },
];
const totalApprovals = dummyData.reduce((sum, item) => sum + item.Approvals, 0);
const totalRejections = dummyData.reduce((sum, item) => sum + item.Rejections, 0);
const totalCount = totalApprovals + totalRejections;

const pieData = [
  { name: 'Approvals', value: totalApprovals },
  { name: 'Rejections', value: totalRejections },
];

const COLORS = ['hsl(var(--success))', 'hsl(var(--destructive))'];

export function LoanChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={dummyData}
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
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Loans"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
          />
          <Line
            type="monotone"
            dataKey="Approvals"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--success))' }}
          />
          <Line
            type="monotone"
            dataKey="Rejections"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--destructive))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ApprovalRateChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={110}
            outerRadius={130}
            paddingAngle={5}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <text
            x="42.5%"
            y="42%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--primary))"
            fontSize="14px"
            fontWeight="500"
          >
            Total Count:{totalCount}
          </text>
          <text
            x="42.5%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--success))"
            fontSize="14px"
            fontWeight="500"
          >
            Approved:{totalApprovals}
          </text>
          <text
            x="42.5%"
            y="62%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--destructive))"
            fontSize="14px"
            fontWeight="500"
          >
            Rejected:{totalRejections}
          </text>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)'
            }}
          />
          <p>Count</p>
          <Legend
            align="right"
            verticalAlign="middle"
            layout="vertical"
            wrapperStyle={{ right: -20 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}