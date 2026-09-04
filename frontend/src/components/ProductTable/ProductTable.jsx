import { useEffect, useState } from 'react';
import { getProducts, deleteProduct } from '../../services/productService.js';
import s from './ProductTable.module.css';

function ProductTable({ onAdd, onEdit }) {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;

    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (date) => {
    return new Date(date)
      .toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .replace(',', '');
  };

  return (
    <section className="section">
      <div className="container">
        <div className={s.header_and_button}>
          <h2>Products</h2>
          <div className={s.button_container}>
            <button onClick={onAdd}>Add Product</button>
            <button onClick={fetchProducts}>Refresh</button>
          </div>
        </div>

        <table border={1} className={s.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>
                  {product.image && (
                    <img
                      src={`http://localhost:3000/uploads/${product.image}`}
                      alt={product.name}
                      width="100"
                    />
                  )}
                </td>

                <td>{product.name}</td>
                <td>₱{product.price}</td>
                <td>{formatDate(product.created_at)}</td>
                <td>{formatDate(product.updated_at)}</td>
                <td>
                  <div className={s.button_container}>
                    <button onClick={() => onEdit(product)}>Update</button>
                    <button onClick={() => handleDelete(product.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ProductTable;
