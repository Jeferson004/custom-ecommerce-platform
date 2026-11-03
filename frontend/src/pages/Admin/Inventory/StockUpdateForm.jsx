import { useState } from 'react';
import styles from './inventory.module.scss';

function StockUpdateForm({ item, onSubmit, onCancel }) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (quantity.trim() === '') {
      setError('Quantity is required.');
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      setError('Quantity must be a non-negative whole number.');
      return;
    }

    try {
      setLoading(true);

      await onSubmit(item, parsedQuantity);
    } catch (error) {
      setError(error.message || 'Unable to update stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inventoryForm}>
      <h2>Update Stock</h2>

      <p>
        Product: <strong>{item.product_name}</strong>
      </p>

      <p>
        Current Stock: <strong>{item.quantity}</strong>
      </p>

      {error && <p role="alert">{error}</p>}

      <label htmlFor="quantity">New Stock Quantity *</label>

      <input
        id="quantity"
        name="quantity"
        type="number"
        min="0"
        step="1"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        required
      />

      <div className={styles.formActions}>
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Save Changes'}
        </button>

        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default StockUpdateForm;
