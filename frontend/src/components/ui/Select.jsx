  import React from 'react';

const Select = React.forwardRef(({ label, error, options = [], className = '', ...props }, ref) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-brown-dark mb-1.5">{label}</label>}
    <select ref={ref} className={`input-field ${error ? 'border-red-400' : ''}`} {...props}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
));

Select.displayName = 'Select';
export default Select;