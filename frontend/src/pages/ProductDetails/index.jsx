import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductById } from '../../api/products';
import { addCartItem } from '../../api/cart';
import styles from './productDetails.module.scss';

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');

  const handleAddToCart = async () => {
    setAddingToCart(true);
    setCartMessage('');
    setCartError('');

    try {
      await addCartItem(product.id, 1);
      setCartMessage('Product added to cart.');
    } catch (error) {
      setCartError(error.message || 'Unable to add product to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadProduct = async () => {
      setLoading(true);
      setError('');
      setProduct(null);

      try {
        const data = await getProductById(id);

        if (!ignore) {
          setProduct(data);
        }
      } catch (error) {
        if (!ignore) {
          setError(error.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <p className={styles.message} role="status">
        Loading product...
      </p>
    );
  }

  if (error) {
    const isNotFound = error.toLowerCase().includes('not found') || error.toLowerCase().includes('404');

    return (
      <main className={styles.productDetails}>
        <h1>{isNotFound ? 'Product not found' : 'Unable to load product'}</h1>

        <p className={styles.error} role="alert">
          {isNotFound ? 'This product does not exist or may have been removed.' : error}
        </p>

        <Link to="/">Back to products</Link>
      </main>
    );
  }

  if (!product || !product.is_active) {
    return (
      <main className={styles.productDetails}>
        <h1>Product unavailable</h1>
        <p>This product is unavailable or does not exist.</p>
        <Link to="/">Back to products</Link>
      </main>
    );
  }

  const price = Number(product.price);

  return (
    <main className={styles.productDetails}>
      <Link to="/" className={styles.backLink}>
        ← Back to products
      </Link>

      <section className={styles.productLayout}>
        <div className={styles.imagePlaceholder}>No image available</div>

        <div className={styles.productInfo}>
          <p className={styles.category}>{product.category_name || 'Uncategorized'}</p>

          <h1>{product.name}</h1>

          <p className={styles.price}>
            {Number.isFinite(price)
              ? `₱${price.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : 'Price unavailable'}
          </p>

          <p className={styles.description}>{product.description || 'No description available.'}</p>

          <button type="button" onClick={handleAddToCart} disabled={addingToCart}>
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </button>

          {cartMessage && <p role="status">{cartMessage}</p>}

          {cartError && <p role="alert">{cartError}</p>}
        </div>
      </section>
    </main>
  );
}

export default ProductDetails;
