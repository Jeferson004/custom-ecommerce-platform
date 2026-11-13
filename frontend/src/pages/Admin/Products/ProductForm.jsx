import { useState } from 'react';
import styles from './ProductForm.module.scss';

function ProductForm({ categories = [], product = null, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        category_id: product?.category_id ?? '',
        name: product?.name ?? '',
        description: product?.description ?? '',
        price: product?.price ?? '',
        sku: product?.sku ?? '',
        is_active: product?.is_active ?? true,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditing = Boolean(product);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!formData.category_id || !formData.name.trim() || formData.price === '') {
            setError('Please complete all required fields.');
            return;
        }

        if (!Number.isFinite(Number(formData.price)) || Number(formData.price) < 0) {
            setError('Please enter a valid price.');
            return;
        }

        try {
            setLoading(true);

            const productData = {
                ...formData,
                category_id: Number(formData.category_id),
                name: formData.name.trim(),
                price: Number(formData.price),
                description: formData.description.trim() || null,
                sku: formData.sku.trim() || null,
            };

            await onSubmit(productData);
        } catch (error) {
            setError(error.message || `Unable to ${isEditing ? 'update' : 'create'} product.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.productForm}>
                <h2>{isEditing ? 'Edit Product' : 'Add Product'}</h2>

                {error && <p role="alert">{error}</p>}

                <div className={styles.labelAndInput}>
                    <label htmlFor="name">Product Name *</label>
                    <input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.labelAndInput}>
                    <label htmlFor="category_id">Category *</label>
                    <select
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        required>
                        <option value="">Select a category</option>

                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.labelAndInput}>
                    <label htmlFor="price">Price *</label>
                    <input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.labelAndInput}>
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.labelAndInput}>
                    <label htmlFor="sku">SKU</label>
                    <input id="sku" name="sku" value={formData.sku} onChange={handleChange} />
                </div>

                <div className={styles.labelAndInput}>
                    <label>
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                        />
                        Active product
                    </label>
                </div>

                <div className={styles.formActions}>
                    <button type="submit" disabled={loading}>
                        {loading
                            ? isEditing
                                ? 'Updating...'
                                : 'Creating...'
                            : isEditing
                              ? 'Update Product'
                              : 'Create Product'}
                    </button>

                    {onCancel && (
                        <button type="button" onClick={onCancel} disabled={loading}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default ProductForm;
