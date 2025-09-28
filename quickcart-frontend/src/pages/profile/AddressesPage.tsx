import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import addressService, { Address, AddressRequest } from '../../services/addressService';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  HomeIcon, 
  MapPinIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import InputField from '../../components/ui/InputField';

interface AddressFormData extends AddressRequest {}

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formProcessing, setFormProcessing] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<AddressFormData>();
  
  const isSameAsUser = watch('isSameAsUser');

  useEffect(() => {
    if (isSameAsUser && user) {
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      setValue('name', userFullName, { shouldValidate: true });
      setValue('phone', user.phone || '', { shouldValidate: true });
      setValue('email', user.email || '', { shouldValidate: true });
    } else if (isSameAsUser === false) {
      setValue('name', '', { shouldValidate: true });
      setValue('phone', '', { shouldValidate: true });
      setValue('email', '', { shouldValidate: true });
    }
  }, [isSameAsUser, user, setValue]);
  
  const fetchAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching addresses for user:', user?.id);
      const addressData = await addressService.getUserAddresses();
      console.log('Address data retrieved:', addressData);
      setAddresses(addressData || []);
    } catch (err: any) {
      console.error('Failed to fetch addresses:', err);
      setError('Failed to load addresses. Please try again later.');
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);
  
  const handleAddNewAddress = () => {
    setEditingAddress(null);
    reset({
      name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
      phone: user?.phone || '',
      email: user?.email || '',
      addressLine1: '',
      addressLine2: '',
      street: '',
      city: '',
      state: '',
      country: 'India', // Default country
      postalCode: '',
      landmark: '',
      type: 'HOME', // Default type
      isDefault: addresses.length === 0, // Set as default if no addresses exist
      isSameAsUser: true
    });
    setShowAddressForm(true);
  };
  
  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    reset({
      name: address.recipientName || address.name || '',
      phone: address.recipientPhone || address.phone || '',
      email: address.email || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country || 'India',
      postalCode: address.postalCode || address.zipCode || '',
      landmark: address.landmark || '',
      type: address.type || 'HOME',
      isDefault: address.defaultAddress,
      isSameAsUser: address.isSameAsUser || false
    });
    setShowAddressForm(true);
  };
  
  const handleDeleteAddress = async (addressId: number) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      setIsLoading(true);
      try {
        await addressService.deleteAddress(addressId);
        setAddresses(addresses.filter(address => address.id !== addressId));
      } catch (err: any) {
        console.error('Failed to delete address:', err);
        setError('Failed to delete address. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleSetDefaultAddress = async (addressId: number) => {
    setIsLoading(true);
    try {
      await addressService.setDefaultAddress(addressId);
      await fetchAddresses(); // Refresh addresses to update default status
    } catch (err: any) {
      console.error('Failed to set default address:', err);
      setError('Failed to set default address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (data: AddressFormData) => {
    setFormProcessing(true);
    setError(null);
    
    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, data);
      } else {
        await addressService.createAddress(data);
      }
      await fetchAddresses();
      setShowAddressForm(false);
    } catch (err: any) {
      console.error('Failed to save address:', err);
      setError('Failed to save address. Please try again.');
    } finally {
      setFormProcessing(false);
    }
  };
  
  // Helper function to render a generic address icon
  const renderAddressIcon = () => {
    return <HomeIcon className="h-5 w-5 text-primary" />;
  };

  const retryFetchAddresses = () => {
    fetchAddresses();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
          <Button onClick={handleAddNewAddress} variant="secondary">
            <PlusIcon className="h-5 w-5 mr-1" />
            Add New Address
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
            <button
              onClick={retryFetchAddresses}
              className="ml-4 text-sm font-medium underline"
            >
              Retry
            </button>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {addresses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="flex justify-center mb-4">
                  <MapPinIcon className="h-16 w-16 text-gray-400" />
                </div>
                <h2 className="text-2xl font-medium text-gray-900 mb-2">No addresses found</h2>
                <p className="text-gray-600 mb-6">Add your first address to make checkout easier.</p>
                <Button onClick={handleAddNewAddress}>
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Address
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addresses.map((address) => (
                  <div key={address.id} className="bg-white rounded-lg shadow-md p-6 relative">
                    {address.defaultAddress && (
                      <div className="absolute top-3 right-3 text-green-600 flex items-center text-sm font-medium">
                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                        Default
                      </div>
                    )}
                    
                    <div className="flex items-center mb-4">
                      {renderAddressIcon()}
                      <h3 className="text-lg font-medium text-gray-900 ml-2">{address.recipientName || address.name || 'Address'}</h3>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1 mb-6">
                      <p className="font-medium">Recipient: {address.recipientName || address.name || 'Not provided'}</p>
                      <p>{address.street}</p>
                      <p>{address.city}, {address.state} {address.postalCode || address.zipCode}</p>
                      <p className="font-medium mt-2">Phone: {address.recipientPhone || address.phone || 'Not provided'}</p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleEditAddress(address)}
                        variant="outline"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      {address.defaultAddress ? (
                        <Button
                          variant="outline"
                          disabled
                          className="text-green-600 border-green-600"
                        >
                          Default Address
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSetDefaultAddress(address.id)}
                          variant="outline"
                        >
                          Set as Default
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => handleDeleteAddress(address.id)}
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {showAddressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center border-b px-6 py-4 flex-shrink-0">
                <h2 className="text-xl font-medium text-gray-900">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h2>
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 gap-4">
                  {/* Recipient Information */}
                  <div className="border-b pb-4 mb-2">
                    <h3 className="text-base font-medium text-gray-900 mb-3">Recipient Information</h3>
                    
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="isSameAsUser"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        {...register('isSameAsUser')}
                      />
                      <label htmlFor="isSameAsUser" className="ml-2 block text-gray-700">
                        I am the recipient
                      </label>
                    </div>
                    
                    <InputField
                      label="Full Name"
                      {...register('name', { required: 'Name is required' })}
                      error={errors.name?.message}
                      placeholder="Enter recipient's full name"
                    />
                    
                    <InputField
                      label="Phone Number"
                      {...register('phone', { required: 'Phone number is required' })}
                      error={errors.phone?.message}
                      placeholder="Enter recipient's phone number"
                    />
                    
                    <InputField
                      label="Email"
                      {...register('email')}
                      error={errors.email?.message}
                      placeholder="Enter recipient's email (optional)"
                    />
                  </div>
                  
                  {/* Address Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="HOME"
                          {...register('type', { required: 'Address type is required' })}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="ml-2 text-gray-700">Home</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="OFFICE"
                          {...register('type', { required: 'Address type is required' })}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="ml-2 text-gray-700">Office</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="OTHER"
                          {...register('type', { required: 'Address type is required' })}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="ml-2 text-gray-700">Other</span>
                      </label>
                    </div>
                    {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
                  </div>
                  
                  {/* Address Details */}
                  <div className="border-t border-b py-4 mb-2">
                    <h3 className="text-base font-medium text-gray-900 mb-3">Address Details</h3>
                    
                    <InputField
                      label="Address Line 1"
                      {...register('addressLine1', { required: 'Address line 1 is required' })}
                      error={errors.addressLine1?.message}
                      placeholder="Flat, House no., Building, Apartment"
                    />
                    
                    <InputField
                      label="Address Line 2"
                      {...register('addressLine2')}
                      error={errors.addressLine2?.message}
                      placeholder="Area, Colony, Street (Optional)"
                    />
                    
                    <InputField
                      label="Street"
                      {...register('street', { required: 'Street is required' })}
                      error={errors.street?.message}
                      placeholder="Enter street name"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="City"
                        {...register('city', { required: 'City is required' })}
                        error={errors.city?.message}
                        placeholder="Enter city"
                      />
                      
                      <InputField
                        label="State"
                        {...register('state', { required: 'State is required' })}
                        error={errors.state?.message}
                        placeholder="Enter state"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Postal Code"
                        {...register('postalCode', { required: 'Postal code is required' })}
                        error={errors.postalCode?.message}
                        placeholder="Enter postal code"
                      />
                      
                      <InputField
                        label="Country"
                        {...register('country', { required: 'Country is required' })}
                        error={errors.country?.message}
                        placeholder="Enter country"
                      />
                    </div>
                    
                    <InputField
                      label="Landmark"
                      {...register('landmark')}
                      error={errors.landmark?.message}
                      placeholder="Landmark (Optional)"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      {...register('isDefault')}
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-gray-700">
                      Set as default address
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={formProcessing}
                  >
                    {formProcessing ? 'Saving...' : 'Save Address'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 