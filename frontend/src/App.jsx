import { useState } from 'react';

import ProductForm from './components/ProductForm/ProductForm.jsx';
import ProductTable from './components/ProductTable/ProductTable.jsx';
import Home from './pages/Home/Home.jsx';

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setSelectedProduct(null);
    setShowForm(false);
  };

  const handleSuccess = () => {
    setSelectedProduct(null);
  };

  return (
    <main>
      <Home />

      {showForm && (
        <ProductForm
          selectedProduct={selectedProduct}
          onSuccess={handleSuccess}
          onCancel={handleCloseForm}
        />
      )}

      <ProductTable onAdd={handleAdd} onEdit={handleEdit} />
    </main>
  );
}

export default App;
