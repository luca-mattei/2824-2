'use client';

import { ReducedMotionSync } from '@/components/accessibility/ReducedMotionSync';
import { MovementStage } from '@/components/MovementStage';
import { Narrative } from '@/components/narrative/Narrative';
import { SourcesSection } from '@/components/narrative/SourcesSection';
import { TopBar } from '@/components/navigation/TopBar';
import { PresentationOverlay } from '@/components/presentation/PresentationOverlay';

export function Experience() {
  return (
    <>
      <a className="lien-evitement" href="#etape-eclate">
        Aller au contenu
      </a>
      <ReducedMotionSync />
      <TopBar />
      <MovementStage />
      <main>
        <Narrative />
        <SourcesSection />
      </main>
      <PresentationOverlay />
    </>
  );
}
