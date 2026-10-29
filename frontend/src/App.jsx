import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductPage from './pages/Product';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart/';
import Register from './pages/Register';
import Login from './pages/Login';
import Address from './pages/Address';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from "./pages/OrderDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* TODO: improve this component to restricting access to authenticated users only */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProductPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/address" element={<Address />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
