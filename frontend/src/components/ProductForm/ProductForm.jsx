import { useEffect, useState } from 'react';

import { createProduct, updateProduct } from '../../services/productService.js';
import s from './ProductForm.module.css';

function ProductForm({ selectedProduct, onSuccess, onCancel }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (selectedProduct) {
      setName(selectedProduct.name);
      setPrice(selectedProduct.price);
      setImage(null);

      if (selectedProduct.image) {
        setImagePreview(`http://localhost:3000/uploads/${selectedProduct.image}`);
      } else {
        setImagePreview(null);
      }
    } else {
      setName('');
      setPrice('');
      setImage(null);
      setImagePreview(null);
    }
  }, [selectedProduct]);

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    if (!selectedImage) return;
    setImage(selectedImage);

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);

    if (image) {
      formData.append('image', image);
    }

    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, formData);
      } else {
        await createProduct(formData);
      }

      setName('');
      setPrice('');
      setImage(null);
      setImagePreview(null);

      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.form_container}>
          <div className={s.input_container}>
            <h2>{selectedProduct ? 'Update Product' : 'Add Product'}</h2>

            <input
              type="text"
              placeholder="Product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <input type="file" accept="image/*" onChange={handleImageChange} />

            {imagePreview && (
              <div className={s.image_preview}>
                <img src={imagePreview} alt="Product preview" />
              </div>
            )}
          </div>

          <div className={s.button_container}>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>

            <button type="submit">{selectedProduct ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
