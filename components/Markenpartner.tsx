'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface Brand {
  name: string
  category: string
  logo: string
  border: string
  tag: string
}

const brands: Brand[] = [
  {
    name: 'Viessmann',
    category: 'Heizung',
    logo: '/images/logos/viessmann.jpg',
    border: 'border-brand-orange/20',
    tag: 'text-brand-orange bg-brand-orange/10',
  },
  {
    name: 'Vaillant',
    category: 'Heizung',
    logo: '/images/logos/vaillant.png',
    border: 'border-brand-orange/20',
    tag: 'text-brand-orange bg-brand-orange/10',
  },
  {
    name: 'Buderus',
    category: 'Heizung',
    logo: '/images/logos/buderus.png',
    border: 'border-brand-orange/20',
    tag: 'text-brand-orange bg-brand-orange/10',
  },
  {
    name: 'Weishaupt',
    category: 'Heizung',
    logo: '/images/logos/weishaupt.png',
    border: 'border-brand-orange/20',
    tag: 'text-brand-orange bg-brand-orange/10',
  },
  {
    name: 'Grohe',
    category: 'Sanitär',
    logo: '/images/logos/grohe.png',
    border: 'border-brand-blue/20',
    tag: 'text-brand-blue bg-brand-blue/10',
  },
  {
    name: 'Hansgrohe',
    category: 'Sanitär',
    logo: '/images/logos/hansgrohe.jpg',
    border: 'border-brand-blue/20',
    tag: 'text-brand-blue bg-brand-blue/10',
  },
  {
    name: 'Hansa',
    category: 'Sanitär',
    logo: '/images/logos/hansa.jpg',
    border: 'border-brand-blue/20',
    tag: 'text-brand-blue bg-brand-blue/10',
  },
  {
    name: 'Geberit',
    category: 'Sanitär',
    logo: '/images/logos/geberit.png',
    border: 'border-brand-blue/20',
    tag: 'text-brand-blue bg-brand-blue/10',
  },
  {
    name: 'Villeroy & Boch',
    category: 'Badkeramik',
    logo: '/images/logos/villeroy-boch.png',
    border: 'border-brand-purple/20',
    tag: 'text-brand-purple bg-brand-purple/10',
  },
  {
    name: 'Duravit',
    category: 'Badkeramik',
    logo: '/images/logos/duravit.png',
    border: 'border-brand-purple/20',
    tag: 'text-brand-purple bg-brand-purple/10',
  },
  {
    name: 'Laufen',
    category: 'Badkeramik',
    logo: '/images/logos/laufen.png',
    border: 'border-brand-purple/20',
    tag: 'text-brand-purple bg-brand-purple/10',
  },
  {
    name: 'Kermi',
    category: 'Heizkörper',
    logo: '/images/logos/kermi.png',
    border: 'border-brand-teal/20',
    tag: 'text-brand-teal bg-brand-teal/10',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export default function Markenpartner() {
  return (
    <section
      id="markenpartner"
      className="py-12 sm:py-16 lg:py-24 bg-brand-cream"
      aria-labelledby="markenpartner-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            Unsere Partner
          </span>
          <h2
            id="markenpartner-heading"
            className="text-3xl sm:text-4xl font-serif font-bold text-brand-purple-deep"
          >
            Markenpartner
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Wir arbeiten ausschließlich mit Produkten führender Hersteller — für langlebige
            Qualität, die Sie dauerhaft überzeugt.
          </p>
        </motion.div>

        {/* Brand logo grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {brands.map((brand) => (
            <motion.div
              key={brand.name}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`group flex flex-col items-center justify-between gap-3 bg-white rounded-2xl border-2 ${brand.border} px-4 py-5 hover:shadow-card transition-all duration-200 cursor-default`}
            >
              <div className="relative w-full h-12 flex items-center justify-center">
                <Image
                  src={brand.logo}
                  alt={`${brand.name} Logo`}
                  fill
                  className="object-contain"
                  sizes="160px"
                />
              </div>
              <span className="font-semibold text-brand-purple-deep text-xs text-center leading-tight">
                {brand.name}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${brand.tag}`}>
                {brand.category}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-gray-400 mt-8"
        >
          Qualitätsprodukte für langlebige Lösungen — verlässlich verbaut, fachgerecht installiert.
        </motion.p>
      </div>
    </section>
  )
}
