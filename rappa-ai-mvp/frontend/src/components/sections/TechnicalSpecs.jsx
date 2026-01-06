import { Check } from 'lucide-react';

function TechnicalSpecs() {
  const specs = {
    'Supported Formats': ['PDF', 'JPEG/PNG', 'TIFF', 'HEIC', 'WebP', 'Scanned Documents'],
    'API Capabilities': ['RESTful API', 'Webhooks', 'Batch Processing', 'Real-time Streaming', 'Custom Endpoints'],
    'Output Formats': ['JSON', 'CSV', 'Excel (XLSX)', 'XML', 'Custom Formats'],
    'Security & Compliance': ['SOC 2 Type II', 'GDPR Compliant', 'HIPAA Ready', 'ISO 27001', 'End-to-End Encryption'],
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
      <h2 className="text-3xl font-bold text-accent-black mb-8 text-center">
        Technical Specifications
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(specs).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xl font-semibold text-accent-black mb-4">{category}</h3>
            <ul className="space-y-3">
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechnicalSpecs;
