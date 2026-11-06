import { useEffect, useState } from 'react';
import { getInventory, createInventory, updateInventory } from '../../../api/inventory';
import { getProducts } from '../../../api/products';
import InventoryForm from './InventoryForm';
import StockUpdateForm from './StockUpdateForm';
import styles from './inventory.module.scss';

const LOW_STOCK_THRESHOLD = 5;

function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch inventory, products, and transaction history.
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [inventoryData, productsData] = await Promise.all([getInventory(), getProducts()]);

      setInventory(inventoryData);
      setProducts(productsData);
    } catch (error) {
      console.error('Fetch inventory data error:', error);
      setError(error.message || 'Failed to fetch inventory data.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading.
  useEffect(() => {
    let ignore = false;

    const loadInitialData = async () => {
      try {
        const [inventoryData, productsData] = await Promise.all([getInventory(), getProducts()]);

        if (ignore) return;

        setInventory(inventoryData);
        setProducts(productsData);
      } catch (error) {
        if (ignore) return;

        console.error('Fetch inventory data error:', error);
        setError(error.message || 'Failed to fetch inventory data.');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  // Create an inventory record.
  const handleCreateInventory = async (inventoryData) => {
    await createInventory(inventoryData.product_id, inventoryData.quantity);

    await fetchData();

    setShowForm(false);
  };

  // Update an existing inventory quantity.
  const handleUpdateQuantity = async (item, quantity) => {
    try {
      setError('');
      setUpdatingProductId(item.product_id);

      await updateInventory(item.product_id, quantity);

      await fetchData();

      setSelectedItem(null);
    } catch (error) {
      setError(error.message || 'Unable to update inventory.');
      throw error;
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleOpenUpdateForm = (item) => {
    setSelectedItem(item);
  };

  if (loading) {
    return <p role="status">Loading inventory...</p>;
  }

  const getStockStatus = (quantity) => {
    const stock = Number(quantity);

    if (stock === 0) {
      return {
        label: 'Out of Stock',
        className: styles.outOfStock,
      };
    }

    if (stock <= LOW_STOCK_THRESHOLD) {
      return {
        label: 'Low Stock',
        className: styles.lowStock,
      };
    }

    return {
      label: 'In Stock',
      className: styles.inStock,
    };
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1>Inventory Management</h1>
          <p>Monitor and manage your product stock.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((previous) => !previous);
            setSelectedItem(null);
          }}>
          {showForm ? 'Close Form' : 'Add Inventory'}
        </button>
      </header>

      {error && <p role="alert">{error}</p>}

      {showForm && (
        <InventoryForm
          products={products}
          inventory={inventory}
          onSubmit={handleCreateInventory}
          onCancel={() => setShowForm(false)}
        />
      )}

      {selectedItem && (
        <StockUpdateForm
          key={selectedItem.product_id}
          item={selectedItem}
          onSubmit={handleUpdateQuantity}
          onCancel={() => setSelectedItem(null)}
        />
      )}

      <section className={styles.inventoryList}>
        <h2>Inventory ({inventory.length})</h2>

        {inventory.length === 0 ? (
          <p>No inventory records found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Available Stock</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {inventory.map((item) => {
                const stockStatus = getStockStatus(item.quantity);

                return (
                  <tr key={item.id}>
                    <td>{item.product_id}</td>

                    <td>{item.product_name}</td>

                    <td>{item.quantity}</td>

                    <td>
                      <span className={stockStatus.className}>{stockStatus.label}</span>
                    </td>

                    <td>{new Date(item.updated_at).toLocaleString()}</td>

                    <td>
                      <button
                        type="button"
                        disabled={updatingProductId === item.product_id}
                        onClick={() => handleOpenUpdateForm(item)}>
                        Update Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

export default AdminInventory;
