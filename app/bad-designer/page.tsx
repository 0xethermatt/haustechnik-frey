"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const STILE = [
  {
    id: "modern",
    label: "Modern",
    desc: "Grau · Clean · Minimalistisch",
    gradient: "from-slate-400 to-slate-600",
  },
  {
    id: "warm",
    label: "Warm",
    desc: "Beige · Holz · Gemütlich",
    gradient: "from-amber-300 to-amber-500",
  },
  {
    id: "dunkel",
    label: "Dunkel",
    desc: "Anthrazit · Dramatisch · Bold",
    gradient: "from-zinc-500 to-zinc-800",
  },
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
          aria-label={`${star} Sterne`}
        >
          <svg
            className={`w-9 h-9 transition-colors ${
              star <= (hovered || value)
                ? "text-brand-orange"
                : "text-gray-200"
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Nicht überzeugend",
  2: "Verbesserungswürdig",
  3: "In Ordnung",
  4: "Gut gelungen",
  5: "Begeistert mich!",
};

export default function BadDesignerPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stil, setStil] = useState("modern");
  const consent = false;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "result">("upload");
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Feedback state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("stil", stil);
      formData.append("consent", String(consent));

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

  const handleFeedback = async () => {
    if (!rating || !sessionId) return;
    setFeedbackLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rating, comment, stil }),
      });
      setFeedbackSent(true);
    } catch {
      // silent
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setSessionId(null);
    setError(null);
    setStep("upload");
    setRating(0);
    setComment("");
    setFeedbackSent(false);
    if (fileRef.current) fileRef.current.value = "";
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
                    Foto Ihres Badezimmers hochladen
                  </h2>
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    preview
                      ? "border-brand-purple bg-brand-purple/5"
                      : "border-gray-200 hover:border-brand-purple hover:bg-brand-purple/5"
                  }`}
                >
                  {preview ? (
                    <div>
                      <img
                        src={preview}
                        alt="Vorschau"
                        className="max-h-56 mx-auto rounded-lg object-contain"
                      />
                      <p className="mt-3 text-sm text-brand-purple font-medium">
                        ✓ Foto ausgewählt — klicken zum Ändern
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-brand-purple-deep font-semibold mb-1">
                        Badezimmerfoto hier ablegen
                      </p>
                      <p className="text-gray-400 text-sm">
                        oder klicken zum Auswählen · JPG, PNG · max. 10 MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Photo tips */}
                <div className="mt-4 bg-brand-warm rounded-xl px-4 py-3 border border-brand-purple/10">
                  <p className="text-xs font-semibold text-brand-purple-deep mb-2">📸 Tipps für beste Ergebnisse</p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[
                      "Gerader Blick, Stehposition",
                      "Ganzes Bad sichtbar",
                      "Gutes Licht, keine Unschärfe",
                      "Kein Fisheye / Weitwinkel",
                    ].map((tip) => (
                      <li key={tip} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="text-green-500">✓</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Privacy note */}
                <div className="mt-3 flex items-start gap-2.5 bg-brand-warm rounded-xl px-4 py-3 border border-brand-purple/10">
                  <svg className="w-4 h-4 text-brand-purple mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <span className="font-semibold text-brand-purple-deep">Ihr Foto bleibt privat.</span>{" "}
                    Das Bild wird zur Generierung der Vorschau sowie intern zur Qualitätsverbesserung des KI-Badplaners genutzt. Es wird nicht veröffentlicht oder weitergegeben.{" "}
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
                      <div className={`h-14 rounded-lg bg-gradient-to-br ${s.gradient} mb-3`} />
                      <p className="font-semibold text-brand-purple-deep text-sm">{s.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
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
              </div>

              {/* CTA Button */}
              <button
                onClick={handleGenerate}
                disabled={!image || loading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                  image && !loading
                    ? "bg-brand-orange hover:bg-brand-orange-dark text-white shadow-orange-glow hover:shadow-none"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    KI renoviert Ihr Bad …
                  </span>
                ) : (
                  "Bad jetzt renovieren lassen"
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {loading && (
                <div className="bg-brand-warm rounded-xl p-5 text-center border border-brand-purple/10">
                  <p className="text-brand-purple font-semibold mb-1">
                    Bitte kurz warten — ca. 30–60 Sekunden
                  </p>
                  <p className="text-gray-500 text-sm">
                    Die KI analysiert Ihren Raum und generiert das renovierte Design.
                  </p>
                </div>
              )}
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
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                      Vorher
                    </p>
                    <div className="relative group cursor-zoom-in" onClick={() => setLightbox(preview!)}>
                      <img
                        src={preview!}
                        alt="Vorher"
                        className="w-full rounded-xl object-cover aspect-[4/3]"
                      />
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
                      <img
                        src={result}
                        alt="Nachher"
                        className="w-full rounded-xl object-cover aspect-[4/3]"
                      />
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

              {/* Feedback */}
              <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
                {!feedbackSent ? (
                  <>
                    <h3 className="text-lg font-bold text-brand-purple-deep mb-1">
                      Wie gefällt Ihnen das Ergebnis?
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                      Ihr Feedback hilft uns, die KI-Qualität zu verbessern.
                    </p>

                    <div className="flex flex-col items-center gap-3 mb-5">
                      <StarRating value={rating} onChange={setRating} />
                      {rating > 0 && (
                        <span className="text-sm font-medium text-brand-purple">
                          {RATING_LABELS[rating]}
                        </span>
                      )}
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Was hat Ihnen gefallen oder gefehlt? (optional)"
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-purple resize-none"
                    />

                    <button
                      onClick={handleFeedback}
                      disabled={!rating || feedbackLoading}
                      className={`mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                        rating && !feedbackLoading
                          ? "bg-brand-purple hover:bg-brand-purple-dark text-white"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {feedbackLoading ? "Wird gespeichert …" : "Bewertung abschicken"}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-bold text-brand-purple-deep">Vielen Dank!</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Ihr Feedback hilft uns, den KI-Badplaner zu verbessern.
                    </p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="bg-hero-gradient rounded-2xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-2">
                  Gefällt Ihnen was Sie sehen?
                </h3>
                <p className="text-white/70 mb-6 max-w-sm mx-auto">
                  Wir setzen Ihre Badrenovierung professionell um — von der
                  Planung bis zur Fertigstellung.
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
