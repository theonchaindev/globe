import { Suspense } from "react";
import ExploreClient from "./ExploreClient";

export const metadata = { title: "Explore Missions — GLOBAL" };

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreClient />
    </Suspense>
  );
}
