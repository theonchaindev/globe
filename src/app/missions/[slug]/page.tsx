import { notFound } from "next/navigation";
import { MISSIONS } from "@/lib/data";
import MissionClient from "./MissionClient";

export function generateStaticParams() {
  return MISSIONS.map((m) => ({ slug: m.slug }));
}

export default async function MissionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mission = MISSIONS.find((m) => m.slug === slug);
  if (!mission) notFound();
  return <MissionClient mission={mission} />;
}
