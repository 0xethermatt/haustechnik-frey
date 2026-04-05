import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Replicate from "replicate";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const TRAINING_DIR = join(process.cwd(), "training-data");
const IMAGES_DIR = join(TRAINING_DIR, "images");

function ensureDirs() {
  if (!existsSync(TRAINING_DIR)) mkdirSync(TRAINING_DIR, { recursive: true });
  if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const STILE: Record<string, string> = {
  modern:
    "modern minimalist German bathroom renovation, large format light gray ceramic tiles 60x120cm, floating white vanity with integrated sink, backlit LED mirror, recessed ceiling spotlights, chrome fittings, walk-in glass shower with frameless door, clean lines, photorealistic interior photography, southern Germany style",
  warm: "warm natural German bathroom renovation, large format beige sand ceramic tiles 60x120cm, floating vanity with natural oak wood front, warm indirect LED lighting under vanity, walk-in glass shower, cozy minimalist design, photorealistic interior photography, southern Germany style",
  dunkel:
    "dark dramatic German bathroom renovation, large format anthracite dark ceramic tiles 60x120cm, floating dark vanity with matte black fittings, indirect LED strip lighting, walk-in glass shower with black frame, bold design, photorealistic interior photography, southern Germany style",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const stil = (formData.get("stil") as string) || "modern";
    const consent = true; // Bilder werden immer intern gespeichert
    const sessionId = randomBytes(8).toString("hex");

    if (!file) {
      return NextResponse.json({ error: "Kein Bild hochgeladen" }, { status: 400 });
    }

    // Bild in Base64 umwandeln
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";

    // Schritt 1: Claude analysiert das Bild
    const analysis = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: base64 },
            },
            {
              type: "text",
              text: `Analyze this bathroom photo and extract strict placement rules for an AI renovation generator.
Answer in English, using exactly this format:

EXTERIOR_WALLS: [which walls have windows - these walls must NEVER receive new fixtures]
STRUCTURAL: [sloped ceiling, beams or other fixed elements that cannot change]
PRESENT_FIXTURES: [list ONLY fixtures actually visible: e.g. "sink, shower" - be exact]
ABSENT_FIXTURES: [list fixtures NOT visible: e.g. "toilet, bathtub" - these must NOT be added]
TOILET_WALL: [which wall the toilet is on, or "none - no toilet in image"]
SINK_WALL: [which wall the sink is on, or "none"]
SHOWER_WALL: [which wall the shower is on, or "none"]
CONSTRAINTS: [strict rules: keep all existing fixtures on their current walls, never add fixtures not in original, exterior walls with windows stay completely free]

Be precise and short.`,
            },
          ],
        },
      ],
    });

    const rulesRaw = (analysis.content[0] as { text: string }).text;
    let constraints = "";
    let presentFixtures = "";
    let absentFixtures = "";
    for (const line of rulesRaw.split("\n")) {
      if (line.startsWith("CONSTRAINTS:")) {
        constraints = line.replace("CONSTRAINTS:", "").trim();
      }
      if (line.startsWith("PRESENT_FIXTURES:")) {
        presentFixtures = line.replace("PRESENT_FIXTURES:", "").trim();
      }
      if (line.startsWith("ABSENT_FIXTURES:")) {
        absentFixtures = line.replace("ABSENT_FIXTURES:", "").trim();
      }
    }

    // Schritt 2: Flux Depth Pro generiert das neue Bild
    const stilDesc = STILE[stil] || STILE.modern;
    const absentRule = absentFixtures
      ? `NEVER ADD these fixtures which are NOT in the original photo: ${absentFixtures}.`
      : "";
    const presentRule = presentFixtures
      ? `Only renovate the existing fixtures already present: ${presentFixtures}.`
      : "";
    const prompt = `${stilDesc}. ABSOLUTE RULES: ${presentRule} ${absentRule} ${constraints} Never add new plumbing fixtures not visible in the original. Do not place any object on walls with windows. Only change surfaces, tiles, materials and lighting. No water, no pools.`;

    // Bild als Data URL für Replicate
    const imageDataUrl = `data:${mimeType};base64,${base64}`;

    const output = await replicate.run(
      "black-forest-labs/flux-depth-pro:0e370dce5fdf15aa8b5fe2491474be45628756e8fba97574bfb3bcab46d09fff" as `${string}/${string}:${string}`,
      {
        input: {
          control_image: imageDataUrl,
          prompt,
          guidance: 28,
          steps: 50,
          output_format: "jpg",
          prompt_upsampling: true,
        },
      }
    );

    const resultUrl = Array.isArray(output) ? output[0] : output;

    // Bilder speichern wenn Einwilligung gegeben
    if (consent) {
      try {
        ensureDirs();
        const ts = Date.now();
        // Originalbild speichern
        const origExt = mimeType.split("/")[1] || "jpg";
        writeFileSync(join(IMAGES_DIR, `${sessionId}_${ts}_${stil}_before.${origExt}`), buffer);
        // Generiertes Bild herunterladen & speichern
        const genRes = await fetch(String(resultUrl));
        const genBuf = Buffer.from(await genRes.arrayBuffer());
        writeFileSync(join(IMAGES_DIR, `${sessionId}_${ts}_${stil}_after.jpg`), genBuf);
      } catch (saveErr) {
        console.error("Bild-Speichern fehlgeschlagen:", saveErr);
        // Nicht kritisch – weiter ohne Fehler
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: String(resultUrl),
      analysis: rulesRaw,
      sessionId,
    });
  } catch (error) {
    console.error("BadGenerator Error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Generierung. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
