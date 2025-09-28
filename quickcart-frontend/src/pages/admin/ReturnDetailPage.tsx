import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/ui/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import returnService from '../../services/returnService';
import orderService from '../../services/orderService';
import Button from '../../components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const returnId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [returnRequest, setReturnRequest] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    // Redirect if user is not an admin
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    const fetchReturnDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch the return request details
        const returnData = await returnService.getReturnRequestById(returnId);

        // Explicitly fetch return items 
        if (!returnData.returnItems || returnData.returnItems.length === 0) {
          const items = await returnService.getReturnItemsForRequest(returnId);
          returnData.returnItems = items;
        }

        // Set return request data
        setReturnRequest(returnData);


        // Fetch the order details to get product information for the returned items
        if (returnData.orderId) {
          const orderData = await orderService.getOrderDetails(returnData.orderId);
          setOrder(orderData);

          // Enrich the return items with product information
          if (returnData.returnItems && returnData.returnItems.length > 0 && orderData && orderData.items) {
            const enrichedItems = returnData.returnItems.map(item => {
              const orderItem = orderData.items.find(oi => oi.id === item.orderItemId);
              if (orderItem) {
                return {
                  ...item,
                  productName: orderItem.productName,
                  productPrice: orderItem.price,
                  productImageUrl: orderItem.productImageUrl
                };
              }
              return item;
            });
            setReturnRequest({
              ...returnData,
              returnItems: enrichedItems
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch return details:', err);
        setError('Failed to load return details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReturnDetails();
  }, [returnId, user, navigate]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === null || price === undefined) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(price);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PROCESSED':
        return 'bg-blue-100 text-blue-800';
      case 'REFUND_INITIATED':
        return 'bg-purple-100 text-purple-800';
      case 'REFUNDED':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus(e.target.value);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === returnRequest.status) return;

    setIsUpdatingStatus(true);
    try {
      await orderService.updateReturnStatus(returnId, newStatus);

      // Refresh the return data
      const updatedReturn = await returnService.getReturnRequestById(returnId);
      setReturnRequest(updatedReturn);

      // Refresh the order if needed
      if (order) {
        const updatedOrder = await orderService.getOrderDetails(order.id);
        setOrder(updatedOrder);
      }

      setNewStatus('');
    } catch (err) {
      console.error('Failed to update return status:', err);
      alert('Failed to update return status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewOrder = () => {
    if (order) {
      navigate(`/admin/orders/${order.id}`, { state: { fromReturn: returnId } });
    }
  };

  if (isLoading) {
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

  if (error || !returnRequest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error || 'Return request not found.'}
          </div>
        </div>
      </div>
    );
  }

  const availableTransitions = {
    'REQUESTED': ['APPROVED', 'CANCELLED'],
    'APPROVED': ['PROCESSED', 'CANCELLED'],
    'PROCESSED': ['REFUND_INITIATED'],
    'REFUND_INITIATED': ['REFUNDED'],
    'REFUNDED': [],
    'CANCELLED': []
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header with back button */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/admin/returns')}
            className="flex items-center bg-white text-primary border border-primary px-4 py-2 rounded-lg shadow hover:bg-primary hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Returns
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Return #{String(returnRequest.id).padStart(6, '0')}</h1>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleViewOrder}
              variant="primary"
              size="sm"
            >
              View Order
            </Button>
          </div>
        </div>

        {/* Return Information Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Return Request Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the return request.</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(returnRequest.status)}`}>
              {returnRequest.status}
            </span>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  #{String(returnRequest.orderId).padStart(6, '0')}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {returnRequest.customerEmail}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Return Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {returnRequest.type}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Reason</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {returnRequest.reason || 'No reason provided'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Requested On</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(returnRequest.createdAt)}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(returnRequest.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Status Update Form */}
        {availableTransitions[returnRequest.status as keyof typeof availableTransitions]?.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Update Return Status</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Current status: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(returnRequest.status)}`}>{returnRequest.status}</span>
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6 items-end">
                <div className="col-span-1 md:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    New Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={newStatus}
                    onChange={handleStatusChange}
                    className="inline-flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="">Select a new status</option>
                    {availableTransitions[returnRequest.status as keyof typeof availableTransitions].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <Button
                    onClick={handleUpdateStatus}
                    variant="primary"
                    disabled={!newStatus || isUpdatingStatus}
                    className="w-full"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </div>

              {/* Status transition guide */}
              <div className="mt-4 bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status Transition Guide</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center text-sm text-gray-800">
                    <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-full mr-2"></span>
                    <span>REQUESTED → APPROVED or CANCELLED</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-800">
                    <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded-full mr-2"></span>
                    <span>APPROVED → PROCESSED or CANCELLED</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-800">
                    <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded-full mr-2"></span>
                    <span>PROCESSED → REFUND_INITIATED</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-800">
                    <span className="inline-block w-3 h-3 bg-purple-100 border border-purple-300 rounded-full mr-2"></span>
                    <span>REFUND_INITIATED → REFUNDED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Return Items */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Return Items</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Items included in this return request.</p>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returnRequest.returnItems && returnRequest.returnItems.length > 0 ? (
                  returnRequest.returnItems.map((item: any) => {
                    // Find the matching order item to get product name
                    const orderItem = order?.items?.find((oi: any) => oi.id === item.orderItemId);
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {orderItem?.productImageUrl && (
                              <div className="flex-shrink-0 h-10 w-10 mr-4">
                                <img
                                  className="h-10 w-10 rounded-md object-cover"
                                  src={orderItem.productImageUrl}
                                  alt={orderItem?.productName || 'Product image'}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {orderItem?.productName || (item.productName || 'Unknown Product')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {orderItem ? formatPrice(orderItem.price) : (item.productPrice ? formatPrice(item.productPrice) : 'N/A')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(item.refundAmount || 0)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No return items found
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-900">
                    Total Refund Amount:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatPrice(
                      returnRequest.returnItems && returnRequest.returnItems.length > 0
                        ? returnRequest.returnItems.reduce((total: number, item: any) => total + (parseFloat(item.refundAmount) || 0), 0)
                        : (returnRequest.totalRefundAmount || 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 