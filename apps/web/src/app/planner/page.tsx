"use client";

import dynamic from "next/dynamic";

const PlannerCanvas = dynamic(() => import("@/components/PlannerCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-950">
      <p className="text-gray-500">Loading canvas...</p>
    </div>
  ),
});

export default function PlannerPage() {
  return (
    <div className="w-full h-screen">
      <PlannerCanvas />
    </div>
  );
}