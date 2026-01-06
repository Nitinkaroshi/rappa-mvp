import { FileSearch, Shield, Eye, Workflow } from 'lucide-react';
import SolutionCard from '../components/ui/SolutionCard';

function Solutions() {
  const solutions = [
    {
      icon: FileSearch,
      title: 'DocuSense OCR',
      description: 'Advanced optical character recognition with 99%+ accuracy. Extract data from any document format including PDFs, images, and scanned files.',
      features: [
        'Multi-language support (50+ languages)',
        'Handwriting recognition',
        'Low-quality document processing',
        'Batch processing capabilities',
        'Real-time extraction API'
      ]
    },
    {
      icon: Shield,
      title: 'GuardianAI Fraud Detection',
      description: 'AI-powered fraud detection system that identifies anomalies, duplicates, and suspicious patterns in your documents.',
      features: [
        'Duplicate document detection',
        'Tamper detection and verification',
        'Anomaly identification',
        'Confidence scoring system',
        'Real-time alerts and monitoring'
      ]
    },
    {
      icon: Eye,
      title: 'VisionCore Processing',
      description: 'Advanced computer vision technology for intelligent document analysis and image enhancement.',
      features: [
        'Automatic image enhancement',
        'Document classification',
        'Smart cropping and orientation',
        'Multi-page document handling',
        'Quality assessment'
      ]
    },
    {
      icon: Workflow,
      title: 'FlowHub Automation',
      description: 'Streamline your document workflows with intelligent automation and seamless integration capabilities.',
      features: [
        'Custom workflow builder',
        'API-first architecture',
        'Third-party integrations',
        'Automated data routing',
        'Export to multiple formats (JSON, CSV, Excel)'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-accent-black mb-4">
            Our Solutions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive document intelligence platform powered by cutting-edge AI technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <SolutionCard key={index} {...solution} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Solutions;
