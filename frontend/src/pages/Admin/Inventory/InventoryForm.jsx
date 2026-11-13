import { useState } from 'react';
import styles from './inventoryForm.module.scss';

function InventoryForm({ products = [], inventory = [], onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        product_id: '',
        quantity: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Products that do not have an inventory record yet.
    const availableProducts = products.filter(
        (product) => !inventory.some((item) => Number(item.product_id) === Number(product.id)),
    );

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!formData.product_id || formData.quantity === '') {
            setError('Please complete all required fields.');
            return;
        }

        const quantity = Number(formData.quantity);

        if (!Number.isInteger(quantity) || quantity < 0) {
            setError('Quantity must be a non-negative whole number.');
            return;
        }

        try {
            setLoading(true);

            await onSubmit({
                product_id: Number(formData.product_id),
                quantity,
            });

            setFormData({
                product_id: '',
                quantity: '',
            });
        } catch (error) {
            setError(error.message || 'Unable to save inventory.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.inventoryForm}>
                <h2>Add Inventory</h2>

                {error && <p role="alert">{error}</p>}

                <div className={styles.labelAndInput}>
                    <label htmlFor="product_id">Product *</label>
                    <select
                        id="product_id"
                        name="product_id"
                        value={formData.product_id}
                        onChange={handleChange}
                        required>
                        <option value="">Select a product</option>

                        {availableProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>

                    {availableProducts.length === 0 && (
                        <p>All products already have inventory records.</p>
                    )}
                </div>

                <div className={styles.labelAndInput}>
                    <label htmlFor="quantity">Initial Stock Quantity *</label>
                    <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.formActions}>
                    <button type="submit" disabled={loading || availableProducts.length === 0}>
                        {loading ? 'Saving...' : 'Create Inventory'}
                    </button>

                    {onCancel && (
                        <button type="button" onClick={onCancel} disabled={loading}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default InventoryForm;
