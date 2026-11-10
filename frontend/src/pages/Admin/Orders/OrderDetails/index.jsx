
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    getAdminOrderById,
    getOrderStatusHistory,
} from "../../../../api/orders";

function AdminOrderDetails() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const fetchOrderDetails = async () => {
            try {
                setLoading(true);
                setError("");

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
                    throw new Error("Invalid order details response.");
                }

                if (active) {
                    setOrder(orderData.order);
                    setItems(orderData.items);
                    setHistory(historyData);
                }
            } catch (err) {
                if (active) {
                    setError(err.message || "Failed to retrieve order details.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchOrderDetails();

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return <p role="status">Loading order details...</p>;
    }

    if (error) {
        return (
            <div>
                <p role="alert">{error}</p>
                <Link to="/admin/orders">Back to Orders</Link>
            </div>
        );
    }

    if (!order) {
        return (
            <div>
                <p>Order not found.</p>
                <Link to="/admin/orders">Back to Orders</Link>
            </div>
        );
    }

    return (
        <div>
            <Link to="/admin/orders">Back to Orders</Link>

            <h1>Order Details</h1>

            <p>Order ID: {order.id}</p>
            <p>Status: {order.status}</p>
            <p>Total: {order.total_amount}</p>

            <h2>Order Items</h2>

            {items.length === 0 ? (
                <p>No items found.</p>
            ) : (
                <ul>
                    {items.map((item, index) => (
                        <li key={item.id ?? `${item.product_id}-${index}`}>
                            Product ID: {item.product_id} |
                            Quantity: {item.quantity} |
                            Price: {item.price} |
                            Subtotal: {item.subtotal}
                        </li>
                    ))}
                </ul>
            )}

            <h2>Status History</h2>

            {history.length === 0 ? (
                <p>No status history found.</p>
            ) : (
                <ul>
                    {history.map((entry, index) => (
                        <li key={entry.id ?? index}>
                            {entry.previous_status ?? "Created"} → {entry.new_status}
                            {" — "}
                            {entry.reason || "No reason provided"}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default AdminOrderDetails;
