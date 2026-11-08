import { useEffect, useState } from 'react';

import {
  getDashboardOverview,
  getRecentOrders,
  getLowStockProducts,
  getSalesOverview,
} from '../../../api/dashboard';

import SalesChart from '../../../components/Admin/SalesChart';

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [salesOverview, setSalesOverview] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [overviewResponse, ordersResponse, lowStockResponse, salesResponse] = await Promise.all([
          getDashboardOverview(),
          getRecentOrders(),
          getLowStockProducts(),
          getSalesOverview(),
        ]);

        setOverview(overviewResponse.data);
        setRecentOrders(ordersResponse.data);
        setLowStockProducts(lowStockResponse.data);
        setSalesOverview(salesResponse.data);
      } catch (error) {
        console.error('Dashboard API Error:', error);
        setError(error.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(Number(amount));
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!overview) {
    return <p>No dashboard data available.</p>;
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Overview metrics */}
      <section>
        <h2>Overview</h2>

        <div>
          <article>
            <h3>Total Products</h3>
            <p>{overview.total_products}</p>
          </article>

          <article>
            <h3>Total Orders</h3>
            <p>{overview.total_orders}</p>
          </article>

          <article>
            <h3>Total Customers</h3>
            <p>{overview.total_customers}</p>
          </article>

          <article>
            <h3>Total Revenue</h3>
            <p>{formatCurrency(overview.total_revenue)}</p>
          </article>

          <article>
            <h3>Pending Orders</h3>
            <p>{overview.pending_orders}</p>
          </article>

          <article>
            <h3>Low-stock Products</h3>
            <p>{overview.low_stock_products}</p>
          </article>
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <h2>Recent Orders</h2>

        {recentOrders.length === 0 ? (
          <p>No recent orders found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.order_id}>
                  <td>#{order.order_id}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.status}</td>
                  <td>{formatCurrency(order.total_amount)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString('en-PH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Low-stock products */}
      <section>
        <h2>Low-stock Products</h2>

        {lowStockProducts.length === 0 ? (
          <p>No low-stock products found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Threshold</th>
              </tr>
            </thead>

            <tbody>
              {lowStockProducts.map((product) => (
                <tr key={product.product_id}>
                  <td>{product.product_name}</td>
                  <td>{product.sku || 'N/A'}</td>
                  <td>{product.quantity}</td>
                  <td>{product.low_stock_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Sales overview */}
      {/* <section>
        <h2>Sales Overview (Last 7 Days)</h2>

        {salesOverview.length === 0 ? (
          <p>No sales data available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
              </tr>
            </thead>

            <tbody>
              {salesOverview.map((sale) => (
                <tr key={sale.sales_date}>
                  <td>{sale.sales_date}</td>
                  <td>{formatCurrency(sale.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section> */}

      <section>
        <SalesChart data={salesOverview} />
      </section>
    </div>
  );
}

export default AdminDashboard;
