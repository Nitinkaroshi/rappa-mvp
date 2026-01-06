import { Check } from 'lucide-react';
import Card from './Card';

function SolutionCard({ icon: Icon, title, description, features }) {
  return (
    <Card>
      <div className="bg-accent-yellow rounded-lg w-16 h-16 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-accent-black" />
      </div>
      <h3 className="text-2xl font-bold text-accent-black mb-4">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default SolutionCard;
