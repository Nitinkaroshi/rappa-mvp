import { Mail, MessageSquare } from 'lucide-react';

export default function ContactInfoCards() {
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Mail size={24} />
                    </div>
                    <h3 className="text-lg font-bold">Email Us</h3>
                </div>
                <p className="text-gray-600 ml-16">support@rappa.ai</p>
                <p className="text-gray-500 text-sm ml-16 mt-1">Response time: &lt; 24 hours</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <MessageSquare size={24} />
                    </div>
                    <h3 className="text-lg font-bold">Live Chat</h3>
                </div>
                <p className="text-gray-600 ml-16">Available in Dashboard</p>
                <p className="text-gray-500 text-sm ml-16 mt-1">Mon-Fri, 9am - 6pm EST</p>
            </div>
        </div>
    );
}
