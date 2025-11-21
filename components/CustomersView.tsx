
import React, { useState, useMemo } from 'react';
import { Warranty, Customer } from '../types';
import { EmailIcon, LocationPinIcon, PlusIcon, EditIcon, TrashIcon, BuildingIcon } from './icons/Icons';

interface CustomersViewProps {
    warranties: Warranty[];
    customers: Customer[];
    searchTerm: string;
    onViewCustomerWarranties: (customerName: string) => void;
    onAddCustomer: (customer: Customer) => Promise<void>;
    onUpdateCustomer: (customer: Customer) => Promise<void>;
    onDeleteCustomer: (id: string) => Promise<void>;
}

const malaysianStates = [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
    "Pulau Pinang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu",
    "W.P. Kuala Lumpur", "W.P. Labuan", "W.P. Putrajaya"
];

const CustomersView: React.FC<CustomersViewProps> = ({ 
    warranties, 
    customers, 
    searchTerm, 
    onViewCustomerWarranties,
    onAddCustomer,
    onUpdateCustomer,
    onDeleteCustomer
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Calculate warranty counts for each saved customer based on name/phone match
    const customerWarrantyCounts = useMemo(() => {
        const counts: {[key: string]: number} = {};
        warranties.forEach(w => {
            // Simple matching strategy: Name AND (Phone match OR Email match)
            // Since saved customers might be used as a master list, let's just match on exact Name for simplicity in display
            const normalizedName = w.customerName.toLowerCase();
            counts[normalizedName] = (counts[normalizedName] || 0) + 1;
        });
        return counts;
    }, [warranties]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        const lowerTerm = searchTerm.toLowerCase();
        return customers.filter(c => 
            c.name.toLowerCase().includes(lowerTerm) || 
            c.phone.includes(lowerTerm) ||
            (c.email || '').toLowerCase().includes(lowerTerm)
        );
    }, [customers, searchTerm]);

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this customer?")) {
            await onDeleteCustomer(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden relative">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">Customer Management</h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-md text-sm hover:bg-blue-600 transition"
                >
                    <PlusIcon /> <span className="hidden sm:inline">Add Customer</span><span className="sm:hidden">Add</span>
                </button>
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Warranties</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                                    {customers.length === 0 
                                        ? "No saved customers yet. Add one to get started." 
                                        : "No customers found matching your search."}
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 capitalize">
                                            <BuildingIcon /> {customer.buildingType === 'others' ? customer.otherBuildingType : customer.buildingType}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{customer.phone}</div>
                                        {customer.email && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <EmailIcon /> {customer.email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 flex flex-col">
                                            <span className="flex items-center gap-1"><LocationPinIcon /> {customer.district}, {customer.state}</span>
                                            <span className="text-xs pl-6">{customer.postcode}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {customerWarrantyCounts[customer.name.toLowerCase()] ? (
                                            <button 
                                                onClick={() => onViewCustomerWarranties(customer.name)}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                                            >
                                                {customerWarrantyCounts[customer.name.toLowerCase()]} Records
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400">0 Records</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(customer)} className="text-gray-500 hover:text-brand-primary">
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => handleDelete(customer.id)} className="text-gray-500 hover:text-brand-danger">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View - List of Cards */}
            <div className="md:hidden">
                {filteredCustomers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                         {customers.length === 0 
                            ? "No saved customers yet. Add one to get started." 
                            : "No customers found matching your search."}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredCustomers.map((customer) => (
                            <li key={customer.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{customer.name}</h3>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 capitalize">
                                            <BuildingIcon /> {customer.buildingType === 'others' ? customer.otherBuildingType : customer.buildingType}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                         <button onClick={() => handleEdit(customer)} className="p-2 text-gray-500 hover:text-brand-primary rounded-full hover:bg-gray-100"><EditIcon /></button>
                                         <button onClick={() => handleDelete(customer.id)} className="p-2 text-gray-500 hover:text-brand-danger rounded-full hover:bg-gray-100"><TrashIcon /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                                    <div>
                                         <div className="text-gray-900 font-medium">{customer.phone}</div>
                                         {customer.email && <div className="text-xs flex items-center gap-1 mt-0.5 text-gray-500"><EmailIcon /> {customer.email}</div>}
                                    </div>
                                    <div className="flex items-start gap-1 bg-gray-50 p-2 rounded">
                                        <div className="mt-0.5 text-gray-400"><LocationPinIcon /></div>
                                        <div className="text-xs">
                                            <p className="font-medium text-gray-700">{customer.district}, {customer.state}</p>
                                            <p className="text-gray-400">{customer.postcode}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end items-center pt-2 border-t border-gray-100">
                                     {customerWarrantyCounts[customer.name.toLowerCase()] ? (
                                        <button 
                                            onClick={() => onViewCustomerWarranties(customer.name)}
                                            className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-center"
                                        >
                                            View {customerWarrantyCounts[customer.name.toLowerCase()]} Warranties
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic w-full text-center py-1">No warranties recorded</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {isModalOpen && (
                <CustomerModal 
                    customer={editingCustomer} 
                    onClose={handleCloseModal} 
                    onSave={async (c) => {
                        if (editingCustomer) {
                            await onUpdateCustomer(c);
                        } else {
                            await onAddCustomer(c);
                        }
                    }}
                />
            )}
        </div>
    );
};

interface CustomerModalProps {
    customer: Customer | null;
    onClose: () => void;
    onSave: (customer: Customer) => Promise<void>;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState<Customer>(customer || {
        id: new Date().toISOString(),
        name: '',
        phone: '',
        email: '',
        state: '',
        district: '',
        postcode: '',
        buildingType: 'home',
        otherBuildingType: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            {customer ? 'Edit Customer' : 'Add New Customer'}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">State</label>
                                <select name="state" required value={formData.state} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm">
                                    <option value="">Select State</option>
                                    {malaysianStates.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">District</label>
                                    <input type="text" name="district" required value={formData.district} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Postcode</label>
                                    <input type="text" name="postcode" required value={formData.postcode} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Building Type</label>
                                <select name="buildingType" value={formData.buildingType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm">
                                    <option value="home">Home</option>
                                    <option value="office">Office</option>
                                    <option value="others">Others</option>
                                </select>
                            </div>
                            {formData.buildingType === 'others' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Specify Type</label>
                                    <input type="text" name="otherBuildingType" required value={formData.otherBuildingType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-blue-600 transition">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomersView;
