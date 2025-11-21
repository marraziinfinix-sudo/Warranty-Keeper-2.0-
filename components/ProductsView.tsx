
import React, { useState, useMemo } from 'react';
import { SavedProduct } from '../types';
import { PlusIcon, EditIcon, TrashIcon, CubeIcon } from './icons/Icons';
import { formatWarrantyText } from '../utils/warrantyUtils';

interface ProductsViewProps {
    savedProducts: SavedProduct[];
    searchTerm: string;
    onAddProduct: (product: SavedProduct) => Promise<void>;
    onUpdateProduct: (product: SavedProduct) => Promise<void>;
    onDeleteProduct: (id: string) => Promise<void>;
}

const ProductsView: React.FC<ProductsViewProps> = ({ 
    savedProducts, 
    searchTerm,
    onAddProduct,
    onUpdateProduct,
    onDeleteProduct
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<SavedProduct | null>(null);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return savedProducts;
        const lowerTerm = searchTerm.toLowerCase();
        return savedProducts.filter(p => 
            p.name.toLowerCase().includes(lowerTerm)
        );
    }, [savedProducts, searchTerm]);

    const handleEdit = (product: SavedProduct) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this product from your catalog?")) {
            await onDeleteProduct(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden relative">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">Product Catalog</h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-md text-sm hover:bg-blue-600 transition"
                >
                    <PlusIcon /> Add Product
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Warranty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500 text-sm">
                                     {savedProducts.length === 0 
                                        ? "No saved products in catalog. Add one to speed up warranty entry." 
                                        : "No products found matching your search."}
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-brand-primary">
                                                <CubeIcon />
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {formatWarrantyText(product.defaultWarrantyPeriod, product.defaultWarrantyUnit)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(product)} className="text-gray-500 hover:text-brand-primary">
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="text-gray-500 hover:text-brand-danger">
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

             {isModalOpen && (
                <ProductModal 
                    product={editingProduct} 
                    onClose={handleCloseModal} 
                    onSave={async (p) => {
                        if (editingProduct) {
                            await onUpdateProduct(p);
                        } else {
                            await onAddProduct(p);
                        }
                    }}
                />
            )}
        </div>
    );
};

interface ProductModalProps {
    product: SavedProduct | null;
    onClose: () => void;
    onSave: (product: SavedProduct) => Promise<void>;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave }) => {
    const [formData, setFormData] = useState<SavedProduct>(product || {
        id: new Date().toISOString(),
        name: '',
        defaultWarrantyPeriod: 12,
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
                            {product ? 'Edit Product' : 'Add New Product'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g. Air Conditioner Model X" />
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

export default ProductsView;
