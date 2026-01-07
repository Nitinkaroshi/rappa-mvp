import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ApiDocs() {
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(`curl -X POST https://api.rappa.ai/v1/jobs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@invoice.pdf"`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-grow py-16">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Sidebar */}
                    <div className="hidden lg:block space-y-4">
                        <h3 className="font-bold text-gray-900 mb-4 px-2">API Reference</h3>
                        <nav className="space-y-1">
                            {['Authentication', 'Upload Document', 'Get Job Status', 'Webhooks', 'Errors'].map(item => (
                                <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg hover:text-primary-600 transition-colors">
                                    {item}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3 space-y-12">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-6">API Documentation</h1>
                            <p className="text-xl text-gray-600 mb-8">
                                Integrate intelligent document processing into your applications using our REST API.
                            </p>

                            <div className="bg-gray-900 rounded-xl p-6 text-white font-mono text-sm relative group">
                                <button
                                    onClick={copyCode}
                                    className="absolute top-4 right-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                                >
                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                                <pre>{`curl -X POST https://api.rappa.ai/v1/jobs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@invoice.pdf"`}</pre>
                            </div>
                        </div>

                        <section id="authentication" className="border-t border-gray-200 pt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
                            <p className="text-gray-600 mb-4">
                                Authenticate your requests using Bearer Auth. You can generate an API key in the Dashboard Settings.
                            </p>
                        </section>

                        <section id="upload-document" className="border-t border-gray-200 pt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Document</h2>
                            <p className="text-gray-600 mb-4">
                                POST /v1/jobs
                            </p>
                            {/* More details would go here */}
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
