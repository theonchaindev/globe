import type { Metadata } from "next";
import DocsClient from "./DocsClient";

export const metadata: Metadata = { title: "Documentation — GLOBAL" };

export default function DocsPage() {
  return <DocsClient />;
}
