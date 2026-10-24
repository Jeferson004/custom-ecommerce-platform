import { Link } from 'react-router-dom';
import styles from './productCard.module.scss';

function ProductCard({ product }) {
  const price = Number(product.price);

  const formattedPrice = Number.isFinite(price)
    ? price.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : 'Price unavailable';

  return (
    <article className={styles.productCard}>
      <div className={styles.imagePlaceholder}>
        <span>No image available</span>
      </div>

      <div className={styles.content}>
        <p className={styles.category}>{product.category_name || 'Uncategorized'}</p>

        <h2 className={styles.name}>{product.name}</h2>

        <p className={styles.description}>{product.description || 'No description available.'}</p>

        <p className={styles.price}>
          {formattedPrice === 'Price unavailable' ? formattedPrice : `₱${formattedPrice}`}
        </p>

        <Link
          to={`/products/${product.id}`}
          className={styles.viewButton}
          aria-disabled={!product.is_active}
          onClick={(event) => {
            if (!product.is_active) {
              event.preventDefault();
            }
          }}>
          {product.is_active ? 'View product' : 'Unavailable'}
        </Link>
      </div>
    </article>
  );
}

export default ProductCard;
