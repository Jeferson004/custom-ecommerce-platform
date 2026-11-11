import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getAllOrders } from '../../../api/orders';
import styles from './orders.module.scss';

const ORDER_STATUSES = [
    'all',
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
];

function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await getAllOrders();
                const ordersData = response.data ?? response;

                if (!Array.isArray(ordersData)) {
                    throw new Error('Invalid orders API response.');
                }

                setOrders(ordersData);
            } catch (error) {
                console.error('Orders API Error:', error);
                setError(error.message || 'Failed to load orders.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(Number(amount));
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const orderId = String(order.id ?? order.order_id ?? '');
            const customerName = order.customer_name ?? '';

            const matchesSearch =
                orderId.toLowerCase().includes(search.toLowerCase()) ||
                customerName.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }, [orders, search, selectedStatus]);

    const getStatusClass = (status) => {
        const statusClasses = {
            pending: styles.statusPending,
            confirmed: styles.statusConfirmed,
            processing: styles.statusProcessing,
            shipped: styles.statusShipped,
            delivered: styles.statusDelivered,
            cancelled: styles.statusCancelled,
        };

        return statusClasses[status] || '';
    };

    return (
        <div className={styles.container}>
            <header className={styles.ordersHeader}>
                <div>
                    <h1>Orders</h1>
                    <p>Manage and monitor customer orders.</p>
                </div>
            </header>

            <section className={styles.ordersSection}>
                <div className={styles.ordersToolbar}>
                    <div className={styles.searchWrapper}>
                        <input
                            type="search"
                            placeholder="Search order ID or customer..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search orders"
                        />
                    </div>

                    <div className={styles.filterWrapper}>
                        <label htmlFor="orderStatus">Filter by status</label>

                        <select
                            id="orderStatus"
                            value={selectedStatus}
                            onChange={(event) => setSelectedStatus(event.target.value)}>
                            {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status === 'all'
                                        ? 'All statuses'
                                        : status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p className={styles.stateMessage}>Loading orders...</p>
                ) : error ? (
                    <p className={styles.errorMessage} role="alert">
                        {error}
                    </p>
                ) : filteredOrders.length === 0 ? (
                    <p className={styles.emptyMessage}>
                        {orders.length === 0
                            ? 'No orders found.'
                            : 'No orders match your search or selected filter.'}
                    </p>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Date Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredOrders.map((order) => {
                                    const orderId = order.id ?? order.order_id;

                                    return (
                                        <tr key={orderId}>
                                            <td>#{orderId}</td>
                                            <td>{order.customer_name || 'N/A'}</td>
                                            <td>{formatCurrency(order.total_amount)}</td>
                                            <td>
                                                <span
                                                    className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>{formatDate(order.created_at)}</td>
                                            <td>
                                                <Link
                                                    to={`/admin/orders/${orderId}`}
                                                    className={styles.viewButton}>
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && filteredOrders.length > 0 && (
                    <p className={styles.resultsCount}>
                        Showing {filteredOrders.length} of {orders.length} orders
                    </p>
                )}
            </section>
        </div>
    );
}

export default AdminOrders;
