import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

const TRAINING_DIR = join(process.cwd(), "training-data");
const FEEDBACK_FILE = join(TRAINING_DIR, "feedback.jsonl");
const IMAGES_DIR = join(TRAINING_DIR, "images");

function ensureDirs() {
  if (!existsSync(TRAINING_DIR)) mkdirSync(TRAINING_DIR, { recursive: true });
  if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    ensureDirs();

    const body = await req.json();
    const {
      sessionId,
      rating,       // 1–5
      comment,      // optional string
      stil,
      liked,        // boolean shorthand
    } = body;

    if (!sessionId || !rating) {
      return NextResponse.json({ error: "sessionId und rating erforderlich" }, { status: 400 });
    }

    const entry = {
      sessionId,
      rating: Number(rating),
      comment: comment || "",
      stil: stil || "",
      liked: liked ?? rating >= 4,
      timestamp: new Date().toISOString(),
    };

    appendFileSync(FEEDBACK_FILE, JSON.stringify(entry) + "\n", "utf8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback Error:", error);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}

export async function GET() {
  try {
    ensureDirs();

    if (!existsSync(FEEDBACK_FILE)) {
      return NextResponse.json({ entries: [], count: 0, avgRating: null });
    }

    const raw = readFileSync(FEEDBACK_FILE, "utf8").trim();
    if (!raw) return NextResponse.json({ entries: [], count: 0, avgRating: null });

    const entries = raw.split("\n").map((line) => JSON.parse(line));
    const avg = entries.reduce((s, e) => s + e.rating, 0) / entries.length;

    return NextResponse.json({
      entries,
      count: entries.length,
      avgRating: Math.round(avg * 10) / 10,
    });
  } catch (error) {
    console.error("Feedback GET Error:", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
