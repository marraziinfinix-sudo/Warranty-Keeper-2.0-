
import React, { useState, useMemo } from 'react';
import { SavedService } from '../types';
import { PlusIcon, EditIcon, TrashIcon, WrenchIcon } from './icons/Icons';
import { formatWarrantyText } from '../utils/warrantyUtils';

interface ServicesViewProps {
    savedServices: SavedService[];
    searchTerm: string;
    onAddService: (service: SavedService) => Promise<void>;
    onUpdateService: (service: SavedService) => Promise<void>;
    onDeleteService: (id: string) => Promise<void>;
}

const ServicesView: React.FC<ServicesViewProps> = ({
    savedServices,
    searchTerm,
    onAddService,
    onUpdateService,
    onDeleteService
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<SavedService | null>(null);

    const filteredServices = useMemo(() => {
        if (!searchTerm) return savedServices;
        const lowerTerm = searchTerm.toLowerCase();
        return savedServices.filter(s =>
            s.name.toLowerCase().includes(lowerTerm)
        );
    }, [savedServices, searchTerm]);

    const handleEdit = (service: SavedService) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this service from your catalog?")) {
            await onDeleteService(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden relative">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">Service Catalog</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-md text-sm hover:bg-blue-600 transition"
                >
                    <PlusIcon /> <span className="hidden sm:inline">Add Service</span><span className="sm:hidden">Add</span>
                </button>
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Warranty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredServices.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500 text-sm">
                                    {savedServices.length === 0
                                        ? "No saved services in catalog. Add one to speed up warranty entry."
                                        : "No services found matching your search."}
                                </td>
                            </tr>
                        ) : (
                            filteredServices.map((service) => (
                                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-brand-primary">
                                                <WrenchIcon />
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {formatWarrantyText(service.defaultWarrantyPeriod, service.defaultWarrantyUnit)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(service)} className="text-gray-500 hover:text-brand-primary p-1">
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => handleDelete(service.id)} className="text-gray-500 hover:text-brand-danger p-1">
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
                {filteredServices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        {savedServices.length === 0
                            ? "No saved services. Add one to get started."
                            : "No services found matching your search."}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredServices.map((service) => (
                            <li key={service.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                    <div className="p-2 bg-blue-50 rounded-lg text-brand-primary flex-shrink-0">
                                        <WrenchIcon />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{service.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            Warranty: {formatWarrantyText(service.defaultWarrantyPeriod, service.defaultWarrantyUnit)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                                    <button onClick={() => handleEdit(service)} className="p-2 text-gray-500 hover:text-brand-primary rounded-full hover:bg-gray-100">
                                        <EditIcon />
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="p-2 text-gray-500 hover:text-brand-danger rounded-full hover:bg-gray-100">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {isModalOpen && (
                <ServiceModal
                    service={editingService}
                    onClose={handleCloseModal}
                    onSave={async (s) => {
                        if (editingService) {
                            await onUpdateService(s);
                        } else {
                            await onAddService(s);
                        }
                    }}
                />
            )}
        </div>
    );
};

interface ServiceModalProps {
    service: SavedService | null;
    onClose: () => void;
    onSave: (service: SavedService) => Promise<void>;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose, onSave }) => {
    const [formData, setFormData] = useState<SavedService>(service || {
        id: new Date().toISOString(),
        name: '',
        defaultWarrantyPeriod: 6,
        defaultWarrantyUnit: 'months'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'defaultWarrantyPeriod' ? parseInt(value, 10) || 0 : value
        }));
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
                            {service ? 'Edit Service' : 'Add New Service'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Service Name</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g. Standard AC Installation" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Default Period</label>
                                    <input type="number" name="defaultWarrantyPeriod" min="0" required value={formData.defaultWarrantyPeriod} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Unit</label>
                                    <select name="defaultWarrantyUnit" value={formData.defaultWarrantyUnit} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm">
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            </div>
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

export default ServicesView;
