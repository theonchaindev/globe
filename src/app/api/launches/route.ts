import { NextResponse } from "next/server";
import { findLaunch, insertLaunch, listLaunches, sanitize, verifyOnChain } from "@/lib/server/registry";

/** GET /api/launches — every mission on the active networks. ?id= for one. */
export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const launch = await findLaunch(id);
      return NextResponse.json({ launch });
    }
    return NextResponse.json({ launches: await listLaunches() });
  } catch (e) {
    console.error("[launches] GET failed", e);
    return NextResponse.json({ error: "registry unavailable" }, { status: 503 });
  }
}

/** POST /api/launches — register a mission after it's verified on-chain. */
export async function POST(request: Request) {
  let record;
  try {
    record = await verifyOnChain(sanitize(await request.json()));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "invalid launch" },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json({ launch: await insertLaunch(record) });
  } catch (e) {
    console.error("[launches] insert failed", e);
    return NextResponse.json({ error: "registry unavailable" }, { status: 503 });
  }
}
