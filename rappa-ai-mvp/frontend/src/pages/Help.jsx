import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Book, MessageCircle, Mail, ExternalLink, ChevronRight } from 'lucide-react';
import { authAPI } from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';

function Help() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const userData = await authAPI.me();
        setUser(userData);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
      }
    }
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };
  const faqs = [
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

  const resources = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of document processing',
      icon: Book,
      link: '#',
    },
    {
      title: 'API Documentation',
      description: 'Integrate with your systems',
      icon: Book,
      link: '/api/docs',
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      icon: Book,
      link: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader user={user} />
        <main className="flex-1 p-6">
          <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">How can we help?</h1>
          <p className="text-gray-600 mt-2">Search our help center or browse topics below</p>

          {/* Search */}
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <a
                key={index}
                href={resource.link}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <Icon className="text-indigo-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-indigo-600 transition-colors" size={20} />
                </div>
              </a>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="pb-6 border-b border-gray-200 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <MessageCircle className="text-indigo-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Submit Support Ticket</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create a support ticket with file attachments and automatic log collection
                </p>
                <button
                  onClick={() => navigate('/support')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Ticket
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Mail className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Send us an email and we'll get back to you within 24 hours
                </p>
                <a
                  href="mailto:support@rappa.ai"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <Mail size={18} />
                  support@rappa.ai
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Resources</h2>
          <div className="space-y-3">
            <a
              href="#"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Book className="text-gray-400 group-hover:text-indigo-600" size={20} />
                <span className="font-medium text-gray-900">User Guide (PDF)</span>
              </div>
              <ExternalLink className="text-gray-400 group-hover:text-indigo-600" size={18} />
            </a>

            <a
              href="#"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Book className="text-gray-400 group-hover:text-indigo-600" size={20} />
                <span className="font-medium text-gray-900">Fraud Detection Guide</span>
              </div>
              <ExternalLink className="text-gray-400 group-hover:text-indigo-600" size={18} />
            </a>

            <a
              href="#"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Book className="text-gray-400 group-hover:text-indigo-600" size={20} />
                <span className="font-medium text-gray-900">API Integration Examples</span>
              </div>
              <ExternalLink className="text-gray-400 group-hover:text-indigo-600" size={18} />
            </a>

            <a
              href="#"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Book className="text-gray-400 group-hover:text-indigo-600" size={20} />
                <span className="font-medium text-gray-900">Best Practices</span>
              </div>
              <ExternalLink className="text-gray-400 group-hover:text-indigo-600" size={18} />
            </a>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
          <p className="mb-6 text-indigo-100">
            Our support team is here to assist you with any questions
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/support')}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Support Ticket
            </button>
            <a
              href="mailto:support@rappa.ai"
              className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-indigo-500"
            >
              Email Us
            </a>
          </div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Help;
