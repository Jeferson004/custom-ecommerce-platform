import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductPage from './pages/Product';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart/';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductPage />} />

        <Route path="/cart" element={<Cart />} />

        <Route path="/products/:id" element={<ProductDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
