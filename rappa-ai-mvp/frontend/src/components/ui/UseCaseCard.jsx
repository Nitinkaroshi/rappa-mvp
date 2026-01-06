import { ArrowRight } from 'lucide-react';
import Card from './Card';

function UseCaseCard({ icon: Icon, title, description, applications }) {
  return (
    <Card>
      <div className="bg-accent-yellow/20 rounded-lg w-14 h-14 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-accent-black" />
      </div>
      <h3 className="text-xl font-bold text-accent-black mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">Key Applications:</p>
        <ul className="space-y-2">
          {applications.map((app, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <ArrowRight className="w-4 h-4 text-accent-yellow flex-shrink-0 mt-0.5" />
              <span>{app}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default UseCaseCard;
