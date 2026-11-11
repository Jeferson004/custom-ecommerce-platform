import { useEffect, useState } from 'react';
import { getInventoryTransactions } from '../../../api/inventory';
import styles from './transactions.module.scss';

function AdminTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;

        const fetchTransactions = async () => {
            try {
                const data = await getInventoryTransactions();

                if (ignore) return;

                setTransactions(data);
            } catch (error) {
                if (ignore) return;

                console.error('Fetch transactions error:', error);

                setError(error.message || 'Failed to fetch transactions.');
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchTransactions();

        return () => {
            ignore = true;
        };
    }, []);

    if (loading) {
        return <p role="status">Loading transactions...</p>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Inventory Transactions</h1>
                    <p>Review and monitor inventory stock movements.</p>
                </div>
            </div>

            {error && <p role="alert">{error}</p>}

            <section className={styles.transactionList}>
                <h2>Transaction History ({transactions.length})</h2>

                {transactions.length === 0 ? (
                    <p>No inventory transactions found.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Product</th>
                                <th>Previous Stock</th>
                                <th>Change</th>
                                <th>New Stock</th>
                                <th>Reason</th>
                                <th>Updated By</th>
                                <th>Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction.id}>
                                    <td>{transaction.id}</td>
                                    <td>{transaction.product_name}</td>
                                    <td>{transaction.quantity_before}</td>
                                    <td>
                                        {transaction.quantity_change > 0 ? '+' : ''}
                                        {transaction.quantity_change}
                                    </td>
                                    <td>{transaction.quantity_after}</td>
                                    <td>{transaction.reason}</td>
                                    <td>{transaction.adjusted_by || 'System'}</td>
                                    <td>{new Date(transaction.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

export default AdminTransactions;
