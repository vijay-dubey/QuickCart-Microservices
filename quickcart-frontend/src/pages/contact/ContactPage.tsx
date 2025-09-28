import React from 'react';
import Navbar from '../../components/ui/Navbar';

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 pb-8 px-4 md:px-8 max-w-7xl mx-auto mt-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Contact Us</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <p className="text-gray-600 mb-6">
            We're here to help with any questions you may have about your QuickCart experience. 
            Our customer service team is available 24/7 to assist you.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-xl mb-3">Customer Support</h3>
              <p className="text-gray-600 mb-2">Email: support@quickcart.com</p>
              <p className="text-gray-600 mb-2">Phone: +1 (800) 123-4567</p>
              <p className="text-gray-600">Hours: 24/7</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-xl mb-3">Corporate Office</h3>
              <p className="text-gray-600 mb-2">QuickCart Headquarters</p>
              <p className="text-gray-600 mb-2">123 E-Commerce Street</p>
              <p className="text-gray-600 mb-2">Kolkata, WB 700059</p>
              <p className="text-gray-600">India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 