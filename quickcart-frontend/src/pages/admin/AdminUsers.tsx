import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import userService, { UserResponse } from '../../services/userService';
import { TrashIcon, ArrowLeftIcon, MagnifyingGlassIcon, UserGroupIcon, PencilIcon, EyeIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(true);

  useEffect(() => {
    // Redirect if user is not an admin
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const data = await userService.getAllUsersIncludingDeleted();
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setIsDeleting(email);
    try {
      await userService.deleteUser(email);
      // Update the user status in the list to show as deleted
      setUsers(users.map(u => u.email === email ? { ...u, deleted: true } : u));
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewUser = (email: string) => {
    navigate(`/admin/users/${email}/view`);
  };

  const handleViewUserOrders = (email: string) => {
    navigate(`/admin/users/${email}/orders`);
  };

  const handleEditUser = (email: string) => {
    navigate(`/admin/users/${email}/edit`);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter an email to search');
      return;
    }

    setIsLoading(true);
    setError(null);  // Clear any previous error

    try {
      const userData = await userService.getUserByEmail(searchTerm);
      setUsers([userData]);
    } catch (err) {
      console.error('Failed to find user:', err);
      setError('User not found with that email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSearch = async () => {
    if (searchTerm) {
      setSearchTerm('');
      setIsLoading(true);
      try {
        const data = await userService.getAllUsersIncludingDeleted();
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Filter users based on showDeleted state
  const displayUsers = showDeleted ? users : users.filter(user => !user.deleted);

  // If still checking auth, show loading
  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <UserGroupIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
              <p className="text-sm text-gray-500">Admin control panel for user accounts</p>
            </div>
          </div>

          {/* Right: Search Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Search by email"
                className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md py-2 px-4 shadow-sm pr-10"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="px-3 py-1.5 text-sm">
              Search
            </Button>
            {searchTerm && (
              <Button onClick={handleResetSearch} variant="outline" disabled={isLoading} className="px-3 py-1.5 text-sm">
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter controls */}
        <div className="mb-4 flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={() => setShowDeleted(!showDeleted)}
              className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show deleted users</span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayUsers.map((userData) => (
                  <tr key={userData.email} className={userData.deleted ? "bg-red-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {userData.firstName} {userData.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{userData.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{userData.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${userData.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {userData.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userData.deleted ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Deleted
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewUser(userData.email)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded-lg transition mr-2 inline-flex items-center"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" /> View
                      </button>
                      <button
                        onClick={() => handleEditUser(userData.email)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-3 rounded-lg transition mr-2"
                      >
                        <PencilIcon className="h-3 w-3 inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleViewUserOrders(userData.email)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded-lg transition"
                      >
                        View Orders
                      </button>
                      {!userData.deleted ? (
                        <button
                          onClick={() => handleDeleteUser(userData.email)}
                          className="ml-2 inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition"
                          disabled={isDeleting === userData.email || userData.email === user?.email}
                        >
                          {isDeleting === userData.email ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                          ) : (
                            <>
                              <TrashIcon className="h-3 w-3 mr-1" /> Delete
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2 py-1 text-sm font-medium text-gray-500 border border-gray-300 rounded-lg bg-gray-100">
                          <XCircleIcon className="h-3 w-3 mr-1" /> Inactive
                        </span>
                      )}
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