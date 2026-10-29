import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../../api/orders';
import styles from './orders.module.scss';

const formatPrice = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return 'Date unavailable';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return parsedDate.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError('');

        const data = await getOrders();

        if (isActive) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Unable to load your orders.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return (
      <main className={styles.ordersPage}>
        <h1>My Orders</h1>
        <p role="status">Loading your orders...</p>
      </main>
    );
  }

  return (
    <main className={styles.ordersPage}>
      <h1>My Orders</h1>
      <p className={styles.description}>View your order history and track your purchases.</p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!error && orders.length === 0 && (
        <section className={styles.emptyState}>
          <h2>No orders yet</h2>
          <p>Your completed checkout orders will appear here.</p>
          <Link to="/cart" className={styles.actionLink}>
            Go to cart
          </Link>
        </section>
      )}

      {orders.length > 0 && (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <article className={styles.orderCard} key={order.id}>
              <div className={styles.orderHeader}>
                <div>
                  <h2>Order #{order.id}</h2>
                  <p className={styles.orderDate}>{formatDate(order.created_at)}</p>
                </div>

                <span
                  className={`${styles.status} ${
                    styles[`status_${String(order.status).toLowerCase()}`] || ''
                  }`}>
                  {order.status || 'Unknown'}
                </span>
              </div>

              <div className={styles.orderFooter}>
                <div>
                  <span className={styles.totalLabel}>Order total</span>
                  <strong className={styles.total}>{formatPrice(order.total_amount)}</strong>
                </div>

                <Link to={`/orders/${order.id}`} className={styles.actionLink}>
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Orders;