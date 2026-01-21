
import React from 'react';
import { ProductType } from '../types';

interface BadgeProps {
  label: string;
  type?: 'status' | 'product';
  variant?: string;
}

const Badge: React.FC<BadgeProps> = ({ label, type = 'status', variant }) => {
  const getProductStyles = (p: string) => {
    switch (p) {
      case ProductType.MANTEIGA: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case ProductType.LICOR: return 'bg-purple-100 text-purple-700 border-purple-200';
      case ProductType.AMENDOA: return 'bg-orange-100 text-orange-700 border-orange-200';
      case ProductType.TORTA: return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusStyles = (s: string) => {
    if (s === 'Confirmado') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const styles = type === 'product' ? getProductStyles(label) : getStatusStyles(label);

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>
      {label}
    </span>
  );
};

export default Badge;
