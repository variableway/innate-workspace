import ArchitectureHero from '@/sections/architecture/ArchitectureHero';
import ArchitectureDiagram from '@/sections/architecture/ArchitectureDiagram';
import TechDeepDive from '@/sections/architecture/TechDeepDive';
import DesignRationale from '@/sections/architecture/DesignRationale';

export default function Architecture() {
  return (
    <div className="bg-[#05040A]">
      <ArchitectureHero />
      <ArchitectureDiagram />
      <TechDeepDive />
      <DesignRationale />
    </div>
  );
}
