import { NextRequest, NextResponse } from "next/server";

type Score = {
  id: string;
  nickname: string;
  score: number;
  count: number;
  height: number;
  createdAt: string;
};

const g = globalThis as typeof globalThis & { __nyankoTowerScores?: Score[] };
g.__nyankoTowerScores ??= [];

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function redisCommand(command: (string | number)[]) {
  const cfg = redisConfig();
  if (!cfg) return null;
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${cfg.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("ranking storage error");
  return (await res.json()).result;
}

function cleanNick(v: unknown) {
  return String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 16);
}

async function readScores(): Promise<Score[]> {
  const cfg = redisConfig();
  if (!cfg) return g.__nyankoTowerScores ?? [];
  const rows = (await redisCommand(["LRANGE", "nyanko:tower:scores", 0, 499])) as string[] | null;
  return (rows ?? []).map((s) => {
    try { return JSON.parse(s) as Score; } catch { return null; }
  }).filter((x): x is Score => !!x);
}

export async function GET() {
  try {
    const scores = await readScores();
    scores.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
    return NextResponse.json({ persistent: !!redisConfig(), scores: scores.slice(0, 50) });
  } catch {
    return NextResponse.json({ persistent: false, scores: (g.__nyankoTowerScores ?? []).slice(0, 50) });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const nickname = cleanNick(body.nickname);
  const score = Math.max(0, Math.floor(Number(body.score) || 0));
  const count = Math.max(0, Math.floor(Number(body.count) || 0));
  const height = Math.max(0, Math.floor(Number(body.height) || 0));

  if (!nickname) return NextResponse.json({ error: "ニックネームを入力してください" }, { status: 400 });
  const expected = count * 1000 + height * 10;
  if (count > 300 || height > 20000 || score !== expected) {
    return NextResponse.json({ error: "スコア値が不正です" }, { status: 400 });
  }

  const row: Score = {
    id: crypto.randomUUID(),
    nickname,
    score,
    count,
    height,
    createdAt: new Date().toISOString(),
  };

  try {
    if (redisConfig()) {
      await redisCommand(["LPUSH", "nyanko:tower:scores", JSON.stringify(row)]);
      await redisCommand(["LTRIM", "nyanko:tower:scores", 0, 499]);
    } else {
      g.__nyankoTowerScores!.push(row);
      g.__nyankoTowerScores!.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
      g.__nyankoTowerScores = g.__nyankoTowerScores!.slice(0, 500);
    }
    return NextResponse.json({ ok: true, persistent: !!redisConfig() });
  } catch {
    g.__nyankoTowerScores!.push(row);
    return NextResponse.json({ ok: true, persistent: false });
  }
}
