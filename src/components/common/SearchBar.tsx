import { Input } from '../ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar...', className = '' }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400 text-gray-900 placeholder:text-gray-400"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange('')}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-blue-50 text-gray-500 hover:text-blue-600"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}