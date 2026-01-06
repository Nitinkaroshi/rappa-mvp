import { Calculator, Landmark, Building2, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function UseCasesPreview() {
  const useCases = [
    {
      icon: Calculator,
      title: 'Finance & Accounting',
      description: 'Automate invoice processing, receipt scanning, and expense management.',
    },
    {
      icon: Landmark,
      title: 'Banking & Finance',
      description: 'Streamline KYC verification and fraud detection for financial services.',
    },
    {
      icon: Building2,
      title: 'Real Estate',
      description: 'Process lease agreements and property documents efficiently.',
    },
    {
      icon: FileText,
      title: 'Legal & Compliance',
      description: 'Extract and analyze contracts and compliance documentation.',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Built for Every Industry
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From finance to healthcare, our platform adapts to your specific needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-indigo-200 group">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <useCase.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{useCase.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{useCase.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/use-cases"
            className="inline-flex items-center gap-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold px-8 py-4 rounded-lg transition-all duration-200"
          >
            Explore All Use Cases
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default UseCasesPreview;
