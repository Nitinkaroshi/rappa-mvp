import { Book, Code, LifeBuoy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const resources = [
    {
        icon: <Book size={32} />,
        title: "Documentation",
        description: "Detailed guides on how to use every feature of our platform effectively.",
        link: "/docs",
        color: "primary"
    },
    {
        icon: <Code size={32} />,
        title: "API Reference",
        description: "Technical reference for developers integrating our OCR API.",
        link: "/api-docs",
        color: "secondary"
    },
    {
        icon: <LifeBuoy size={32} />,
        title: "Customer Support",
        description: "Need help? Our support team is available 24/7 to assist you.",
        link: "/contact-us",
        color: "success"
    }
];

export default function HelpResourcesSection() {
    const colorClasses = {
        primary: "bg-primary-100 text-primary-600",
        secondary: "bg-secondary-100 text-secondary-600",
        success: "bg-success-100 text-success-600"
    };

    return (
        <section className="py-20 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Resources & Support
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        We're here to help you succeed. Explore our documentation or get in touch with our team.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {resources.map((resource, index) => (
                        <Link
                            key={index}
                            to={resource.link}
                            className="group p-8 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${colorClasses[resource.color]} group-hover:scale-110 transition-transform`}>
                                {resource.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                                {resource.title}
                            </h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {resource.description}
                            </p>
                            <div className="flex items-center font-semibold text-primary-600 group-hover:gap-2 transition-all">
                                Learn more <ArrowRight size={16} className="ml-1 opacity-0 group-hover:opacity-100" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
