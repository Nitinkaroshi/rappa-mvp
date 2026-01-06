import {
  Languages,
  Image,
  FileType,
  Zap,
  Database,
  Globe,
  Sparkles,
  BarChart3,
  Clock,
  Shield,
  Boxes,
  Code
} from 'lucide-react';

function FeatureGrid() {
  const features = [
    {
      icon: Languages,
      title: 'Multi-Language OCR',
      description: 'Support for 50+ languages including Latin, Cyrillic, Arabic, Chinese, Japanese, and more.',
    },
    {
      icon: Image,
      title: 'Handwriting Recognition',
      description: 'Advanced AI to recognize and extract handwritten text with high accuracy.',
    },
    {
      icon: FileType,
      title: '100+ Document Types',
      description: 'Pre-trained models for invoices, receipts, IDs, contracts, and custom templates.',
    },
    {
      icon: Zap,
      title: 'Real-Time Processing',
      description: 'Extract data from documents in under 2 seconds with our optimized infrastructure.',
    },
    {
      icon: Database,
      title: 'Batch Processing',
      description: 'Process thousands of documents simultaneously with our scalable batch API.',
    },
    {
      icon: Globe,
      title: 'Cloud & On-Premise',
      description: 'Flexible deployment options to meet your security and compliance requirements.',
    },
    {
      icon: Sparkles,
      title: 'Auto Enhancement',
      description: 'Automatically improve low-quality scans and photos for better extraction results.',
    },
    {
      icon: BarChart3,
      title: 'Confidence Scoring',
      description: 'Get reliability scores for each extracted field to ensure data quality.',
    },
    {
      icon: Clock,
      title: 'Version Control',
      description: 'Track document changes and maintain complete audit trails.',
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'SOC 2, GDPR compliant with end-to-end encryption and data sovereignty.',
    },
    {
      icon: Boxes,
      title: 'Custom Templates',
      description: 'Create and train custom document templates for your specific use cases.',
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'Comprehensive REST API with SDKs for Python, Node.js, Java, and more.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {features.map((feature, index) => (
        <div
          key={index}
          className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all hover:bg-white border border-transparent hover:border-accent-yellow"
        >
          <div className="bg-white rounded-lg w-12 h-12 flex items-center justify-center mb-4 shadow-sm">
            <feature.icon className="w-6 h-6 text-accent-yellow" />
          </div>
          <h3 className="text-lg font-bold text-accent-black mb-2">{feature.title}</h3>
          <p className="text-sm text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}

export default FeatureGrid;
