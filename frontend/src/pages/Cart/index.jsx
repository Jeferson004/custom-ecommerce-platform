import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCart, updateCartItem, removeCartItem, clearCart } from '../../api/cart';
import styles from './cart.module.scss';

function formatPrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return 'Price unavailable';
  }

  return `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Cart() {
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      const data = await getCart();

      setCart(data.cart);
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
      setError('');

      return true;
    } catch (error) {
      setError(error.message || 'Unable to load your cart.');
      return false;
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchCart = async () => {
      try {
        const data = await getCart();

        if (ignore) return;

        setCart(data.cart);
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total) || 0);
        setError('');
      } catch (error) {
        if (!ignore) {
          setError(error.message || 'Unable to load your cart.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchCart();

    return () => {
      ignore = true;
    };
  }, []);

  const handleQuantityChange = async (item, quantity) => {
    if (quantity < 1 || updatingId !== null) return;

    setUpdatingId(item.product_id);
    setError('');

    try {
      await updateCartItem(item.product_id, quantity);
      await loadCart();
    } catch (error) {
      setError(error.message || 'Unable to update quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId) => {
    if (updatingId !== null) return;

    setUpdatingId(productId);
    setError('');

    try {
      await removeCartItem(productId);
      await loadCart();
    } catch (error) {
      setError(error.message || 'Unable to remove product.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (clearing || updatingId !== null || items.length === 0) return;

    setClearing(true);
    setError('');

    try {
      await clearCart();
      await loadCart();
    } catch (error) {
      setError(error.message || 'Unable to clear your cart.');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <p className={styles.message} role="status">
        Loading cart...
      </p>
    );
  }

  if (error && !cart && items.length === 0) {
    return (
      <main className={styles.cart}>
        <h1>Shopping Cart</h1>
        <p className={styles.error} role="alert">
          {error}
        </p>
        <button type="button" onClick={loadCart}>
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className={styles.cart}>
      <h1>Shopping Cart</h1>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <section className={styles.emptyCart}>
          <h2>Your cart is empty</h2>
          <p>Add some products before checking out.</p>
          <Link to="/">Browse products</Link>
        </section>
      ) : (
        <>
          <div className={styles.cartItems}>
            {items.map((item) => {
              const productId = item.product_id;
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.price);
              const subtotal = Number(
                item.subtotal ?? (Number.isFinite(unitPrice) ? unitPrice * quantity : NaN),
              );

              return (
                <article className={styles.cartItem} key={productId}>
                  <div className={styles.itemInfo}>
                    <h2>{item.name}</h2>
                    <p>Unit price: {formatPrice(item.price)}</p>
                    <p>Subtotal: {formatPrice(subtotal)}</p>
                  </div>

                  <div className={styles.itemActions}>
                    <div className={styles.quantityControl}>
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        disabled={quantity <= 1 || updatingId !== null || clearing}
                        onClick={() => handleQuantityChange(item, quantity - 1)}>
                        −
                      </button>

                      <span aria-live="polite">{quantity}</span>

                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        disabled={updatingId !== null || clearing}
                        onClick={() => handleQuantityChange(item, quantity + 1)}>
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.removeButton}
                      disabled={updatingId !== null || clearing}
                      onClick={() => handleRemove(productId)}>
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <section className={styles.cartSummary}>
            <h2>Order Summary</h2>
            <p>
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </p>

            <button
              type="button"
              className={styles.clearButton}
              disabled={clearing || updatingId !== null}
              onClick={handleClearCart}>
              {clearing ? 'Clearing...' : 'Clear Cart'}
            </button>

            <Link to="/checkout" className={styles.checkoutButton}>
              Proceed to Checkout
            </Link>
          </section>
        </>
      )}
    </main>
  );
}

export default Cart;
