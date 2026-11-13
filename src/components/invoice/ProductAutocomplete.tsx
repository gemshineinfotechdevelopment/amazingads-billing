import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import type { Product } from '../../types/product';
import { formatCurrency } from '../../utils/formatters';

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectProduct: (product: Product) => void;
  products: Product[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  value,
  onChange,
  onSelectProduct,
  products,
  placeholder = 'Type calendar name (e.g. Royal Gold, Desk...)',
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter products based on typed query
  const query = value.trim().toLowerCase();
  const filteredProducts = React.useMemo(() => {
    if (!query) return [];
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(query);
      const categoryMatch = p.category?.toLowerCase().includes(query);
      const sizeMatch = p.size?.toLowerCase().includes(query);
      const skuMatch = String(p.sku || '').toLowerCase().includes(query);
      return nameMatch || categoryMatch || sizeMatch || skuMatch;
    });
  }, [products, query]);

  // Open dropdown when query has letters and matches exist
  useEffect(() => {
    if (query.length > 0) {
      setIsOpen(true);
      setHighlightedIndex(0);
    } else {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, [query]);

  // Handle clicking outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredProducts.length === 0) {
      if (e.key === 'ArrowDown' && query.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredProducts.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
        e.preventDefault();
        handleSelect(filteredProducts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`}>
      <input
        ref={inputRef}
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (query.length > 0 && filteredProducts.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={className}
      />

      {/* Suggestion Dropdown List */}
      {isOpen && query.length > 0 && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] sm:min-w-[340px] max-w-[480px] z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#2563EB]" />
              <span>Matching Calendars ({filteredProducts.length})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Press Enter or Click</span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p, idx) => {
                const isSelected = idx === highlightedIndex;
                return (
                  <button
                    key={p._id || idx}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 text-blue-950'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs leading-tight text-slate-900 truncate">
                          {p.name}
                        </span>
                        {p.category && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100/70 text-[#2563EB] shrink-0">
                            {p.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                        {p.size && <span>Size: {p.size}</span>}
                        {p.sku && <span>• SKU: #{p.sku}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs sm:text-sm text-[#142B4A] block">
                        {formatCurrency(p.sellingPrice)}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">
                        Rate
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-center text-xs text-slate-500">
                <p className="font-medium text-slate-600">No matching calendars found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  You can still enter a custom item description
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
