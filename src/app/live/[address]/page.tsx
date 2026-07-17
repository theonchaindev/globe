import LiveMissionClient from "./LiveMissionClient";

export default async function LiveMissionPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <LiveMissionClient address={address} />;
}
