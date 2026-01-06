import { Upload, Cpu, Download, CheckCircle } from 'lucide-react';

function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Documents',
      description: 'Upload documents via API, email, or our web interface. Supports PDFs, images, and scanned files.',
      step: '01',
    },
    {
      icon: Cpu,
      title: 'AI Processing',
      description: 'Our AI engine extracts, validates, and analyzes your documents with industry-leading accuracy.',
      step: '02',
    },
    {
      icon: CheckCircle,
      title: 'Validation & Detection',
      description: 'Automated fraud detection, duplicate checking, and data validation ensure quality results.',
      step: '03',
    },
    {
      icon: Download,
      title: 'Export & Integrate',
      description: 'Receive structured data in JSON, CSV, or Excel. Integrate directly into your systems via API.',
      step: '04',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Four simple steps to transform your document processing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-indigo-200 group">
                <div className="absolute -top-4 -left-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{step.step}</span>
                </div>
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl w-16 h-16 flex items-center justify-center mb-4 mt-2 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                  <step.icon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
