import type { Metadata } from "next";
import { DiscoverFlow } from "@/components/discover/discover-flow";

export const metadata: Metadata = {
  title: "Discover",
  description: "Describe what you want to buy and get a personalised, evidence-based recommendation."
};

export default function DiscoverPage() {
  return <DiscoverFlow />;
}
