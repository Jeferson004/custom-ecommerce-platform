import { useEffect, useState } from 'react';
import { getProducts } from '../../services/productService.js';
// import s from './Home.module.css';

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      getProducts()
        .then((data) => {
          if (isMounted) {
            setProducts(data);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
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
