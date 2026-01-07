import { Search, Book, Video, HelpCircle, ChevronRight, MessageCircle, Mail } from 'lucide-react';
import { Card, Button } from '../components/ui';

export const faqs = [
    {
        question: 'How do I upload a document?',
        answer: 'Navigate to the Upload page from the sidebar. You can upload PDF, JPG, or PNG files up to 50 MB. Optionally select a document template for higher accuracy, or let our AI automatically detect the document type.',
    },
    {
        question: 'What document types are supported?',
        answer: 'We support 22+ document templates across 4 categories: Real Estate (Sale Deed, Rent Agreement, etc.), Banking (Bank Statement, Cheque, etc.), Finance (Invoice, Purchase Order, etc.), and Personal (Aadhaar Card, PAN Card, etc.). Our AI can also auto-detect any document type.',
    },
    {
        question: 'How do credits work?',
        answer: 'Credits are charged based on document type: 1 credit per image (JPG, PNG) and 1 credit per page for PDFs. For example, a 5-page PDF costs 5 credits. New users get 10 free credits to start.',
    },
    {
        question: 'What is template-based vs auto-detection processing?',
        answer: 'Template-based: Select a specific document type for higher accuracy with predefined fields. Auto-detection: Let Gemini AI automatically identify the document type and extract relevant fields. Both methods are equally effective.',
    },
    {
        question: 'Can I add custom fields to my documents?',
        answer: 'Yes! After processing, you can add custom fields to any document from the job results page. Custom fields let you track additional information specific to your needs.',
    },
    {
        question: 'Can I export my data?',
        answer: 'Yes! You can export extracted data in multiple formats: JSON, CSV, Excel, and PDF. All exports include both standard extracted fields and any custom fields you\'ve added.',
    },
    {
        question: 'How do I edit extracted fields?',
        answer: 'On the job results page, click any field to edit its value. Changes are saved automatically. You can also reset fields to their original extracted values.',
    },
    {
        question: 'What if I need help or want to report a bug?',
        answer: 'Visit the Support page to submit a ticket. You can attach screenshots or logs, and our team will receive an email notification immediately. We respond within 24 hours.',
    },
    {
        question: 'What are Custom Templates and how do they work?',
        answer: 'Custom Templates allow you to create reusable extraction schemas for any document type. Upload a sample document, let AI suggest fields to extract, verify and customize the schema, then save it for batch processing. You can create templates for invoices, contracts, or any document type you process regularly.',
    },
    {
        question: 'How does Batch Processing work?',
        answer: 'Batch Processing lets you process multiple documents (up to 100) at once using a Custom Template. Select a template, upload your documents, and our AI will extract data from all of them. Results can be downloaded as CSV or Excel. You can have up to 5 active batches, and batch data is automatically deleted after 30 days.',
    },
    {
        question: 'Can I modify the AI-suggested schema?',
        answer: 'Yes! After AI generates a schema from your sample document, you can add, remove, edit, and reorder fields. You can also validate your modified schema against the sample document to ensure it extracts data correctly before saving.',
    },
];

export const resources = [
    {
        title: 'Getting Started Guide',
        description: 'Learn the basics of document processing',
        icon: Book,
        link: '#',
    },
    {
        title: 'API Documentation',
        description: 'Integrate into your app',
        icon: Book,
        link: '/api-docs', // Unified link
    },
    {
        title: 'Video Tutorials',
        description: 'Watch step-by-step guides',
        icon: Video,
        link: '#',
    },
];

export default function HelpContent({ onContactClick, onEmailClick }) {
    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Hero Search */}
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="text-primary-600 h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">How can we help?</h1>
                <p className="text-gray-600 mt-2">Search our knowledge base or browse frequently asked questions.</p>

                <div className="mt-8 max-w-2xl mx-auto relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search for answers..."
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg transition-shadow bg-white"
                    />
                </div>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resources.map((resource, index) => {
                    const Icon = resource.icon;
                    return (
                        <Card key={index} hover className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => resource.link && resource.link !== '#' ? window.location.href = resource.link : null}>
                            <div className="p-6 flex items-start gap-4">
                                <div className="p-3 bg-primary-50 rounded-xl group-hover:bg-primary-100 transition-colors">
                                    <Icon className="text-primary-600" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{resource.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-primary-500" size={18} />
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* FAQ Section */}
            <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                <div className="divide-y divide-gray-100">
                    {faqs.map((faq, index) => (
                        <div key={index} className="py-6 first:pt-0 last:pb-0">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Contact Support Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
                    <p className="text-primary-100">Our support team is available 24/7 to assist you.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="white" onClick={onContactClick} icon={<MessageCircle size={18} />}>
                        Contact Support
                    </Button>
                    <Button
                        variant="outline"
                        className="text-white border-white/30 hover:bg-white/10 hover:text-white"
                        onClick={onEmailClick || (() => window.location.href = 'mailto:support@rappa.ai')}
                        icon={<Mail size={18} />}
                    >
                        Email Us
                    </Button>
                </div>
            </div>
        </div>
    );
}
