
import React, { useMemo } from 'react';
import { Warranty } from '../types';
import { EmailIcon, LocationPinIcon } from './icons/Icons';

interface CustomersViewProps {
    warranties: Warranty[];
    searchTerm: string;
    onViewCustomerWarranties: (customerName: string) => void;
}

interface CustomerSummary {
    id: string; // composite key
    name: string;
    phoneNumber: string;
    email: string;
    location: string;
    totalWarranties: number;
    latestActivity: string;
}

const CustomersView: React.FC<CustomersViewProps> = ({ warranties, searchTerm, onViewCustomerWarranties }) => {

    const customers = useMemo(() => {
        const customerMap = new Map<string, CustomerSummary>();

        warranties.forEach(warranty => {
            // Create a unique key based on name and phone to identify unique customers
            const key = `${warranty.customerName.trim().toLowerCase()}-${warranty.phoneNumber.replace(/\D/g, '')}`;
            
            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    id: key,
                    name: warranty.customerName,
                    phoneNumber: warranty.phoneNumber,
                    email: warranty.email,
                    location: [warranty.district, warranty.state].filter(Boolean).join(', '),
                    totalWarranties: 0,
                    latestActivity: warranty.id // Using ID as a proxy for recency since IDs are ISO dates often
                });
            }

            const customer = customerMap.get(key)!;
            customer.totalWarranties += 1;
            if (warranty.id > customer.latestActivity) {
                customer.latestActivity = warranty.id;
                // Update contact info to latest if it changed
                customer.email = warranty.email || customer.email;
                customer.location = [warranty.district, warranty.state].filter(Boolean).join(', ') || customer.location;
            }
        });

        return Array.from(customerMap.values());
    }, [warranties]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        const lowerTerm = searchTerm.toLowerCase();
        return customers.filter(c => 
            c.name.toLowerCase().includes(lowerTerm) || 
            c.phoneNumber.includes(lowerTerm) ||
            (c.email || '').toLowerCase().includes(lowerTerm) ||
            c.location.toLowerCase().includes(lowerTerm)
        );
    }, [customers, searchTerm]);

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Warranties</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                                    No customers found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{customer.phoneNumber}</div>
                                        {customer.email && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <EmailIcon /> {customer.email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                            <LocationPinIcon /> {customer.location || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {customer.totalWarranties}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => onViewCustomerWarranties(customer.name)}
                                            className="text-brand-primary hover:text-blue-900 hover:underline"
                                        >
                                            View Warranties
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                Showing {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default CustomersView;
