import { Check } from 'lucide-react';
import FeatureGrid from '../components/sections/FeatureGrid';
import TechnicalSpecs from '../components/sections/TechnicalSpecs';

function Features() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-accent-black mb-4">
            Platform Features
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need for intelligent document processing in one powerful platform
          </p>
        </div>

        <FeatureGrid />
        <TechnicalSpecs />

        {/* Integration Section */}
        <div className="mt-20 bg-gray-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-accent-black mb-8 text-center">
            Enterprise-Ready Integration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-accent-yellow rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-accent-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">RESTful API</h3>
              <p className="text-gray-600">
                Well-documented API with comprehensive SDK support
              </p>
            </div>
            <div className="text-center">
              <div className="bg-accent-yellow rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-accent-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Webhooks</h3>
              <p className="text-gray-600">
                Real-time notifications for processing events
              </p>
            </div>
            <div className="text-center">
              <div className="bg-accent-yellow rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-accent-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Custom Integration</h3>
              <p className="text-gray-600">
                Flexible integration options for any tech stack
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Features;
