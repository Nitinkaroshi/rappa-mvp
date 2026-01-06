import { Building2, Calculator, Landmark, FileText, HeartPulse, ShoppingCart } from 'lucide-react';
import UseCaseCard from '../components/ui/UseCaseCard';

function UseCases() {
  const useCases = [
    {
      icon: Calculator,
      title: 'Finance & Accounting',
      description: 'Automate invoice processing, receipt scanning, and expense report management.',
      applications: [
        'Invoice data extraction',
        'Receipt digitization',
        'Expense report automation',
        'Bank statement analysis',
        'Purchase order processing'
      ]
    },
    {
      icon: Landmark,
      title: 'Banking & Financial Services',
      description: 'Streamline KYC verification, document processing, and fraud detection.',
      applications: [
        'KYC/AML document verification',
        'Bank statement processing',
        'Loan application automation',
        'Fraud detection and prevention',
        'Account opening workflows'
      ]
    },
    {
      icon: Building2,
      title: 'Real Estate',
      description: 'Process rental agreements, property documents, and certificates efficiently.',
      applications: [
        'Lease agreement extraction',
        'Property document processing',
        'Title deed verification',
        'Rent receipt automation',
        'Property certificate handling'
      ]
    },
    {
      icon: FileText,
      title: 'Legal & Compliance',
      description: 'Extract and analyze legal documents, contracts, and compliance forms.',
      applications: [
        'Contract analysis and extraction',
        'Legal document classification',
        'Compliance form processing',
        'Due diligence automation',
        'Document version comparison'
      ]
    },
    {
      icon: HeartPulse,
      title: 'Healthcare',
      description: 'Digitize medical records, prescriptions, and insurance documents.',
      applications: [
        'Medical record digitization',
        'Prescription data extraction',
        'Insurance claim processing',
        'Patient form automation',
        'Healthcare compliance documentation'
      ]
    },
    {
      icon: ShoppingCart,
      title: 'Retail & E-commerce',
      description: 'Automate inventory management, invoicing, and supply chain documentation.',
      applications: [
        'Invoice and receipt processing',
        'Inventory document automation',
        'Supply chain documentation',
        'Vendor document management',
        'Product catalog digitization'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-accent-black mb-4">
            Industry Use Cases
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transforming document workflows across industries with intelligent automation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <UseCaseCard key={index} {...useCase} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default UseCases;
