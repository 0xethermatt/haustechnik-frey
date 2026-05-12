'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, ZoomIn, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

interface Project {
  id: number
  title: string
  category: 'heizung' | 'sanitaer' | 'lueftung' | 'solar'
  categoryLabel: string
  categoryColor: string
  tagColor: string
  image: string
  imageAlt: string
}

const projects: Project[] = [
  {
    id: 2,
    title: 'Badsanierung mit Walk-in-Dusche',
    category: 'sanitaer',
    categoryLabel: 'Sanitär',
    categoryColor: 'text-brand-blue',
    tagColor: 'bg-brand-blue text-white',
    image: '/images/bad-1.jpg',
    imageAlt: 'Modernes Badezimmer mit Walk-in-Dusche — Haustechnik Frey',
  },
  {
    id: 3,
    title: 'Solarthermieanlage',
    category: 'solar',
    categoryLabel: 'Solar',
    categoryColor: 'text-brand-green',
    tagColor: 'bg-brand-green text-white',
    image: '/images/solar-3.jpg',
    imageAlt: 'Solarthermieanlage auf Hausdach — Haustechnik Frey',
  },
  {
    id: 4,
    title: 'Designer-Badezimmer',
    category: 'sanitaer',
    categoryLabel: 'Sanitär',
    categoryColor: 'text-brand-blue',
    tagColor: 'bg-brand-blue text-white',
    image: '/images/bad-4.jpg',
    imageAlt: 'Designer-Badezimmer — Badsanierung Langenau',
  },
  {
    id: 5,
    title: 'Fußbodenheizung Neubau',
    category: 'heizung',
    categoryLabel: 'Heizung',
    categoryColor: 'text-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/fussbodenheizung-3.jpg',
    imageAlt: 'Fußbodenheizung Installation — Haustechnik Frey',
  },
  {
    id: 6,
    title: 'Heizraum Komplettsanierung',
    category: 'heizung',
    categoryLabel: 'Heizung',
    categoryColor: 'text-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/heizraum-1.jpg',
    imageAlt: 'Heizraum — Haustechnik Frey Langenau',
  },
  {
    id: 7,
    title: 'Modernes Badezimmer',
    category: 'sanitaer',
    categoryLabel: 'Sanitär',
    categoryColor: 'text-brand-blue',
    tagColor: 'bg-brand-blue text-white',
    image: '/images/bad-5.jpg',
    imageAlt: 'Modernes Badezimmer — Badsanierung Langenau',
  },
  {
    id: 8,
    title: 'Solar + Wärmepumpe Kombination',
    category: 'solar',
    categoryLabel: 'Solar',
    categoryColor: 'text-brand-green',
    tagColor: 'bg-brand-green text-white',
    image: '/images/solar-2.jpg',
    imageAlt: 'Solarthermie kombiniert mit Wärmepumpe — Haustechnik Frey',
  },
  {
    id: 9,
    title: 'Wärmepumpe Außeneinheit',
    category: 'heizung',
    categoryLabel: 'Heizung',
    categoryColor: 'text-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/waermepumpe-2.jpg',
    imageAlt: 'Wärmepumpe Außeneinheit — Haustechnik Frey',
  },
  {
    id: 10,
    title: 'Barrierefreies Bad',
    category: 'sanitaer',
    categoryLabel: 'Sanitär',
    categoryColor: 'text-brand-blue',
    tagColor: 'bg-brand-blue text-white',
    image: '/images/bad-6.jpg',
    imageAlt: 'Barrierefreies Badezimmer — Haustechnik Frey Langenau',
  },
  {
    id: 12,
    title: 'Heizkörper Austausch',
    category: 'heizung',
    categoryLabel: 'Heizung',
    categoryColor: 'text-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/heizkoerper-4.jpg',
    imageAlt: 'Moderner Heizkörper — Haustechnik Frey Langenau',
  },
  {
    id: 13,
    title: 'Luxus-Bad Komplettbad',
    category: 'sanitaer',
    categoryLabel: 'Sanitär',
    categoryColor: 'text-brand-blue',
    tagColor: 'bg-brand-blue text-white',
    image: '/images/bad-7.jpg',
    imageAlt: 'Komplettbad — Haustechnik Frey Langenau',
  },
  {
    id: 14,
    title: 'Solarpanels Aufdachanlage',
    category: 'solar',
    categoryLabel: 'Solar',
    categoryColor: 'text-brand-green',
    tagColor: 'bg-brand-green text-white',
    image: '/images/solar-1.avif',
    imageAlt: 'Solar Aufdachanlage — Haustechnik Frey',
  },
  {
    id: 15,
    title: 'Heizungsverteilung & Rohrleitungen',
    category: 'heizung',
    categoryLabel: 'Heizung',
    categoryColor: 'text-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/heizraum-3.webp',
    imageAlt: 'Heizungsverteilung — Haustechnik Frey Langenau',
  },
  {
    id: 16,
    title: 'Luxus-Badezimmer mit freistehender Wanne',
    category: 'sanitaer',
    categoryLabel: 'Sanitär',
    categoryColor: 'text-brand-blue',
    tagColor: 'bg-brand-blue text-white',
    image: '/images/bad-5.jpeg',
    imageAlt: 'Luxusbad mit freistehender Wanne — Haustechnik Frey',
  },
  {
    id: 17,
    title: 'Pelletheizung Windhager — Komplettinstallation',
    category: 'heizung',
    categoryLabel: 'Heizung',
    categoryColor: 'text-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/pellets-2.jpg',
    imageAlt: 'Pelletheizung Windhager Installation — Haustechnik Frey',
  },
  {
    id: 18,
    title: 'Pelletlager & Heizsystem — 3D-Planung',
    category: 'heizung',
    categoryLabel: 'Heizung',
    categoryColor: 'text-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/pellets-1.jpg',
    imageAlt: 'Pelletlager Planung — Haustechnik Frey Langenau',
  },
  {
    id: 19,
    title: 'Gasheizung — Modernisierung',
    category: 'heizung',
    categoryLabel: 'Heizung',
    categoryColor: 'text-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/gasheizung-1.avif',
    imageAlt: 'Gasheizung Modernisierung — Haustechnik Frey Langenau',
  },
  {
    id: 20,
    title: 'Fußbodenheizung — Großflächige Verlegung',
    category: 'heizung',
    categoryLabel: 'Heizung',
    categoryColor: 'text-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/fussbodenheizung-4.jpg',
    imageAlt: 'Fußbodenheizung Verlegung — Haustechnik Frey Langenau',
  },
]

