import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import productService, { Product } from '../../services/productService';
import { PencilIcon, TrashIcon, PlusIcon, ArrowLeftIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function AdminProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = id ? parseInt(id, 10) : null;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    // Redirect if user is not an admin
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    // If we have a product ID, redirect to the product edit form
    if (productId) {
      // Check if this is a product edit form URL to avoid infinite redirect
      if (!window.location.pathname.includes('/form')) {
        navigate(`/admin/products/edit/${productId}/form`);
        return;
      }
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Get all products including inactive ones
        // First try the /all endpoint
        try {
          const data = await productService.getAllProductsIncludingInactive();
          setProducts(data);
        } catch (err) {
          console.warn('Failed to fetch from /products/all endpoint, falling back to regular endpoint:', err);
          // Fall back to regular getAllProducts
          const data = await productService.getAllProducts();
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user, navigate, productId]);

  const handleAddProduct = () => {
    // Fix: Navigate to the new product form without triggering redirects
    navigate('/admin/products/add');
  };

  const handleEditProduct = (productId: number) => {
    // Navigate directly to the edit form
    navigate(`/admin/products/edit/${productId}/form`);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setIsDeleting(productId);
    try {
      await productService.deleteProduct(productId);
      // Instead of removing, update the product's isActive status in the products list
      setProducts(products.map(product =>
        product.id === productId
          ? { ...product, isActive: false }
          : product
      ));
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatPrice = (price: number) => {
    if (isNaN(price)) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header Row with Back Button, Title and Add Button */}
        <div className="flex justify-between items-center mb-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center bg-white text-primary border border-primary px-4 py-2 rounded-lg shadow hover:bg-primary hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>

          {/* Page Title */}
          <div className="flex items-center gap-3 mb-100">
            <ShoppingCartIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manage Products</h1>
              <p className="text-sm text-gray-500">Admin panel to manage your inventory and listings</p>
            </div>
          </div>

          {/* Add Product Button */}
          <Button onClick={handleAddProduct}>
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Product
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Product Table or Loading Spinner */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={product.imageUrl || '/placeholder-product.jpg'}
                          alt={product.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{formatPrice(product.price)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{product.stockQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => handleEditProduct(product.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isDeleting === product.id}
                      >
                        {isDeleting === product.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-600"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );

} 