import HeroSection from '../components/sections/HeroSection';
import FeaturesOverview from '../components/sections/FeaturesOverview';
import HowItWorks from '../components/sections/HowItWorks';
import UseCasesPreview from '../components/sections/UseCasesPreview';
import StatsSection from '../components/sections/StatsSection';
import CTASection from '../components/sections/CTASection';

function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesOverview />
      <HowItWorks />
      <UseCasesPreview />
      <StatsSection />
      <CTASection />
    </div>
  );
}

export default Home;
