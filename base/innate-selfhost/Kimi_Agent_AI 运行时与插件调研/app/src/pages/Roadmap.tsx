import RoadmapHero from '@/sections/roadmap/RoadmapHero';
import Timeline from '@/sections/roadmap/Timeline';
import KeyMilestones from '@/sections/roadmap/KeyMilestones';
import Contribute from '@/sections/roadmap/Contribute';
import RoadmapCTA from '@/sections/roadmap/RoadmapCTA';

export default function Roadmap() {
  return (
    <div>
      <RoadmapHero />
      <Timeline />
      <KeyMilestones />
      <Contribute />
      <RoadmapCTA />
    </div>
  );
}
