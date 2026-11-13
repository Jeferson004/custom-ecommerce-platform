import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductById, getProducts } from '../../../api/products';
import { addCartItem } from '../../../api/cart';
import ProductCard from '../../../components/ProductCard';
import styles from './productDetails.module.scss';

function ProductDetails() {
    const { id } = useParams();

    // Selected product states
    const [product, setProduct] = useState(null);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [productError, setProductError] = useState('');

    // Related products states
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState('');

    // Add to cart states
    const [addingToCart, setAddingToCart] = useState(false);
    const [cartMessage, setCartMessage] = useState('');
    const [cartError, setCartError] = useState('');

    // Fetch all products
    useEffect(() => {
        let ignore = false;

        const loadProducts = async () => {
            try {
                const data = await getProducts();

                if (!Array.isArray(data)) {
                    throw new Error('The products API did not return an array.');
                }

                if (!ignore) {
                    setProducts(data);
                }
            } catch (error) {
                if (!ignore) {
                    setProductsError(error.message);
                }
            } finally {
                if (!ignore) {
                    setLoadingProducts(false);
                }
            }
        };

        loadProducts();

        return () => {
            ignore = true;
        };
    }, []);

    // Fetch selected product
    useEffect(() => {
        let ignore = false;

        const loadProduct = async () => {
            setLoadingProduct(true);
            setProductError('');
            setProduct(null);

            try {
                const data = await getProductById(id);

                if (!ignore) {
                    setProduct(data);
                }
            } catch (error) {
                if (!ignore) {
                    setProductError(error.message);
                }
            } finally {
                if (!ignore) {
                    setLoadingProduct(false);
                }
            }
        };

        loadProduct();

        return () => {
            ignore = true;
        };
    }, [id]);

    // Add selected product to cart
    const handleAddToCart = async () => {
        if (!product) return;

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

    // Product loading state
    if (loadingProduct) {
        return (
            <main className={styles.productPage}>
                <p role="status" className={styles.message}>
                    Loading product...
                </p>
            </main>
        );
    }

    // Product error state
    if (productError) {
        const isNotFound =
            productError.toLowerCase().includes('not found') ||
            productError.toLowerCase().includes('404');

        return (
            <main className={styles.productDetails}>
                <h1>{isNotFound ? 'Product not found' : 'Unable to load product'}</h1>

                <p className={styles.error} role="alert">
                    {isNotFound
                        ? 'This product does not exist or may have been removed.'
                        : productError}
                </p>

                <Link to="/">Back to products</Link>
            </main>
        );
    }

    // Product unavailable state
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

    // Exclude currently selected product
    const otherProducts = products.filter((item) => String(item.id) !== String(product.id));

    return (
        <main className={styles.productDetails}>
            <Link to="/customer" className={styles.backLink}>
                ← Back to products
            </Link>

            {/* ========== Product Preview Section ========== */}
            <section className={styles.productPreviewSection}>
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

                    <p className={styles.description}>
                        {product.description || 'No description available.'}
                    </p>

                    <button type="button" onClick={handleAddToCart} disabled={addingToCart}>
                        {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>

                    {cartMessage && <p role="status">{cartMessage}</p>}
                    {cartError && <p role="alert">{cartError}</p>}
                </div>
            </section>

            {/* ========== Other Products Section ========== */}
            <section className={styles.otherProductsSection}>
                {loadingProducts ? (
                    <p role="status" className={styles.message}>
                        Loading products...
                    </p>
                ) : productsError ? (
                    <p role="alert" className={styles.error}>
                        Unable to load products: {productsError}
                    </p>
                ) : otherProducts.length === 0 ? (
                    <p className={styles.message}>No products found.</p>
                ) : (
                    <div className={styles.productGrid}>
                        {otherProducts.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default ProductDetails;
