import { NextRequest, NextResponse } from "next/server";

const images: Record<string, string> = {
  neko: "https://www.pref.kanagawa.jp/images/133970/neko.png",
  tank: "https://www.pref.kanagawa.jp/images/133970/tankneko.png",
  battle: "https://www.pref.kanagawa.jp/images/133970/battleneko.png",
  kimo: "https://www.pref.kanagawa.jp/images/133970/kimoneko.png",
  ushi: "https://www.pref.kanagawa.jp/images/133970/ushineko.png",
  bird: "https://www.pref.kanagawa.jp/images/133970/nekonotori.png",
  fish: "https://www.pref.kanagawa.jp/images/133970/nekofish.png",
  lizard: "https://www.pref.kanagawa.jp/images/133970/nekotokage.png",
  giant: "https://www.pref.kanagawa.jp/images/133970/kyoshinneko.png",
};

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("id") || "";
  const url = images[key];
  if (!url) return new NextResponse("not found", { status: 404 });

  const upstream = await fetch(url, { next: { revalidate: 86400 } });
  if (!upstream.ok) return new NextResponse("image fetch failed", { status: 502 });

  return new NextResponse(await upstream.arrayBuffer(), {
    headers: {
      "content-type": upstream.headers.get("content-type") || "image/png",
      "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
