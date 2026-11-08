import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import styles from './salesChart.module.scss';

function SalesChart({ data = [] }) {
  const chartData = data.map((sale) => ({
    date: sale.sales_date,
    revenue: Number(sale.revenue),
  }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={styles.chartContainer}>
      <h2>Sales Overview</h2>
      <p>Revenue for the last 7 days</p>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 10,
            }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={(date) =>
                new Date(`${date}T00:00:00`).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                })
              }
            />

            <YAxis tickFormatter={(value) => `₱${value.toLocaleString('en-PH')}`} />

            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
              labelFormatter={(date) => `Date: ${date}`}
            />

            <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SalesChart;
