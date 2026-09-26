"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myBusinesses, setMyBusinesses] = useState<any[]>([]);
    const [editingBusiness, setEditingBusiness] = useState<any>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<any>(null);

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
          className="border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">{b.name}</h3>
            <p className="text-xs text-slate-500">
              {b.category} · {b.region}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingBusiness(b)}
              className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setDeletingBusiness(b)}
              className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
            >
              🗑️ Delete
            </button>
          </div>
        </div> 
              ))}
            </div>
          )}
        </div>
      </div>
      
        {/* Edit Business Modal */}
        {editingBusiness && (
          <EditBusinessModal
            business={editingBusiness}
            onClose={() => setEditingBusiness(null)}
            onSaved={() => {
              setEditingBusiness(null);
              // Reload businesses
              if (user) {
                supabase
                  .from("businesses")
                  .select("*")
                  .eq("owner_id", user.id)
                  .order("created_at", { ascending: false })
                  .then(({ data }) => setMyBusinesses(data || []));
              }
            }}
          />
        )}
    </main>
  );
}

// ---------- Edit Business Modal ----------
function EditBusinessModal({
  business,
  onClose,
  onSaved,
}: {
  business: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(business.name || "");
  const [category, setCategory] = useState(business.category || "Boutique");
  const [region, setRegion] = useState(business.region || "Westlands");
  const [phone, setPhone] = useState(business.phone || "");
  const [tagline, setTagline] = useState(business.tagline || "");
  const [services, setServices] = useState(
    (business.services || []).join(", ")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const servicesArray = services
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        name,
        category,
        region,
        phone,
        tagline,
        services: servicesArray,
      })
      .eq("id", business.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onSaved();
  };

  const CATEGORIES = [
    "Boutique", "Salon", "Showroom", "Restaurant", "Café",
    "Furniture", "Electronics", "Massage", "Nail Parlour",
    "Car Services", "Wines & Spirits", "Hardware",
  ];

  const NAIROBI_REGIONS = [
    "Westlands", "Dagoretti North", "Dagoretti South", "Kibra", "Langata",
    "Starehe", "Kamukunji", "Mathare", "Makadara", "Embakasi West",
    "Embakasi Central", "Embakasi North", "Embakasi East", "Embakasi South",
    "Roysambu", "Kasarani", "Ruaraka",
  ];

  const KIAMBU_REGIONS = [
    "Kikuyu", "Kabete", "Kiambu", "Ruiru", "Juja", "Thika",
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Edit Business
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Business name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Nairobi">
                  {NAIROBI_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
                <optgroup label="Kiambu">
                  {KIAMBU_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              WhatsApp / Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Services (comma-separated)
            </label>
            <input
              type="text"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}