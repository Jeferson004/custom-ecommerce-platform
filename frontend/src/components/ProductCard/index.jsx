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
      <div className={styles.imagePlaceholder} aria-label="Product image unavailable">
        <span>No image available</span>
      </div>

      <div className={styles.content}>
        <p className={styles.category}>{product.category_name || 'Uncategorized'}</p>
        <h2 className={styles.name}>{product.name}</h2>
        <p className={styles.description}>{product.description || 'No description available.'}</p>
        <p className={styles.price}>
          {formattedPrice === 'Price unavailable' ? formattedPrice : `₱${formattedPrice}`}
        </p>
        <button type="button" className={styles.viewButton} disabled={!product.is_active}>
          {product.is_active ? 'View product' : 'Unavailable'}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
