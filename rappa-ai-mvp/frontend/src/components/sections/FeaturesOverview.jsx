import { FileSearch, Shield, Eye, Workflow, Zap, Lock } from 'lucide-react';

function FeaturesOverview() {
  const features = [
    {
      icon: FileSearch,
      title: 'Intelligent OCR',
      description: 'Extract text from any document format with 99%+ accuracy. Supports handwriting, multiple languages, and low-quality scans.',
    },
    {
      icon: Shield,
      title: 'Fraud Detection',
      description: 'Automated detection of duplicates, document tampering, data inconsistencies, and suspicious patterns with detailed risk analysis.',
    },
    {
      icon: Eye,
      title: 'Computer Vision',
      description: 'Automatically enhance, classify, and process documents using state-of-the-art computer vision technology.',
    },
    {
      icon: Workflow,
      title: 'API Integration',
      description: 'Integrate seamlessly with your existing systems via our comprehensive REST API with JSON/CSV/Excel export.',
    },
    {
      icon: Zap,
      title: 'Real-time Processing',
      description: 'Process documents in seconds with our high-performance infrastructure and get instant results.',
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption, compliance with GDPR, SOC 2, and complete data sovereignty.',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Businesses
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to digitize, analyze, and automate your document workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-indigo-200 group">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl w-14 h-14 flex items-center justify-center mb-4 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                <feature.icon className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesOverview;
