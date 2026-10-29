import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCart } from '../../api/cart';
import { getAddresses } from '../../api/addresses';
import { createOrder } from '../../api/orders';
import styles from './checkout.module.scss';

const formatPrice = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(amount) || 0);

function Checkout() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [billingAddressId, setBillingAddressId] = useState('');
  const [sameBillingAddress, setSameBillingAddress] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadCheckout = async () => {
      try {
        setIsLoading(true);
        setError('');

        const [cartData, addressData] = await Promise.all([getCart(), getAddresses()]);

        if (!isActive) return;

        setCart(cartData);
        setAddresses(addressData);

        const defaultAddress = addressData.find((address) => address.is_default);

        const initialAddressId = String(defaultAddress?.id ?? addressData[0]?.id ?? '');

        setShippingAddressId(initialAddressId);
        setBillingAddressId(initialAddressId);
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Unable to load checkout information.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadCheckout();

    return () => {
      isActive = false;
    };
  }, []);

  const items = cart?.items ?? [];
  const total = Number(cart?.total) || 0;

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!shippingAddressId) {
      setError('Please select a shipping address.');
      return;
    }

    const selectedBillingAddressId = sameBillingAddress ? shippingAddressId : billingAddressId;

    if (!selectedBillingAddressId) {
      setError('Please select a billing address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const result = await createOrder(shippingAddressId, selectedBillingAddressId);
      console.log('Created order:', result.order);
      setPlacedOrder(result.order);
    } catch (err) {
      setError(err.message || 'Unable to place your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAddressLabel = (address) => {
    const lines = [
      address.full_name,
      address.phone,
      address.line1,
      address.line2,
      address.city,
      address.postal_code,
      address.country,
    ];

    return lines.filter(Boolean).join(', ');
  };

  if (isLoading) {
    return (
      <main className={styles.checkout}>
        <p role="status">Loading checkout...</p>
      </main>
    );
  }

  if (placedOrder) {
    return (
      <main className={styles.checkout}>
        <section className={styles.confirmation} aria-live="polite">
          <h1>Order placed successfully</h1>
          <p>Your order has been created.</p>

          <p>
            Order number: <strong>{placedOrder.id}</strong>
          </p>

          <p>
            Order total: <strong>{formatPrice(placedOrder.total_amount)}</strong>
          </p>

          <p>
            Status: <strong>{placedOrder.status}</strong>
          </p>

          <Link to="/cart" className={styles.secondaryLink}>
            Return to cart
          </Link>
        </section>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className={styles.checkout}>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link to="/cart" className={styles.secondaryLink}>
          Return to cart
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.checkout}>
      <h1>Checkout</h1>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.layout}>
        <form onSubmit={handlePlaceOrder} className={styles.form}>
          <section className={styles.section}>
            <h2>Shipping address</h2>

            {addresses.length === 0 ? (
              <p>
                You need a saved address before placing an order.{' '}
                <Link to="/addresses">Add an address</Link>
              </p>
            ) : (
              <>
                <label htmlFor="shippingAddress">Select shipping address</label>

                <select
                  id="shippingAddress"
                  value={shippingAddressId}
                  onChange={(event) => setShippingAddressId(event.target.value)}
                  required>
                  <option value="">Choose an address</option>

                  {addresses.map((address) => (
                    <option key={address.id} value={String(address.id)}>
                      {address.label || 'Address'} — {getAddressLabel(address)}
                      {address.is_default ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              </>
            )}
          </section>

          <section className={styles.section}>
            <h2>Billing address</h2>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={sameBillingAddress}
                onChange={(event) => setSameBillingAddress(event.target.checked)}
              />
              Use the shipping address as the billing address
            </label>

            {!sameBillingAddress && (
              <>
                <label htmlFor="billingAddress">Select billing address</label>

                <select
                  id="billingAddress"
                  value={billingAddressId}
                  onChange={(event) => setBillingAddressId(event.target.value)}
                  required>
                  <option value="">Choose an address</option>

                  {addresses.map((address) => (
                    <option key={address.id} value={String(address.id)}>
                      {address.label || 'Address'} — {getAddressLabel(address)}
                    </option>
                  ))}
                </select>
              </>
            )}

            {addresses.length === 0 && <p>Add an address before continuing.</p>}
          </section>

          <button
            type="submit"
            className={styles.placeOrderButton}
            disabled={
              isSubmitting ||
              addresses.length === 0 ||
              !shippingAddressId ||
              (!sameBillingAddress && !billingAddressId)
            }>
            {isSubmitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside className={styles.summary}>
          <h2>Order summary</h2>

          <ul className={styles.itemList}>
            {items.map((item) => {
              const itemSubtotal =
                item.subtotal != null
                  ? Number(item.subtotal)
                  : Number(item.price) * Number(item.quantity);

              return (
                <li key={item.product_id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>

                  <span>{formatPrice(itemSubtotal)}</span>
                </li>
              );
            })}
          </ul>

          <div className={styles.total}>
            <span>Estimated total</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <p className={styles.note}>
            The server verifies product prices and stock when creating your order. The final order total
            comes from the server.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default Checkout;
