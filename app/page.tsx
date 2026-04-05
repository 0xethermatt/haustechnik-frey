import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import Services from '@/components/Services'
import Prozess from '@/components/Prozess'
import Projects from '@/components/Projects'
import Heizungsrechner from '@/components/Heizungsrechner'
import About from '@/components/About'
import FAQ from '@/components/FAQ'
import Markenpartner from '@/components/Markenpartner'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <Stats />
      <Services />
      <Prozess />
      <Projects />
      <Heizungsrechner />
      <About />
      <Markenpartner />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  )
}
