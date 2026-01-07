import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import HelpContent from '../../components/content/HelpContent';
import { useNavigate } from 'react-router-dom';

export default function PublicHelp() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-grow py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <HelpContent
                        onContactClick={() => navigate('/contact-us')}
                        onEmailClick={() => window.location.href = 'mailto:support@rappa.ai'}
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
}
