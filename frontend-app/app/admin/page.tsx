"use client";

import { Dashboard } from "@/components/dashboard";
import { TopNav } from "@/components/top-nav";

export default function AdminPage() {
  return (
    <>
      <TopNav mode="admin" onRefresh={() => window.location.reload()} />
      <Dashboard isAdmin={true} />
    </>
  );
}
