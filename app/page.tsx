'use client';

import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CallToAction } from '@/components/landing/CallToAction';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20 selection:text-primary">
      <LandingHeader />
      <HeroSection />
      <FeaturesGrid />
      <TestimonialsSection />
      <PricingSection />
      <CallToAction />
      <LandingFooter />
    </div>
  );
}
