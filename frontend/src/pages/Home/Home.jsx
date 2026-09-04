import { useEffect, useState } from 'react';
import { getProducts } from '../../services/productService.js';
// import s from './Home.module.css';

const Home = () => {
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

  return (
    <>
      {products.map((product) => (
        <div key={product.id}>
          {product.image && (
            <img
              src={`http://localhost:3000/uploads/${product.image}`}
              alt={product.name}
              width="100"
            />
          )}

          <p>{product.name}</p>
          <p>₱{product.price}</p>
        </div>
      ))}
    </>
  );
};

export default Home;
