import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import addressService, { Address } from '../../services/addressService';
import orderService, { PlaceOrderRequest } from '../../services/orderService';

export default function CheckoutPage() {
  const { cart, isLoading: cartLoading, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user && !cartLoading) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    const fetchAddresses = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching addresses for checkout...');
        const addressesData = await addressService.getUserAddresses();
        console.log('Retrieved addresses:', addressesData);
        setAddresses(addressesData);
        
        // Set default address if available
        const defaultAddress = addressesData.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (addressesData.length > 0) {
          setSelectedAddressId(addressesData[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
        setError('Failed to load addresses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchAddresses();
    }
  }, [user, navigate, cartLoading]);

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === null || price === undefined) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(price);
  };

  // Calculate cart totals with safety checks
  const subtotal = cart?.totalPrice || 0;
  const shipping = cart?.items?.length > 0 ? 90 : 0;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Placing order with address ID:', selectedAddressId);
      const orderRequest: PlaceOrderRequest = {
        shippingAddressId: selectedAddressId,
        paymentMethod: paymentMethod
      };
      
      const order = await orderService.placeOrder(orderRequest);
      console.log('Order placed successfully:', order);
      
      await clearCart();
      
      // Navigate to order detail page with success flag
      navigate(`/orders/${order.id}?fromCheckout=true`);
    } catch (err) {
      console.error('Failed to place order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add items to your cart before checkout.</p>
            <Button onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Shipping Address Selection */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">No addresses found</p>
                  <Button onClick={() => navigate('/addresses')}>
                    Add New Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div 
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`border rounded-lg p-4 cursor-pointer hover:border-primary ${
                        selectedAddressId === address.id ? 'border-primary bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      {address.isDefault && (
                        <div className="mb-2">
                          <span className="bg-primary-100 text-primary text-xs px-2 py-1 rounded">
                            Default
                          </span>
                        </div>
                      )}
                      <p className="font-medium">{address.name || 'Address'}</p>
                      <p className="text-gray-600">
                        {address.street}, {address.city}, {address.state} {address.postalCode || address.zipCode}
                      </p>
                      <p className="text-gray-600">Phone: {address.phone || 'Not provided'}</p>
                    </div>
                  ))}
                  <div className="mt-4">
                    <Button 
                      onClick={() => navigate('/addresses')} 
                      variant="outline"
                      className="text-sm"
                    >
                      Add New Address
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
              
              <div className="space-y-3">
                {['COD', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING'].map((method) => (
                  <div 
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`border rounded-lg p-4 cursor-pointer hover:border-primary ${
                      paymentMethod === method ? 'border-primary bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center border ${
                        paymentMethod === method ? 'border-primary' : 'border-gray-400'
                      }`}>
                        {paymentMethod === method && (
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                        )}
                      </div>
                      <div className="text-gray-900 font-medium">
                        {method === 'COD' ? 'Cash on Delivery' : 
                         method === 'UPI' ? 'UPI Payment' : 
                         method === 'CREDIT_CARD' ? 'Credit Card' : 
                         method === 'DEBIT_CARD' ? 'Debit Card' : 'Net Banking'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cart.totalItems || 0} items)</span>
                  <span className="text-gray-900 font-medium">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900 font-medium">+ {formatPrice(shipping)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span className="text-gray-900 font-medium">+ {formatPrice(tax)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  onClick={handlePlaceOrder}
                  className="w-full py-3"
                  disabled={isSubmitting || !selectedAddressId || addresses.length === 0}
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 