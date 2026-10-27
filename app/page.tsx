import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import Services from '@/components/Services'
import WaermepumpeTeaser from '@/components/WaermepumpeTeaser'
import Prozess from '@/components/Prozess'
import Projects from '@/components/Projects'
import RechnerTeaser from '@/components/RechnerTeaser'
import About from '@/components/About'
import FAQ from '@/components/FAQ'
import Markenpartner from '@/components/Markenpartner'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

// Förder-Countdown im Wärmepumpen-Teaser ist datumsabhängig
export const revalidate = 86400

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <Stats />
      <WaermepumpeTeaser />
      <Services />
      <Prozess />
      <Projects />
      <RechnerTeaser />
      <About />
      <Markenpartner />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  )
}
