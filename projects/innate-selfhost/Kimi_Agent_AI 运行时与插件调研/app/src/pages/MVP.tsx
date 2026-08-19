import MVPHero from '@/sections/mvp/MVPHero';
import MVPOverview from '@/sections/mvp/MVPOverview';
import PhaseTimeline from '@/sections/mvp/PhaseTimeline';
import MVPSummary from '@/sections/mvp/MVPSummary';

export default function MVP() {
  return (
    <div className="bg-[#05040A]">
      <MVPHero />
      <MVPOverview />
      <PhaseTimeline />
      <MVPSummary />
    </div>
  );
}
