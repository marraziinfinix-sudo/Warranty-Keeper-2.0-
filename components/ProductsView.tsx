
import React, { useMemo } from 'react';
import { Warranty, Product } from '../types';
import { formatDate, calculateExpiryDate } from '../utils/warrantyUtils';

interface ProductsViewProps {
    warranties: Warranty[];
    searchTerm: string;
}

interface FlattenedProduct extends Product {
    warrantyId: string;
    customerName: string;
    expiryDate: Date | null;
}

const ProductsView: React.FC<ProductsViewProps> = ({ warranties, searchTerm }) => {

    const products = useMemo(() => {
        return warranties.flatMap(warranty => 
            warranty.products.map(product => ({
                ...product,
                warrantyId: warranty.id,
                customerName: warranty.customerName,
                expiryDate: calculateExpiryDate(product.purchaseDate, product.productWarrantyPeriod, product.productWarrantyUnit)
            }))
        ).sort((a, b) => {
            // Sort by expiry date ascending (earliest expiry first)
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return a.expiryDate.getTime() - b.expiryDate.getTime();
        });
    }, [warranties]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lowerTerm = searchTerm.toLowerCase();
        return products.filter(p => 
            p.productName.toLowerCase().includes(lowerTerm) || 
            p.serialNumber.toLowerCase().includes(lowerTerm) ||
            p.customerName.toLowerCase().includes(lowerTerm)
        );
    }, [products, searchTerm]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getExpiryStatus = (date: Date | null) => {
        if (!date) return { text: 'N/A', color: 'text-gray-500' };
        
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Expired', color: 'text-red-600 font-medium' };
        if (diffDays <= 30) return { text: 'Expiring Soon', color: 'text-yellow-600 font-medium' };
        return { text: 'Active', color: 'text-green-600' };
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                                    No products found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product, index) => {
                                const status = getExpiryStatus(product.expiryDate);
                                return (
                                    <tr key={`${product.warrantyId}-${index}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit">{product.serialNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{product.customerName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{formatDate(product.purchaseDate)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{formatDate(product.expiryDate)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
             <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default ProductsView;
