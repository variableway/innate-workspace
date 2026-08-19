import ExtensionHero from '@/sections/extension/ExtensionHero';
import CapabilitiesGrid from '@/sections/extension/CapabilitiesGrid';
import AgentOrchestration from '@/sections/extension/AgentOrchestration';
import WASMSandbox from '@/sections/extension/WASMSandbox';
import WorkflowBuilder from '@/sections/extension/WorkflowBuilder';
import Publishing from '@/sections/extension/Publishing';

export default function Extension() {
  return (
    <div>
      <ExtensionHero />
      <CapabilitiesGrid />
      <AgentOrchestration />
      <WASMSandbox />
      <WorkflowBuilder />
      <Publishing />
    </div>
  );
}
