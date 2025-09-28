import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import { UserResponse } from '../../services/authService';
import { PencilIcon, KeyIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Gender } from '../../services/userService';
import { format } from 'date-fns';
import authService from '../../services/authService';
import userService from '../../services/userService';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user: authUser, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    dob: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setFormData({
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        phone: authUser.phone || '',
        gender: authUser.gender || '',
        dob: authUser.dob ? authUser.dob.substring(0, 10) : '' // Format as YYYY-MM-DD for input
      });
      setIsLoading(false);
    }
  }, [authUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setUpdateError(null);
    setUpdateSuccess(false);

    // Reset form data when canceling edit
    if (isEditing && user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        gender: user.gender || '',
        dob: user.dob ? user.dob.substring(0, 10) : ''
      });
    }
  };

  const handlePasswordToggle = () => {
    setIsChangingPassword(!isChangingPassword);
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not provided';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(false);

    if (!user) return;

    // Log the current user data for debugging
    console.log('Current user data:', user);
    console.log('Form data to update:', formData);

    try {
      const updatedUser = await updateUser(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        gender: formData.gender as Gender,
        dob: formData.dob
      });

      setUser(updatedUser);
      setUpdateSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setUpdateSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Profile update error:', error);
      // Display more detailed error information if available
      setUpdateError(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    // Password validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Enhanced password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      setPasswordError('Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character');
      return;
    }

    try {
      const response = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Hide the password form after success
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Password change error:', error);
      // Provide a cleaner error message
      if (error.response?.data?.message?.includes('validation failed')) {
        setPasswordError('Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character');
      } else {
        setPasswordError(error.response?.data?.message || 'Failed to change password. Please verify your current password.');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    // Ask for confirmation
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone immediately. Your account will be marked for deletion and fully removed after 30 days.'
    );
    
    if (!confirmed) return;
    
    try {
      await userService.deleteUser(user.email);
      // Logout the user after successful deletion
      logout();
      // Redirect to home page
      navigate('/');
    } catch (error: any) {
      console.error('Account deletion error:', error);
      alert('Failed to delete account. Please try again later.');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex justify-center px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="w-full sm:w-[70%] bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Personal details and account information
              </p>
            </div>
            {!isEditing && !isChangingPassword && (
              <div className="flex space-x-2">
                <button
                  onClick={handleEditToggle}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
                  Edit Profile
                </button>
                <button
                  onClick={handlePasswordToggle}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <KeyIcon className="-ml-0.5 mr-2 h-4 w-4" />
                  Change Password
                </button>
              </div>
            )}
            {isEditing && (
              <button
                onClick={handleEditToggle}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
                Cancel
              </button>
            )}
            {isChangingPassword && (
              <button
                onClick={handlePasswordToggle}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <KeyIcon className="-ml-0.5 mr-2 h-4 w-4" />
                Cancel
              </button>
            )}
          </div>

          {updateSuccess && (
            <div className="mx-4 my-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
              Profile updated successfully!
            </div>
          )}

          {updateError && (
            <div className="mx-4 my-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {updateError}
            </div>
          )}

          {passwordSuccess && (
            <div className="mx-4 my-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
              Password changed successfully!
            </div>
          )}

          {passwordError && (
            <div className="mx-4 my-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {passwordError}
            </div>
          )}

          {isEditing ? (
            <div className="border-t border-gray-200 px-6 py-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address (cannot be changed)
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 bg-gray-400 border border-gray-300 rounded-lg shadow-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      id="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      id="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition calendar-visible"
                    />
                    <style>
                      {`
                      /* Make the calendar button more visible */
                      input[type="date"]::-webkit-calendar-picker-indicator {
                        background-color: rgba(0, 0, 0, 0.1);
                        padding: 5px;
                        cursor: pointer;
                        border-radius: 3px;
                      }
                      
                      /* Apply these styles to make the calendar more user-friendly */
                      @media screen and (-webkit-min-device-pixel-ratio:0) {
                        input[type="date"]::-webkit-inner-spin-button,
                        input[type="date"]::-webkit-clear-button {
                          height: 20px;
                          width: 20px;
                        }
                      }
                      
                      /* Make the calendar visible and improve scrolling */
                      .calendar-visible::-webkit-calendar-picker-indicator {
                        opacity: 1;
                        display: block;
                        width: 24px;
                        height: 24px;
                        margin-left: 8px;
                      }
                      `}
                    </style>
                  </div>
                </div>

                <div className="flex justify-end pt-6 space-x-3">
                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="px-5 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-white bg-primary hover:bg-primary-dark transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          ) : isChangingPassword ? (
            <div className="border-t border-gray-200 px-6 py-8">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="max-w-md mx-auto">
                  <div className="mb-4">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        required
                        minLength={8}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition pr-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 space-x-3">
                  <button
                    type="button"
                    onClick={handlePasswordToggle}
                    className="px-5 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-white bg-primary hover:bg-primary-dark transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border-t border-gray-200 divide-y divide-gray-200">
              <dl className="divide-y divide-gray-200">
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                    {user?.firstName} {user?.lastName}
                  </dd>
                </div>
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                    {user?.email}
                  </dd>
                </div>
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                    {user?.phone}
                  </dd>
                </div>
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                    {user?.gender ? 
                      user.gender === 'PREFER_NOT_TO_SAY' ? 'Prefer not to say' : 
                      user.gender.charAt(0) + user.gender.slice(1).toLowerCase() : 
                      'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                    {user?.dob ? formatDate(user.dob) : 'Not provided'}
                  </dd>
                </div>
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                    {user?.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                  </dd>
                </div>
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                    {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                  </dd>
                </div>
              </dl>
              
              <div className="px-4 py-5">
                <div className="flex justify-center">
                  <button
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Delete Account
                  </button>
                </div>
                <p className="mt-2 text-xs text-center text-gray-500">
                  Deleting your account will mark it for deletion. Your data will be fully removed after 30 days.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 