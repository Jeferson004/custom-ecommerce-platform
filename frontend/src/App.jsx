import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductPage from './pages/Product';
import ProductDetails from './pages/Product/ProductDetails';
import Cart from './pages/Cart/';
import Register from './pages/Register';
import Login from './pages/Login';
import Address from './pages/Address';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/Orders/OrderDetails';
import AdminRoute from './components/Auth/AdminRoute';
import AdminProducts from './pages/Admin/Products';
import AdminInventory from './pages/Admin/Inventory';
import AdminTransactions from './pages/Admin/Transactions';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminLayout from './layouts/AdminLayout';
import AdminOrders from './pages/Admin/Orders';
import AdminOrderDetails from './pages/Admin/Orders/OrderDetails';

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

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />

            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetails />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
