import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductPage from './pages/Product';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart/';
import Register from "./pages/Register";
import Login from "./pages/Login";


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

      </Routes>
    </BrowserRouter>
  );
}

export default App;
