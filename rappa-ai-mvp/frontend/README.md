# rappa.ai Frontend

React frontend application with Vite.

## Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with backend API URL

# Start development server
npm run dev
```

## Build for Production
```bash
npm run build
```

## Project Structure

- `src/components/` - Reusable React components
- `src/pages/` - Page components
- `src/services/` - API client and utilities
- `src/context/` - React context providers
# Design System Documentation

## Overview
This design system provides a comprehensive set of design tokens, components, and utilities to create a consistent, modern, and beautiful user interface.

## Color Palette

### Primary Colors (Purple)
- **Primary-50**: `#f5f3ff` - Lightest purple
- **Primary-500**: `#8b5cf6` - Main brand color
- **Primary-700**: `#6d28d9` - Darker purple for hover states

### Secondary Colors (Indigo)
- **Secondary-500**: `#6366f1` - Main secondary color
- **Secondary-700**: `#4338ca` - Darker indigo

### Semantic Colors
- **Success**: `#22c55e` - Green for success states
- **Warning**: `#f59e0b` - Orange for warnings
- **Error**: `#ef4444` - Red for errors
- **Info**: `#3b82f6` - Blue for informational messages

## Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

### Font Sizes
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)

## Spacing Scale
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

## Shadows
- **shadow-sm**: Subtle shadow for small elements
- **shadow-card**: Default card shadow
- **shadow-card-hover**: Enhanced shadow on hover
- **shadow-button**: Button shadow
- **shadow-button-hover**: Button hover shadow

## Border Radius
- **sm**: 0.25rem (4px)
- **md**: 0.5rem (8px)
- **lg**: 0.75rem (12px)
- **xl**: 1rem (16px)
- **2xl**: 1.5rem (24px)

## Components

### Card
```jsx
import { Card } from '@/components/ui';

<Card>
  <Card.Header>
    <h3 className="font-semibold text-gray-900">Card Title</h3>
  </Card.Header>
  <Card.Body>
    <p>Card content goes here</p>
  </Card.Body>
  <Card.Footer>
    <button>Action</button>
  </Card.Footer>
</Card>
```

### Button
```jsx
import { Button } from '@/components/ui';

// Primary button
<Button variant="primary" size="md">
  Click Me
</Button>

// With icon
<Button variant="success" icon={<CheckIcon />}>
  Save
</Button>

// Loading state
<Button variant="primary" loading>
  Processing...
</Button>
```

**Variants**: primary, secondary, success, warning, error, outline, ghost
**Sizes**: sm, md, lg

### Badge
```jsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="warning">Pending</Badge>
```

**Variants**: success, warning, error, info, primary, secondary, neutral
**Sizes**: sm, md, lg

### StatCard
```jsx
import { StatCard } from '@/components/ui';
import { FileText } from 'lucide-react';

<StatCard 
  label="Total Documents" 
  value="1,234" 
  icon={<FileText className="text-primary-600" size={20} />}
  trend="+12%"
  variant="success"
/>
```

## Utility Classes

### Text Gradients
- `.text-gradient-primary` - Purple gradient text
- `.text-gradient-secondary` - Indigo gradient text

### Background Gradients
- `.bg-gradient-primary` - Subtle purple gradient background
- `.bg-gradient-secondary` - Subtle indigo gradient background

### Effects
- `.glass` - Glassmorphism effect
- `.hover-lift` - Lift element on hover
- `.transition-smooth` - Smooth transitions

### Text Truncation
- `.truncate-2` - Truncate to 2 lines
- `.truncate-3` - Truncate to 3 lines

## Animations

### Available Animations
- `animate-slide-in-right` - Slide in from right
- `animate-slide-in-left` - Slide in from left
- `animate-slide-in-up` - Slide in from bottom
- `animate-slide-in-down` - Slide in from top
- `animate-fade-in` - Fade in
- `animate-scale-in` - Scale in
- `animate-bounce-in` - Bounce in
- `animate-pulse` - Pulsing animation
- `animate-shimmer` - Shimmer effect for loading states

## Best Practices

1. **Consistency**: Always use design tokens (colors, spacing, shadows) instead of arbitrary values
2. **Accessibility**: Ensure sufficient color contrast and focus states
3. **Responsive**: Design mobile-first and test on all screen sizes
4. **Performance**: Use CSS transitions instead of JavaScript animations when possible
5. **Semantic HTML**: Use appropriate HTML elements for better accessibility

## Examples

### Modern Card Layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card hover>
    <Card.Header>
      <h3 className="text-lg font-semibold text-gray-900">Feature Title</h3>
    </Card.Header>
    <Card.Body>
      <p className="text-gray-600">Feature description</p>
    </Card.Body>
  </Card>
</div>
```

### Stats Dashboard
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard 
    label="Total Users" 
    value="12,345" 
    variant="primary"
    trend="+15%"
  />
  <StatCard 
    label="Revenue" 
    value="$45,678" 
    variant="success"
    trend="+8%"
  />
</div>
```
