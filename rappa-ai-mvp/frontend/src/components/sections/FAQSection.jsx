import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const faqs = [
    {
        question: "What file formats does rappa.ai support?",
        answer: "We support PDF, JPG, PNG, and TIFF formats. Our AI is optimized to handle both scanned documents and digital-native files with high accuracy."
    },
    {
        question: "How accurate is the data extraction?",
        answer: "Our AI models typically achieve 99%+ accuracy on standard business documents. For complex or handwritten documents, we provide a confidence score so you can easily review low-confidence fields."
    },
    {
        question: "Is my data secure?",
        answer: "Yes, security is our top priority. We use bank-grade encryption for data in transit and at rest. We are GDPR compliant and do not use your data to train our public models without permission."
    },
    {
        question: "Can I create custom templates?",
        answer: "Absolutely! You can train our AI on your specific document types by uploading as few as 5 samples. The system automatically learns the layout and fields to extract."
    },
    {
        question: "How does the credit system work?",
        answer: "You use credits to process pages. 1 page = 1 credit. We offer flexible credit packs that never expire, so you only pay for what you use."
    }
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-xl mb-4 text-primary-600">
                        <HelpCircle size={24} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-xl text-gray-600">
                        Everything you need to know about our platform
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${openIndex === index
                                    ? 'border-primary-200 shadow-md ring-1 ring-primary-100'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <button
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                onClick={() => setOpenIndex(index === openIndex ? -1 : index)}
                            >
                                <span className={`text-lg font-semibold ${openIndex === index ? 'text-primary-700' : 'text-gray-900'}`}>
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="text-primary-600" />
                                ) : (
                                    <ChevronDown className="text-gray-400" />
                                )}
                            </button>

                            <div
                                className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
