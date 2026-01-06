import { Link } from 'react-router-dom';

function Button({ children, variant = 'primary', className = '', onClick, type = 'button', to, href, ...props }) {
  const baseStyles = 'px-6 py-3 rounded-lg font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-accent-yellow text-accent-black hover:bg-accent-yellow-dark shadow-md hover:shadow-lg',
    secondary: 'bg-accent-black text-white hover:bg-accent-black-light',
    outline: 'border-2 border-accent-yellow text-accent-black hover:bg-accent-yellow/10',
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  // If 'to' prop is provided, render as React Router Link
  if (to) {
    return (
      <Link to={to} className={combinedClassName} {...props}>
        {children}
      </Link>
    );
  }

  // If 'href' prop is provided, render as anchor tag
  if (href) {
    return (
      <a href={href} className={combinedClassName} {...props}>
        {children}
      </a>
    );
  }

  // Otherwise, render as button
  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
