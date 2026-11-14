export default function Button({ children, variant = 'primary', className = '', loading, disabled, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  };

  return (
    <button
      className={`${variants[variant]} ${className} transition-transform duration-150 hover:enabled:scale-[1.02] active:enabled:scale-[0.98] ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
}
