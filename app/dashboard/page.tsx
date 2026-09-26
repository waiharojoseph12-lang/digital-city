"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myBusinesses, setMyBusinesses] = useState<any[]>([]);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Load user's businesses
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading businesses:", error);
      } else {
        setMyBusinesses(data || []);
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Business Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Logged in as {user?.email}
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="text-sm text-slate-600 hover:text-slate-900 underline"
          >
            Log out
          </button>
        </div>

        {/* My Businesses */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            My Businesses ({myBusinesses.length})
          </h2>

          {myBusinesses.length === 0 ? (
            <p className="text-slate-500 text-sm">
              You don&apos;t have any businesses yet.
            </p>
          ) : (
            <div className="space-y-3">
              {myBusinesses.map((b) => (
                <div
                  key={b.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-slate-800">{b.name}</h3>
                  <p className="text-xs text-slate-500">
                    {b.category} · {b.region}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}