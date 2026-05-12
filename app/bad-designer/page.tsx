"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ChevronDown, ChevronUp, X } from "lucide-react";

const STILE = [
  {
    id: "modern",
    label: "Modern",
    desc: "Klare Linien, helle Fliesen",
    gradient: "from-slate-300 to-slate-500",
  },
  {
    id: "warm",
    label: "Warm",
    desc: "Beige · Holz · Gemütlich",
    gradient: "from-amber-200 to-amber-500",
  },
  {
    id: "dunkel",
    label: "Dunkel",
    desc: "Anthrazit · Dramatisch · Bold",
    gradient: "from-zinc-500 to-zinc-800",
  },
  {
    id: "minimalistisch",
    label: "Minimalistisch",
    desc: "Weniger ist mehr, puristisch",
    gradient: "from-gray-100 to-gray-300",
  },
  {
    id: "landhaus",
    label: "Landhaus",
    desc: "Stein · Holz · Natürlich",
    gradient: "from-stone-300 to-stone-500",
  },
  {
    id: "industrial",
    label: "Industrial",
    desc: "Beton · Schwarz · Roh",
    gradient: "from-neutral-500 to-neutral-800",
  },
];

async function fixOrientation(file: File): Promise<{ file: File; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const fixed = new File([blob!], file.name, { type: "image/jpeg" });
        resolve({ file: fixed, preview: canvas.toDataURL("image/jpeg", 0.92) });
      },
      "image/jpeg",
      0.92
    );
  });
}

interface UploadedImage {
  file: File;
  preview: string;
}

