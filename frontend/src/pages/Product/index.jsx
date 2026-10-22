
import { useEffect, useState } from "react";
import { getProducts } from "../../api/products";
import ProductCard from "../../components/ProductCard";
import styles from "./product.module.scss";

function ProductPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;

        const loadProducts = async () => {
            try {
                const data = await getProducts();

                if (!Array.isArray(data)) {
                    throw new Error(
                        "The products API did not return an array."
                    );
                }

                if (!ignore) {
                    setProducts(data);
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

        loadProducts();

        return () => {
            ignore = true;
        };
    }, []);

    if (loading) {
        return (
            <main className={styles.productPage}>
                <p role="status" className={styles.message}>
                    Loading products...
                </p>
            </main>
        );
    }

    if (error) {
        return (
            <main className={styles.productPage}>
                <h1 className={styles.title}>Products</h1>
                <p role="alert" className={styles.error}>
                    Unable to load products: {error}
                </p>

                <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => window.location.reload()}
                >
                    Try again
                </button>
            </main>
        );
    }

    return (
        <main className={styles.productPage}>
            <header className={styles.header}>
                <h1 className={styles.title}>Our Products</h1>
                <p className={styles.subtitle}>
                    Browse our available products.
                </p>
            </header>

            {products.length === 0 ? (
                <p className={styles.message}>
                    No products found.
                </p>
            ) : (
                <div className={styles.productGrid}>
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}

export default ProductPage;