const INITIAL_COUNT = 6

const filters = [
  { key: 'alle', label: 'Alle Projekte' },
  { key: 'heizung', label: 'Heizung' },
  { key: 'sanitaer', label: 'Sanitär' },
  { key: 'lueftung', label: 'Lüftung' },
  { key: 'solar', label: 'Solar' },
] as const

type FilterKey = 'alle' | 'heizung' | 'sanitaer' | 'lueftung' | 'solar'

export default function Projects() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('alle')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const filtered =
    activeFilter === 'alle'
      ? projects
      : projects.filter((p) => p.category === activeFilter)

  const visibleProjects =
    showAll || filtered.length <= INITIAL_COUNT
      ? filtered
      : filtered.slice(0, INITIAL_COUNT)

  const handleFilterChange = (key: FilterKey) => {
    setActiveFilter(key)
    setShowAll(false)
  }

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const prevImage = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + visibleProjects.length) % visibleProjects.length)
  }
  const nextImage = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % visibleProjects.length)
  }

  return (
    <section
      id="projekte"
      className="py-12 sm:py-16 lg:py-24 bg-brand-cream"
      aria-labelledby="projekte-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            Unsere Arbeit
          </span>
          <h2
            id="projekte-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep"
          >
            Referenzprojekte
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-gray-500 max-w-xl mx-auto">
            Ein Blick auf abgeschlossene Projekte in Langenau und Umgebung.
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex overflow-x-auto pb-2 sm:flex-wrap sm:justify-center gap-2 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
          role="group"
          aria-label="Projekte filtern"
        >
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleFilterChange(filter.key)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple ${
                activeFilter === filter.key
                  ? 'bg-brand-purple text-white shadow-purple-glow'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-purple/40 hover:text-brand-purple'
              }`}
              aria-pressed={activeFilter === filter.key}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {visibleProjects.map((project, index) => (
              <motion.button
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => openLightbox(index)}
                className="group relative rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
                style={{ aspectRatio: '4 / 3' }}
                aria-label={`${project.title} — ${project.categoryLabel} ansehen`}
              >
                <Image
                  src={project.image}
                  alt={project.imageAlt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-purple-deep/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full self-start mb-2 ${project.tagColor}`}>
                    {project.categoryLabel}
                  </span>
                  <h3 className="text-white font-semibold text-sm leading-tight">
                    {project.title}
                  </h3>
                </div>
                {/* Zoom icon */}
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ZoomIn className="w-4 h-4 text-white" />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Expand / Collapse */}
        {filtered.length > INITIAL_COUNT && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex justify-center mt-10"
          >
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-brand-purple text-brand-purple font-semibold text-sm hover:bg-brand-purple hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            >
              {showAll ? (
                <>Weniger anzeigen <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Alle {filtered.length} Projekte anzeigen <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={`Bild: ${visibleProjects[lightboxIndex]?.title}`}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 rounded-full p-3 sm:p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white z-10"
              aria-label="Lightbox schließen"
            >
              <X className="w-7 h-7 sm:w-6 sm:h-6" />
            </button>

            {/* Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage() }}
              className="absolute left-4 text-white/80 hover:text-white bg-white/10 rounded-full p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Vorheriges Bild"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-4xl w-full max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative" style={{ aspectRatio: '16 / 9' }}>
                <Image
                  src={visibleProjects[lightboxIndex].image}
                  alt={visibleProjects[lightboxIndex].imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                />
              </div>
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${visibleProjects[lightboxIndex].tagColor} mb-2 inline-block`}>
                  {visibleProjects[lightboxIndex].categoryLabel}
                </span>
                <h3 className="text-white font-serif font-bold text-xl">
                  {visibleProjects[lightboxIndex].title}
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  {lightboxIndex + 1} / {visibleProjects.length}
                </p>
              </div>
            </motion.div>

            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); nextImage() }}
              className="absolute right-4 text-white/80 hover:text-white bg-white/10 rounded-full p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Nächstes Bild"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
