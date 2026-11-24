import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Philosophy from "@/components/Philosophy";
import Services from "@/components/Services";
import CarePlanner from "@/components/CarePlanner";
import Journey from "@/components/Journey";
import NightLog from "@/components/NightLog";
import MobileCTA from "@/components/MobileCTA";
import About from "@/components/About";
import Mentorship from "@/components/Mentorship";
import Guides from "@/components/Guides";
import Workshops from "@/components/Workshops";
import FAQ from "@/components/FAQ";
import Inquiry from "@/components/Inquiry";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Philosophy />
        <Services />
        <CarePlanner />
        <Journey />
        <NightLog />
        <About />
        <Mentorship />
        <Guides />
        <Workshops />
        <FAQ />
        <Inquiry />
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
