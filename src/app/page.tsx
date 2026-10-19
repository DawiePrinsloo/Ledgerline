import { Hero } from "@/components/landing/hero";
import { Ticker } from "@/components/landing/ticker";
import { Evidence } from "@/components/landing/evidence";
import { Anatomy } from "@/components/landing/anatomy";
import { Rebuild } from "@/components/landing/rebuild";
import { Footer } from "@/components/landing/footer";
import { Grain } from "@/components/ui/grain";

export default function HomePage() {
  return (
    <main className="relative">
      <Grain />
      <Hero />
      <Ticker />
      <Evidence />
      <Anatomy />
      <Rebuild />
      <Footer />
    </main>
  );
}
