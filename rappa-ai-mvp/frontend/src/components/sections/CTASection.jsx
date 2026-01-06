import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

function CTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Ready to Transform Your Document Workflows?
        </h2>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
          Join leading enterprises using rappa.ai to automate document processing and unlock valuable insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="group bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/contact"
            className="group border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-200 flex items-center gap-2 justify-center"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Schedule a Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
