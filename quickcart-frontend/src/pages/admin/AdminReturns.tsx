import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import returnService, { ReturnRequest, ReturnStatus } from '../../services/returnService';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

export default function AdminReturns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'ALL'>('ALL');
  const [userEmail, setUserEmail] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
  const [selectedReturnStatus, setSelectedReturnStatus] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    // Redirect if user is not an admin
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    const fetchReturns = async () => {
      setIsLoading(true);
      try {
        const data = await returnService.getAllReturns();
        // Sort returns by date, most recent first
        data.sort((a: ReturnRequest, b: ReturnRequest) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReturns(data);
      } catch (err) {
        console.error('Failed to fetch returns:', err);
        setError('Failed to load return requests. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReturns();
  }, [user, navigate]);

  const handleSearchByEmail = async () => {
    if (!searchText.trim()) {
      setError('Please enter an email to search');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await returnService.getUserReturnsByEmail(searchText);
      if (data.length === 0) {
        setError(`No returns found for ${searchText}`);
      }
      // Sort returns by date, most recent first
      data.sort((a: ReturnRequest, b: ReturnRequest) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReturns(data);
      setUserEmail(searchText);
    } catch (err) {
      console.error('Failed to fetch returns by email:', err);
      setError(`Failed to load return requests for ${searchText}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSearch = async () => {
    setIsLoading(true);
    setError(null);
    setSearchText('');
    setUserEmail('');

    try {
      const data = await returnService.getAllReturns();
      // Sort returns by date, most recent first
      data.sort((a: ReturnRequest, b: ReturnRequest) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReturns(data);
    } catch (err) {
      console.error('Failed to fetch all returns:', err);
      setError('Failed to load return requests. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
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

  const getStatusBadgeClass = (status: ReturnStatus) => {
    switch (status) {
      case ReturnStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ReturnStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case ReturnStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case ReturnStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewReturnDetails = (returnId: number) => {
    navigate(`/admin/returns/${returnId}`);
  };

  const handleApproveReturn = async (returnId: number) => {
    if (!window.confirm('Are you sure you want to approve this return request?')) {
      return;
    }

    try {
      await returnService.updateReturnStatus(returnId, ReturnStatus.APPROVED);
      // Refresh the list
      setReturns(prevReturns =>
        prevReturns.map(returnItem =>
          returnItem.id === returnId
            ? { ...returnItem, status: ReturnStatus.APPROVED }
            : returnItem
        )
      );
    } catch (err) {
      console.error('Failed to approve return:', err);
      setError('Failed to approve return request. Please try again.');
    }
  };

  const handleRejectReturn = async (returnId: number) => {
    if (!window.confirm('Are you sure you want to reject this return request?')) {
      return;
    }

    try {
      await returnService.updateReturnStatus(returnId, ReturnStatus.REJECTED);
      // Refresh the list
      setReturns(prevReturns =>
        prevReturns.map(returnItem =>
          returnItem.id === returnId
            ? { ...returnItem, status: ReturnStatus.REJECTED }
            : returnItem
        )
      );
    } catch (err) {
      console.error('Failed to reject return:', err);
      setError('Failed to reject return request. Please try again.');
    }
  };

  const handleUpdateStatusClick = (returnId: number, status: string) => {
    setSelectedReturnId(returnId);
    setSelectedReturnStatus(status);
    setNewStatus('');
    setIsUpdateModalOpen(true);
  };

  const closeUpdateStatusModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedReturnId(null);
    setSelectedReturnStatus('');
    setNewStatus('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedReturnId || !newStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await returnService.updateReturnStatus(selectedReturnId, newStatus);
      
      // Update the local state
      setReturns(prevReturns =>
        prevReturns.map(returnItem =>
          returnItem.id === selectedReturnId
            ? { ...returnItem, status: newStatus as ReturnStatus }
            : returnItem
        )
      );
      
      // Close the modal
      closeUpdateStatusModal();
    } catch (err) {
      console.error('Failed to update return status:', err);
      setError('Failed to update return status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getAvailableTransitions = (status: ReturnStatus): string[] => {
    switch (status) {
      case ReturnStatus.REQUESTED:
        return [ReturnStatus.APPROVED, ReturnStatus.CANCELLED];
      case ReturnStatus.APPROVED:
        return [ReturnStatus.PROCESSED, ReturnStatus.CANCELLED];
      case ReturnStatus.PROCESSED:
        return [ReturnStatus.REFUND_INITIATED];
      case ReturnStatus.REFUND_INITIATED:
        return [ReturnStatus.REFUNDED];
      default:
        return [];
    }
  };

  const filteredReturns = statusFilter === 'ALL'
    ? returns
    : returns.filter(returnItem => returnItem.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Left: Back Button */}
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center bg-white text-primary border border-primary px-4 py-2 rounded-lg shadow hover:bg-primary hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
          </div>

          {/* Center: Page Title */}
          <div className="flex items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manage Return Requests</h1>
              <p className="text-sm text-gray-500">Admin control panel for handling returns</p>
            </div>
          </div>

          {/* Right: Filters and Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchByEmail();
                  }
                }}
                placeholder="Search by customer email"
                className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md py-2 px-4 shadow-sm"
              />
              <Button onClick={handleSearchByEmail} disabled={isLoading} className="px-3 py-1.5 text-sm">
                Search
              </Button>
              {userEmail && (
                <Button onClick={handleResetSearch} variant="outline" disabled={isLoading} className="px-3 py-1.5 text-sm">
                  Clear
                </Button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReturnStatus | 'ALL')}
              className="inline-flex justify-between items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="ALL">All Statuses</option>
              <option value={ReturnStatus.PENDING}>Pending</option>
              <option value={ReturnStatus.APPROVED}>Approved</option>
              <option value={ReturnStatus.REJECTED}>Rejected</option>
              <option value={ReturnStatus.COMPLETED}>Completed</option>
            </select>
          </div>
        </div>

        {userEmail && (
          <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md mb-6 flex items-center justify-between">
            <span>Showing returns for customer: <strong>{userEmail}</strong></span>
            <button
              onClick={handleResetSearch}
              className="text-blue-700 font-medium hover:underline"
            >
              Show All Returns
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">No return requests found</h2>
            <p className="text-gray-600 mb-6">There are no return requests matching your filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.map((returnItem) => (
                  <tr key={returnItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">#{String(returnItem.id).padStart(6, '0')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <Link to={`/admin/orders/${returnItem.orderId}`} className="text-primary hover:underline">
                          #{String(returnItem.orderId).padStart(6, '0')}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{returnItem.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(returnItem.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(returnItem.status as ReturnStatus)}`}>
                        {returnItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewReturnDetails(returnItem.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Details
                      </button>
                      {returnItem.status === ReturnStatus.PENDING && (
                        <>
                          <button
                            onClick={() => handleApproveReturn(returnItem.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectReturn(returnItem.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {returnItem.status !== ReturnStatus.PENDING && (
                        <button
                          onClick={() => handleUpdateStatusClick(returnItem.id, returnItem.status)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Update Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isUpdateModalOpen && selectedReturnId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Update Return Status
              </h3>
              <button 
                onClick={closeUpdateStatusModal} 
                className="text-gray-400 hover:text-gray-500"
                type="button"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Current Status
              </label>
              <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedReturnStatus as ReturnStatus)}`}>
                {selectedReturnStatus}
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-1">
                New Status
              </label>
              <select
                id="newStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="inline-flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="">Select a new status</option>
                {getAvailableTransitions(selectedReturnStatus as ReturnStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            {/* Status transition guide */}
            <div className="mb-6 bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status Transition Guide</h4>
              <div className="grid grid-cols-1 gap-2">
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
            
            <div className="flex justify-end gap-2">
              <Button
                onClick={closeUpdateStatusModal}
                variant="outline"
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                variant="primary"
                disabled={!newStatus || isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 