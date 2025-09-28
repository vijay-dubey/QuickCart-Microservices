import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import productService, { Product } from '../../services/productService';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import { ArrowLeftIcon, PhotoIcon, PencilSquareIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';

const ProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [product, setProduct] = useState<Product>({
    id: 0,
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    category: '',
    stockQuantity: 0,
    isActive: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    if (isEditing) {
      const fetchProduct = async () => {
        try {
          setIsLoading(true);
          const productData = await productService.getProductByIdAdmin(Number(id));
          setProduct(productData);
          setImagePreview(productData.imageUrl);
        } catch (err) {
          console.error('Failed to fetch product:', err);
          setError('Failed to load product details. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchProduct();
    }
  }, [id, isEditing, navigate, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProduct((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setProduct((prev) => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setProduct((prev) => ({ ...prev, [name]: value }));

      // Update image preview when imageUrl changes
      if (name === 'imageUrl' && value) {
        setImagePreview(value);
        setImageError(false);
      }
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const validateForm = (): boolean => {
    if (!product.name.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!product.category) {
      setError('Please select a category');
      return false;
    }
    if (product.price <= 0) {
      setError('Price must be greater than zero');
      return false;
    }
    if (product.stockQuantity < 0) {
      setError('Stock quantity cannot be negative');
      return false;
    }
    if (!product.imageUrl.trim()) {
      setError('Image URL is required');
      return false;
    }
    if (!product.description.trim()) {
      setError('Description is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditing && product.id) {
        console.log('Product data before update:', product);

        // Ensure category is valid and not null
        if (!product.category) {
          setError('Please select a valid category');
          setIsLoading(false);
          return;
        }

        // Create a complete product object for update
        const updateData = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category, // Explicitly include category
          imageUrl: product.imageUrl,
          stockQuantity: product.stockQuantity,
          isActive: product.isActive
        };

        console.log('Sending product update data:', updateData);
        await productService.updateProduct(product.id, updateData);
        setSuccess('Product updated successfully!');

        // Refresh product data from server to ensure UI is in sync
        try {
          const updatedProduct = await productService.getProductById(product.id);
          setProduct(updatedProduct);
        } catch (refreshErr) {
          console.warn('Unable to refresh product data after update:', refreshErr);
        }
      } else {
        // Ensure category is valid and not null for new product
        if (!product.category) {
          setError('Please select a valid category');
          setIsLoading(false);
          return;
        }

        const newProduct = { ...product };
        delete (newProduct as any).id;
        await productService.createProduct(newProduct as Omit<Product, 'id'>);
        setSuccess('Product created successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setProduct({
          id: 0,
          name: '',
          description: '',
          price: 0,
          imageUrl: '',
          category: '',
          stockQuantity: 0,
          isActive: true
        });
        setImagePreview('');
      }
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setError(err?.response?.data?.message || 'Failed to save product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left section - Back button */}
          <div className="md:w-1/5 sticky top-24 h-fit">
            <button
              onClick={() => navigate('/admin/products')}
              className="flex items-center bg-white text-primary border border-primary px-4 py-2 rounded-lg shadow hover:bg-primary hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Products
            </button>
          </div>

          {/* Right section - Form */}
          <div className="md:w-4/5">
            <div className="bg-white shadow-lg rounded-lg p-4">
              <div className="flex items-center gap-3 mb-6">
                {isEditing ? (
                  <PencilSquareIcon className="w-7 h-7 text-primary" />
                ) : (
                  <DocumentPlusIcon className="w-7 h-7 text-primary" />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {isEditing ? 'Edit Product' : 'Add New Product'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEditing ? 'Update existing product details' : 'Create a new product listing'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8 rounded-md">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Product Image */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Product Image</h3>
                    <div className="aspect-w-1 aspect-h-1 w-full bg-gray-100 rounded-lg overflow-hidden">
                      {imagePreview && !imageError ? (
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="object-cover w-full h-full"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <PhotoIcon className="h-16 w-16" />
                          <p className="text-sm">No image preview available</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Ensure the image URL is accessible and displays correctly.
                    </p>
                  </div>

                  {/* Right Column - Form Fields */}
                  <div className="space-y-6">
                    {/* Product Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name*
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={product.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:outline-none text-gray-800"
                        placeholder="Enter product name"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category*
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={product.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:outline-none text-gray-800"
                      >
                        <option value="">Select a category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Footwear">Footwear</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Books">Books</option>
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Toys">Toys</option>
                        <option value="Sports">Sports</option>
                        <option value="Grocery">Grocery</option>
                      </select>
                    </div>

                    {/* Price & Quantity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                          Price (₹)*
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">₹</span>
                          </div>
                          <input
                            type="number"
                            id="price"
                            name="price"
                            value={product.price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            required
                            className="pl-8 w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:outline-none text-gray-800"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                          Stock Quantity*
                        </label>
                        <input
                          type="number"
                          id="stockQuantity"
                          name="stockQuantity"
                          value={product.stockQuantity}
                          onChange={handleInputChange}
                          min="0"
                          required
                          className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:outline-none text-gray-800"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Image URL */}
                    <div>
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL*
                      </label>
                      <input
                        type="text"
                        id="imageUrl"
                        name="imageUrl"
                        value={product.imageUrl}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:outline-none text-gray-800"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description*
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={product.description}
                        onChange={handleInputChange}
                        rows={4}
                        required
                        className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:outline-none text-gray-800"
                        placeholder="Describe your product..."
                      />
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={product.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                        Active Product (visible to customers)
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/admin/products')}
                        className="text-gray-500 border-gray-300 hover:text-gray-700 hover:border-gray-400"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={isLoading}
                        className="bg-primary text-white hover:bg-primary-dark focus:ring-4 focus:ring-primary-light"
                      >
                        {isEditing ? 'Update Product' : 'Create Product'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );




};

export default ProductForm; 