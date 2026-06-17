"use client";

import { Dashboard } from "@/components/dashboard";
import { TopNav } from "@/components/top-nav";

export default function BuyerPage() {
  return (
    <>
      <TopNav mode="buyer" onRefresh={() => window.location.reload()} />
      <Dashboard isAdmin={false} />
    </>
  );
}