export default function BadDesignerPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [stil, setStil] = useState("modern");
  const [weitereWuensche, setWeitereWuensche] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "result">("upload");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = 4 - images.length;
    if (remaining <= 0) return;
    const toProcess = arr.slice(0, remaining);
    const processed = await Promise.all(
      toProcess
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => fixOrientation(f))
    );
    setImages((prev) => [...prev, ...processed]);
    setResult(null);
    setError(null);
    setValidationError(null);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleGenerate = async () => {
    if (images.length === 0) {
      setValidationError("Bitte laden Sie zuerst mindestens ein Foto hoch.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setValidationError(null);

    try {
      const formData = new FormData();
      images.forEach((img) => formData.append("image", img.file));
      formData.append("stil", stil);
      formData.append("weitereWuensche", weitereWuensche);

      const res = await fetch("/api/bad-designer", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      setResult(data.imageUrl);
      setSessionId(data.sessionId);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImages([]);
    setResult(null);
    setSessionId(null);
    setError(null);
    setStep("upload");
    setWeitereWuensche("");
    setDetailsOpen(false);
    setValidationError(null);
  };

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-brand-cream">
        {/* Hero */}
        <div className="bg-hero-gradient pt-28 pb-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm font-medium rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
              KI-Badplaner — kostenlos & unverbindlich
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              So könnte Ihr Bad aussehen
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Foto hochladen — KI renoviert Ihr Badezimmer in Sekunden.
              Kostenlos, unverbindlich, sofort.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">
          {step === "upload" && (
            <div className="space-y-6">

              {/* Step 1: Upload */}
              <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-brand-purple text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <h2 className="text-lg font-bold text-brand-purple-deep">
                    1–4 Fotos Ihres Bades
                  </h2>
                </div>

                {/* Thumbnails */}
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {images.map((img, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={img.preview}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Foto entfernen"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {images.length < 4 && (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-purple hover:bg-brand-purple/5 transition-all flex items-center justify-center text-gray-400 hover:text-brand-purple text-xs font-medium"
                      >
                        + Foto
                      </button>
                    )}
                  </div>
                )}

                {/* Drop zone */}
                {images.length === 0 && (
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 border-gray-200 hover:border-brand-purple hover:bg-brand-purple/5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-brand-purple-deep font-semibold mb-1">
                      Fotos hier ablegen oder auswählen
                    </p>
                    <p className="text-gray-400 text-sm">
                      JPG · PNG · HEIC · max. 15 MB pro Foto
                    </p>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Tips */}
                <div className="mt-4 bg-brand-warm rounded-xl px-4 py-3 border border-brand-purple/10">
                  <p className="text-xs font-semibold text-brand-purple-deep mb-2">📸 Tipps für beste Ergebnisse</p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[
                      "Gerader Blick, Stehposition",
                      "Ganzes Bad sichtbar",
                      "Gutes Licht, keine Unschärfe",
                      "Keine erkennbaren Personen",
                    ].map((tip) => (
                      <li key={tip} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="text-green-500">✓</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Privacy */}
                <div className="mt-3 flex items-start gap-2.5 bg-brand-warm rounded-xl px-4 py-3 border border-brand-purple/10">
                  <svg className="w-4 h-4 text-brand-purple mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <span className="font-semibold text-brand-purple-deep">Ihr Foto bleibt privat.</span>{" "}
                    Das Bild wird zur Generierung der Vorschau sowie intern zur Qualitätsverbesserung genutzt. Es wird nicht veröffentlicht oder weitergegeben.{" "}
                    <Link href="/datenschutz" className="underline hover:text-brand-purple transition-colors">
                      Datenschutzerklärung
                    </Link>
                  </p>
                </div>
              </div>

              {/* Step 2: Style */}
              <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-brand-purple text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <h2 className="text-lg font-bold text-brand-purple-deep">
                    Wunschstil wählen
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {STILE.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStil(s.id)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                        stil === s.id
                          ? "border-brand-purple shadow-purple-glow bg-brand-purple/5"
                          : "border-gray-200 hover:border-brand-purple/40 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`h-12 rounded-lg bg-gradient-to-br ${s.gradient} mb-3`} />
                      <p className="font-semibold text-brand-purple-deep text-sm">{s.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.desc}</p>
                      {stil === s.id && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-brand-purple rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Details anpassen */}
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setDetailsOpen(!detailsOpen)}
                    className="flex items-center gap-2 text-sm font-semibold text-brand-purple-deep hover:text-brand-purple transition-colors"
                  >
                    {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Details anpassen
                  </button>

                  {detailsOpen && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-brand-purple-deep mb-2">
                        Weitere Wünsche <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={weitereWuensche}
                        onChange={(e) => setWeitereWuensche(e.target.value)}
                        placeholder="z.B. freistehende Badewanne, dunkle Fliesen, Doppelwaschtisch, Regendusche …"
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-purple resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  {validationError}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                  !loading
                    ? "bg-brand-orange hover:bg-brand-orange-dark text-white shadow-orange-glow hover:shadow-none"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ihr Bad wird renoviert …
                  </span>
                ) : (
                  "Bad visualisieren"
                )}
              </button>

              {loading && (
                <div className="bg-brand-warm rounded-xl p-5 text-center border border-brand-purple/10">
                  <p className="text-brand-purple font-semibold mb-1">
                    Fertig in ca. 30 Sekunden
                  </p>
                  <p className="text-gray-500 text-sm">
                    Die KI analysiert Ihren Raum und generiert das renovierte Design.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <p className="text-center text-xs text-gray-400">
                Die Visualisierung dient als Inspiration — kein verbindliches Angebot.{" "}
                <Link href="/datenschutz" className="underline hover:text-brand-purple transition-colors">
                  Datenschutz
                </Link>
              </p>
            </div>
          )}

          {step === "result" && result && (
            <div className="space-y-6">
              {/* Before / After */}
              <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
                <h2 className="text-2xl font-bold text-brand-purple-deep text-center mb-6">
                  Ihr renoviertes Bad
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Vorher</p>
                    <div className="relative group cursor-zoom-in" onClick={() => setLightbox(images[0].preview)}>
                      <img src={images[0].preview} alt="Vorher" className="w-full rounded-xl object-cover aspect-[4/3]" />
                      <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                          <svg className="w-5 h-5 text-brand-purple-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-purple mb-2">
                      Nachher · {STILE.find((s) => s.id === stil)?.label}
                    </p>
                    <div className="relative group cursor-zoom-in" onClick={() => setLightbox(result)}>
                      <img src={result} alt="Nachher" className="w-full rounded-xl object-cover aspect-[4/3]" />
                      <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                          <svg className="w-5 h-5 text-brand-purple-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-hero-gradient rounded-2xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-2">Gefällt Ihnen was Sie sehen?</h3>
                <p className="text-white/70 mb-6 max-w-sm mx-auto">
                  Wir setzen Ihre Badrenovierung professionell um — von der Planung bis zur Fertigstellung.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/#kontakt"
                    className="bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-orange-glow hover:shadow-none"
                  >
                    Jetzt Beratung anfragen
                  </Link>
                  <button
                    onClick={handleReset}
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl transition-all"
                  >
                    Neues Foto ausprobieren
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
            onClick={() => setLightbox(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightbox}
            alt="Vergrößert"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </>
  );
}
