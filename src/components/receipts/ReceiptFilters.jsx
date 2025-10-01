import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter } from 'lucide-react';

const CATEGORIES = [
  "groceries", "dining", "shopping", "utilities", "healthcare", 
  "transportation", "entertainment", "education", "household", "other"
];

export default function ReceiptFilters({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
      <div className="flex items-center gap-2 text-slate-600">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters:</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <Label className="text-xs text-slate-600">Category</Label>
          <Select 
            value={filters.category} 
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-slate-600">Date Range</Label>
          <Select 
            value={filters.dateRange} 
            onValueChange={(value) => handleFilterChange('dateRange', value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <div>
            <Label className="text-xs text-slate-600">Min Amount</Label>
            <Input
              type="number"
              placeholder="$0"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              className="w-20"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600">Max Amount</Label>
            <Input
              type="number" 
              placeholder="$999"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}