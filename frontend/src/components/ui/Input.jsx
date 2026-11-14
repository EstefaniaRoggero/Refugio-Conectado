import React, { useId } from 'react';

const Input = React.forwardRef(({ label, error, className = '', id, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-brown-dark mb-1.5">{label}</label>}
      <input id={inputId} ref={ref} className={`input-field ${error ? 'border-red-400 focus:ring-red-300' : ''}`} {...props} />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
