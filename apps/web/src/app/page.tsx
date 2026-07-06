import { AnimatedBackground } from "@/components/landing/animated-background";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1">
        <Hero />
        <Features />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
