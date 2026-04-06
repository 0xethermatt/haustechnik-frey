import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, rating, comment, stil, liked } = body;

    if (!sessionId || !rating) {
      return NextResponse.json({ error: "sessionId und rating erforderlich" }, { status: 400 });
    }

    const entry = {
      sessionId,
      rating: Number(rating),
      comment: comment || "",
      stil: stil || "",
      liked: liked ?? Number(rating) >= 4,
      timestamp: new Date().toISOString(),
      source: "frey",
    };

    await put(
      `training/feedback/${sessionId}_${Date.now()}.json`,
      JSON.stringify(entry),
      { access: "public", contentType: "application/json", addRandomSuffix: false }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback Error:", error);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "training/feedback/" });

    const entries = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url);
          return await res.json();
        } catch {
          return null;
        }
      })
    );

    const valid = entries.filter(Boolean);
    const avg = valid.length > 0
      ? valid.reduce((s: number, e: { rating: number }) => s + e.rating, 0) / valid.length
      : null;

    return NextResponse.json({
      entries: valid.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      count: valid.length,
      avgRating: avg ? Math.round(avg * 10) / 10 : null,
    });
  } catch (error) {
    console.error("Feedback GET Error:", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
