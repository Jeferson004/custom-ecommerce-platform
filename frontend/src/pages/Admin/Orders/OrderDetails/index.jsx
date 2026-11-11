import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    getAdminOrderById,
    getOrderStatusHistory,
    updateAdminOrderStatus,
    cancelAdminOrder,
} from '../../../../api/orders';
import styles from './orderDetails.module.scss';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(amount) || 0);

const formatDate = (date) =>
    new Date(date).toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

const orderActions = {
    pending: [
        { label: 'Confirm Order', status: 'confirmed' },
        { label: 'Cancel Order', action: 'cancel' },
    ],
    confirmed: [
        { label: 'Start Processing', status: 'processing' },
        { label: 'Cancel Order', action: 'cancel' },
    ],
    processing: [
        { label: 'Ship Order', status: 'shipped' },
        { label: 'Cancel Order', action: 'cancel' },
    ],
    shipped: [{ label: 'Mark as Delivered', status: 'delivered' }],
    delivered: [],
    cancelled: [],
};

function AdminOrderDetails() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [updating, setUpdating] = useState(false);

    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const fetchOrderDetails = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            setError('');

            const [orderResponse, historyResponse] = await Promise.all([
                getAdminOrderById(id),
                getOrderStatusHistory(id),
            ]);

            const orderData = orderResponse.data ?? orderResponse;
            const historyData = historyResponse.data ?? historyResponse;

            if (!orderData?.order || !Array.isArray(orderData.items) || !Array.isArray(historyData)) {
                throw new Error('Invalid order details response.');
            }

            setOrder(orderData.order);
            setItems(orderData.items);
            setHistory(historyData);
        } catch (err) {
            setError(err.message || 'Failed to retrieve order details.');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        let ignore = false;

        const loadOrderDetails = async () => {
            try {
                setLoading(true);
                setError('');

                const [orderResponse, historyResponse] = await Promise.all([
                    getAdminOrderById(id),
                    getOrderStatusHistory(id),
                ]);

                const orderData = orderResponse.data ?? orderResponse;
                const historyData = historyResponse.data ?? historyResponse;

                if (
                    !orderData?.order ||
                    !Array.isArray(orderData.items) ||
                    !Array.isArray(historyData)
                ) {
                    throw new Error('Invalid order details response.');
                }

                if (!ignore) {
                    setOrder(orderData.order);
                    setItems(orderData.items);
                    setHistory(historyData);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message || 'Failed to retrieve order details.');
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        loadOrderDetails();

        return () => {
            ignore = true;
        };
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        try {
            setUpdating(true);
            setError('');

            await updateAdminOrderStatus(id, newStatus);

            await fetchOrderDetails(false);
        } catch (err) {
            setError(err.message || 'Failed to update order status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            return;
        }

        try {
            setUpdating(true);
            setError('');

            await cancelAdminOrder(id, cancelReason.trim());

            setShowCancelDialog(false);
            setCancelReason('');

            await fetchOrderDetails(false);
        } catch (err) {
            setError(err.message || 'Failed to cancel order.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <p role="status">Loading order details...</p>;
    }

    if (error) {
        return (
            <div className={styles.container}>
                <p role="alert">{error}</p>
                <Link to="/admin/orders">Back to Orders</Link>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={styles.container}>
                <p>Order not found.</p>
                <Link to="/admin/orders">Back to Orders</Link>
            </div>
        );
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link to="/admin/orders">Back to Orders</Link>
                    <h1>Order #{order.id}</h1>
                    <p>Placed on {formatDate(order.created_at)}</p>
                </div>

                <span className={`${styles.status} ${styles[order.status]}`}>{order.status}</span>
            </header>

            <section className={styles.section}>
                <h2>Order Actions</h2>

                <div className={styles.actions}>
                    {orderActions[order.status]?.length > 0 ? (
                        orderActions[order.status].map((action) => (
                            <button
                                key={action.status ?? action.action}
                                type="button"
                                disabled={updating}
                                onClick={() => {
                                    if (action.action === 'cancel') {
                                        setCancelReason('');
                                        setShowCancelDialog(true);
                                        return;
                                    }

                                    handleStatusUpdate(action.status);
                                }}
                                className={action.action === 'cancel' ? styles.cancelButton : ''}>
                                {updating ? 'Updating...' : action.label}
                            </button>
                        ))
                    ) : (
                        <p>No available actions for this order.</p>
                    )}
                </div>
            </section>

            {showCancelDialog && (
                <div className={styles.modalOverlay}>
                    <section
                        className={styles.cancelDialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancelDialogTitle">
                        <h2 id="cancelDialogTitle">Cancel Order</h2>

                        <p>
                            Are you sure you want to cancel Order #{order.id}? Please provide a reason
                            for this cancellation.
                        </p>

                        <label htmlFor="cancelReason">Cancellation Reason</label>

                        <textarea
                            id="cancelReason"
                            value={cancelReason}
                            onChange={(event) => setCancelReason(event.target.value)}
                            placeholder="Enter the reason for cancelling this order..."
                            rows={4}
                            required
                        />

                        <div className={styles.dialogActions}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCancelDialog(false);
                                    setCancelReason('');
                                }}>
                                Close
                            </button>

                            <button
                                type="button"
                                disabled={!cancelReason.trim() || updating}
                                onClick={handleCancelOrder}>
                                {updating ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            <section className={styles.section}>
                <h2>Order Information</h2>

                <div className={styles.infoGrid}>
                    <div>
                        <span>Order ID</span>
                        <strong>#{order.id}</strong>
                    </div>

                    <div>
                        <span>Customer</span>
                        <strong>{order.customer_name}</strong>
                    </div>

                    <div>
                        <span>Order Status</span>
                        <strong>{order.status}</strong>
                    </div>

                    <div>
                        <span>Order Date</span>
                        <strong>{formatDate(order.created_at)}</strong>
                    </div>

                    <div>
                        <span>Shipping Address ID</span>
                        <strong>{order.shipping_address_id}</strong>
                    </div>

                    <div>
                        <span>Billing Address ID</span>
                        <strong>{order.billing_address_id}</strong>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2>Order Items</h2>

                <div className={styles.tableWrapper}>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.product_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.price)}</td>
                                    <td>{formatCurrency(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.total}>
                    <span>Order Total</span>
                    <strong>{formatCurrency(order.total_amount)}</strong>
                </div>
            </section>

            <section className={styles.section}>
                <h2>Order Status History</h2>

                {history.length === 0 ? (
                    <p>No status history available.</p>
                ) : (
                    <div className={styles.historyList}>
                        {history.map((entry) => (
                            <article className={styles.historyItem} key={entry.id}>
                                <div>
                                    <strong>
                                        {entry.previous_status ?? 'Created'}
                                        {' → '}
                                        {entry.new_status}
                                    </strong>

                                    <p>Changed by: {entry.changed_by_name}</p>

                                    {entry.reason && <p>Reason: {entry.reason}</p>}
                                </div>

                                <time>{formatDate(entry.created_at)}</time>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default AdminOrderDetails;
