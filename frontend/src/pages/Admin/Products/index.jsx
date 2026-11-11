import { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct } from '../../../api/products';
import { getCategories } from '../../../api/categories';
import ProductForm from './ProductForm';
import styles from './products.module.scss';

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingProductId, setUpdatingProductId] = useState(null);

    // Fetch products and categories.
    const fetchData = async () => {
        try {
            setError('');

            const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()]);

            setProducts(productsData);
            setCategories(categoriesData);
        } catch (error) {
            setError(error.message || 'Unable to load products.');
        }
    };

    // Initial data loading.
    useEffect(() => {
        let ignore = false;

        const loadData = async () => {
            try {
                const [productsData, categoriesData] = await Promise.all([
                    getProducts(),
                    getCategories(),
                ]);

                if (!ignore) {
                    setProducts(productsData);
                    setCategories(categoriesData);
                }
            } catch (error) {
                if (!ignore) {
                    setError(error.message || 'Unable to load products.');
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            ignore = true;
        };
    }, []);

    // Create or update a product.
    const handleSubmitProduct = async (productData) => {
        if (editingProduct) {
            await updateProduct(editingProduct.id, productData);
        } else {
            await createProduct(productData);
        }

        await fetchData();

        setShowForm(false);
        setEditingProduct(null);
    };

    // Select a product for editing.
    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    const handleToggleProductStatus = async (product) => {
        try {
            setError('');
            setUpdatingProductId(product.id);

            const productData = {
                category_id: product.category_id,
                name: product.name,
                description: product.description,
                price: Number(product.price),
                sku: product.sku,
                is_active: !product.is_active,
            };

            await updateProduct(product.id, productData);

            await fetchData();
        } catch (error) {
            setError(error.message || 'Unable to update product status.');
        } finally {
            setUpdatingProductId(null);
        }
    };

    // Open the form in create mode.
    const handleAddProduct = () => {
        setEditingProduct(null);
        setShowForm(true);
    };

    // Close and reset the form.
    const handleCloseForm = () => {
        setShowForm(false);
        setEditingProduct(null);
    };

    if (loading) {
        return <p role="status">Loading products...</p>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Product Management</h1>
                    <p>Manage your store products.</p>
                </div>

                <button type="button" onClick={showForm ? handleCloseForm : handleAddProduct}>
                    {showForm ? 'Close Form' : 'Add Product'}
                </button>
            </div>

            {error && <p role="alert">{error}</p>}

            {showForm && (
                <ProductForm
                    key={editingProduct?.id ?? 'new'}
                    categories={categories}
                    product={editingProduct}
                    onSubmit={handleSubmitProduct}
                    onCancel={handleCloseForm}
                />
            )}

            <section className={styles.productList}>
                <h2>Products ({products.length})</h2>

                {products.length === 0 ? (
                    <p>No products found.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>{product.id}</td>
                                    <td>{product.name}</td>
                                    <td>{product.category_name}</td>
                                    <td>₱{Number(product.price).toFixed(2)}</td>
                                    <td>{product.is_active ? 'Active' : 'Inactive'}</td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => handleEditProduct(product)}>
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleProductStatus(product)}
                                            disabled={updatingProductId === product.id}>
                                            {updatingProductId === product.id
                                                ? 'Updating...'
                                                : product.is_active
                                                  ? 'Deactivate'
                                                  : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

export default AdminProducts;
