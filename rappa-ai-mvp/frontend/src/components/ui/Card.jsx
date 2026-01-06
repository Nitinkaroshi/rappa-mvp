function Card({ children, className = '', hover = true }) {
  const hoverEffect = hover ? 'hover:shadow-xl hover:-translate-y-1' : '';

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-300 ${hoverEffect} ${className}`}>
      {children}
    </div>
  );
}

export default Card;
