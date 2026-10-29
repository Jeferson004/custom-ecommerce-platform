import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cancelOrder, getOrderById } from '../../api/orders';
import styles from './orderDetails.module.scss';

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

function OrderDetails() {
  const { id } = useParams();

  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    const fetchOrder = async () => {
      try {
        const data = await getOrderById(id);

        if (isActive) {
          setOrderData(data);
          setError('');
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Unable to load this order.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      isActive = false;
    };
  }, [id]);

  const handleCancelOrder = async () => {
    if (isCancelling || orderData?.order?.status !== 'pending') {
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to cancel order #${orderData.order.id}?`);

    if (!confirmed) return;

    try {
      setIsCancelling(true);
      setError('');
      setMessage('');

      const result = await cancelOrder(id);

      setOrderData((current) => ({
        ...current,
        order: result.order,
      }));

      setMessage(result.message || 'Order cancelled successfully.');
    } catch (err) {
      setError(err.message || 'Unable to cancel this order.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p role="status">Loading order details...</p>
      </main>
    );
  }

  if (error && !orderData) {
    return (
      <main className={styles.page}>
        <h1>Order Details</h1>
        <p className={styles.error} role="alert">
          {error}
        </p>
        <Link to="/orders">Back to my orders</Link>
      </main>
    );
  }

  if (!orderData?.order) {
    return (
      <main className={styles.page}>
        <h1>Order not found</h1>
        <Link to="/orders">Back to my orders</Link>
      </main>
    );
  }

  const { order, items = [] } = orderData;
  const canCancel = order.status === 'pending';

  return (
    <main className={styles.page}>
      <Link to="/orders" className={styles.backLink}>
        ← Back to my orders
      </Link>

      <header className={styles.header}>
        <div>
          <h1>Order #{order.id}</h1>
          <p>Placed on {formatDate(order.created_at)}</p>
        </div>

        <span
          className={`${styles.status} ${
            styles[`status_${String(order.status).toLowerCase()}`] || ''
          }`}>
          {order.status}
        </span>
      </header>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className={styles.success} role="status">
          {message}
        </p>
      )}

      <section className={styles.section}>
        <h2>Items ordered</h2>

        {items.length === 0 ? (
          <p>No order items were returned.</p>
        ) : (
          <div className={styles.itemList}>
            {items.map((item) => (
              <article className={styles.item} key={item.id}>
                <div className={styles.itemInfo}>
                  <h3>{item.product_name}</h3>
                  <p>Product ID: {item.product_id}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Unit price: {formatPrice(item.price)}</p>
                </div>

                <strong>{formatPrice(item.subtotal)}</strong>
              </article>
            ))}
          </div>
        )}

        <div className={styles.totalRow}>
          <span>Order total</span>
          <strong>{formatPrice(order.total_amount)}</strong>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Delivery information</h2>

        <dl className={styles.detailsList}>
          <div>
            <dt>Shipping address ID</dt>
            <dd>{order.shipping_address_id}</dd>
          </div>

          <div>
            <dt>Billing address ID</dt>
            <dd>{order.billing_address_id}</dd>
          </div>

          <div>
            <dt>Last updated</dt>
            <dd>{formatDate(order.updated_at)}</dd>
          </div>
        </dl>
      </section>

      {canCancel && (
        <section className={styles.cancelSection}>
          <h2>Cancel order</h2>
          <p>You can cancel this order while its status is pending.</p>

          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleCancelOrder}
            disabled={isCancelling}>
            {isCancelling ? 'Cancelling...' : 'Cancel order'}
          </button>
        </section>
      )}
    </main>
  );
}

export default OrderDetails;
