/**
 * Card Component
 * A reusable card component with consistent styling matching the design system
 * 
 * Usage:
 * <Card>
 *   <Card.Header>Title</Card.Header>
 *   <Card.Body>Content</Card.Body>
 *   <Card.Footer>Footer</Card.Footer>
 * </Card>
 */

export default function Card({ children, className = '', hover = true, ...props }) {
  const hoverClass = hover ? 'hover:shadow-card-hover' : '';

  return (
    <div
      className={`bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden transition-shadow duration-200 ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
Card.Header = function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Body
Card.Body = function CardBody({ children, className = '', ...props }) {
  return (
    <div
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Footer
Card.Footer = function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-100 bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
