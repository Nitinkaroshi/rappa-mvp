import { Card, Button, Badge, StatCard } from '../components/ui';
import { FileText, Users, TrendingUp, DollarSign, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

/**
 * Design System Demo Page
 * Showcases all the new UI components and design tokens
 */
export default function DesignSystemDemo() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gradient-primary mb-4">
                        Design System Demo
                    </h1>
                    <p className="text-lg text-gray-600">
                        A showcase of our modern, beautiful UI components
                    </p>
                </div>

                {/* Color Palette */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Color Palette</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="space-y-2">
                            <div className="h-20 bg-primary-500 rounded-lg shadow-md"></div>
                            <p className="text-sm font-medium text-gray-700">Primary</p>
                        </div>
                        <div className="space-y-2">
                            <div className="h-20 bg-secondary-500 rounded-lg shadow-md"></div>
                            <p className="text-sm font-medium text-gray-700">Secondary</p>
                        </div>
                        <div className="space-y-2">
                            <div className="h-20 bg-success-500 rounded-lg shadow-md"></div>
                            <p className="text-sm font-medium text-gray-700">Success</p>
                        </div>
                        <div className="space-y-2">
                            <div className="h-20 bg-warning-500 rounded-lg shadow-md"></div>
                            <p className="text-sm font-medium text-gray-700">Warning</p>
                        </div>
                        <div className="space-y-2">
                            <div className="h-20 bg-error-500 rounded-lg shadow-md"></div>
                            <p className="text-sm font-medium text-gray-700">Error</p>
                        </div>
                        <div className="space-y-2">
                            <div className="h-20 bg-info-500 rounded-lg shadow-md"></div>
                            <p className="text-sm font-medium text-gray-700">Info</p>
                        </div>
                        <div className="space-y-2">
                            <div className="h-20 bg-gray-500 rounded-lg shadow-md"></div>
                            <p className="text-sm font-medium text-gray-700">Neutral</p>
                        </div>
                    </div>
                </section>

                {/* Buttons */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Buttons</h2>
                    <div className="space-y-6">
                        {/* Variants */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Variants</h3>
                            <div className="flex flex-wrap gap-4">
                                <Button variant="primary">Primary</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="success">Success</Button>
                                <Button variant="warning">Warning</Button>
                                <Button variant="error">Error</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                            </div>
                        </div>

                        {/* Sizes */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Sizes</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <Button variant="primary" size="sm">Small</Button>
                                <Button variant="primary" size="md">Medium</Button>
                                <Button variant="primary" size="lg">Large</Button>
                            </div>
                        </div>

                        {/* With Icons */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">With Icons</h3>
                            <div className="flex flex-wrap gap-4">
                                <Button variant="primary" icon={<CheckCircle size={18} />}>
                                    Approve
                                </Button>
                                <Button variant="success" icon={<TrendingUp size={18} />}>
                                    View Stats
                                </Button>
                                <Button variant="error" icon={<XCircle size={18} />}>
                                    Delete
                                </Button>
                            </div>
                        </div>

                        {/* States */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">States</h3>
                            <div className="flex flex-wrap gap-4">
                                <Button variant="primary" loading>
                                    Loading...
                                </Button>
                                <Button variant="primary" disabled>
                                    Disabled
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Badges */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Badges</h2>
                    <div className="space-y-6">
                        {/* Variants */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Variants</h3>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="success" icon={<CheckCircle size={14} />}>Active</Badge>
                                <Badge variant="warning" icon={<AlertCircle size={14} />}>Pending</Badge>
                                <Badge variant="error" icon={<XCircle size={14} />}>Failed</Badge>
                                <Badge variant="info" icon={<Info size={14} />}>Info</Badge>
                                <Badge variant="primary">Primary</Badge>
                                <Badge variant="secondary">Secondary</Badge>
                                <Badge variant="neutral">Neutral</Badge>
                            </div>
                        </div>

                        {/* Sizes */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Sizes</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="success" size="sm">Small</Badge>
                                <Badge variant="success" size="md">Medium</Badge>
                                <Badge variant="success" size="lg">Large</Badge>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stat Cards */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Stat Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Total Documents"
                            value="1,234"
                            icon={<FileText className="text-primary-600" size={20} />}
                            trend="+12%"
                            variant="primary"
                        />
                        <StatCard
                            label="Active Users"
                            value="567"
                            icon={<Users className="text-success-600" size={20} />}
                            trend="+8%"
                            variant="success"
                        />
                        <StatCard
                            label="Revenue"
                            value="$45.6K"
                            icon={<DollarSign className="text-warning-600" size={20} />}
                            trend="+15%"
                            variant="warning"
                        />
                        <StatCard
                            label="Growth Rate"
                            value="23.5%"
                            icon={<TrendingUp className="text-info-600" size={20} />}
                            trend="+5%"
                            variant="info"
                        />
                    </div>
                </section>

                {/* Cards */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Simple Card */}
                        <Card>
                            <Card.Header>
                                <h3 className="text-lg font-semibold text-gray-900">Simple Card</h3>
                            </Card.Header>
                            <Card.Body>
                                <p className="text-gray-600">
                                    This is a simple card with header and body. Perfect for displaying content in a clean, organized way.
                                </p>
                            </Card.Body>
                        </Card>

                        {/* Card with Footer */}
                        <Card>
                            <Card.Header>
                                <h3 className="text-lg font-semibold text-gray-900">Card with Footer</h3>
                            </Card.Header>
                            <Card.Body>
                                <p className="text-gray-600">
                                    This card includes a footer section for actions or additional information.
                                </p>
                            </Card.Body>
                            <Card.Footer>
                                <div className="flex gap-2">
                                    <Button variant="primary" size="sm">Action</Button>
                                    <Button variant="outline" size="sm">Cancel</Button>
                                </div>
                            </Card.Footer>
                        </Card>

                        {/* Feature Card */}
                        <Card>
                            <Card.Header>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 rounded-lg">
                                        <FileText className="text-primary-600" size={20} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Feature Card</h3>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <p className="text-gray-600 mb-4">
                                    A more complex card with icons and badges.
                                </p>
                                <div className="flex gap-2">
                                    <Badge variant="success" size="sm">New</Badge>
                                    <Badge variant="info" size="sm">Featured</Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </section>

                {/* Typography */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Typography</h2>
                    <Card>
                        <Card.Body>
                            <div className="space-y-4">
                                <h1 className="text-5xl font-bold text-gray-900">Heading 1</h1>
                                <h2 className="text-4xl font-bold text-gray-900">Heading 2</h2>
                                <h3 className="text-3xl font-bold text-gray-900">Heading 3</h3>
                                <h4 className="text-2xl font-bold text-gray-900">Heading 4</h4>
                                <h5 className="text-xl font-bold text-gray-900">Heading 5</h5>
                                <h6 className="text-lg font-bold text-gray-900">Heading 6</h6>
                                <p className="text-base text-gray-600">
                                    This is body text using the Inter font family. It's clean, modern, and highly readable.
                                </p>
                                <p className="text-sm text-gray-500">
                                    This is small text, perfect for captions and secondary information.
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </section>

                {/* Utility Classes */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Utility Classes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <Card.Header>
                                <h3 className="text-lg font-semibold text-gray-900">Text Gradients</h3>
                            </Card.Header>
                            <Card.Body>
                                <div className="space-y-3">
                                    <p className="text-2xl font-bold text-gradient-primary">
                                        Primary Gradient Text
                                    </p>
                                    <p className="text-2xl font-bold text-gradient-secondary">
                                        Secondary Gradient Text
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Header>
                                <h3 className="text-lg font-semibold text-gray-900">Hover Effects</h3>
                            </Card.Header>
                            <Card.Body>
                                <div className="space-y-3">
                                    <div className="p-4 bg-primary-100 rounded-lg hover-lift cursor-pointer">
                                        <p className="text-primary-700 font-medium">Hover to lift</p>
                                    </div>
                                    <div className="p-4 bg-secondary-100 rounded-lg glass cursor-pointer">
                                        <p className="text-secondary-700 font-medium">Glassmorphism effect</p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </section>

            </div>
        </div>
    );
}
