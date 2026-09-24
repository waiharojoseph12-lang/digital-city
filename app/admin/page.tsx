"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const NAIROBI_REGIONS = [
  "Westlands", "Dagoretti North", "Dagoretti South", "Kibra", "Langata",
  "Starehe", "Kamukunji", "Mathare", "Makadara", "Embakasi West",
  "Embakasi Central", "Embakasi North", "Embakasi East", "Embakasi South",
  "Roysambu", "Kasarani", "Ruaraka",
];

const KIAMBU_REGIONS = [
  "Kikuyu", "Kabete", "Kiambu", "Ruiru", "Juja", "Thika",
];

const CATEGORIES = [
  "Boutique", "Salon", "Showroom", "Restaurant", "Café",
  "Furniture", "Electronics", "Massage", "Nail Parlour",
  "Car Services", "Wines & Spirits", "Hardware",
];

export default function AdminPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [region, setRegion] = useState(NAIROBI_REGIONS[0]);
  const [phone, setPhone] = useState("");
  const [tagline, setTagline] = useState("");
  const [services, setServices] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserEmail(session.user.email ?? null);
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const servicesArray = services
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const { error: insertError } = await supabase.from("businesses").insert({
      name,
      category,
      region,
      phone,
      tagline,
      image: imageUrl || null,
      services: servicesArray,
      is_paid: true,
      paid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage(`✅ "${name}" was added to ${region}!`);

    // Reset form
    setName("");
    setPhone("");
    setTagline("");
    setServices("");
    setImageUrl("");
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Checking login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin</h1>
            <p className="text-sm text-slate-500">
              Logged in as {userEmail}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-900 underline"
          >
            Log out
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Add a new business
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Business name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Wakalucy Fish Palace"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category *
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
                  Region *
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
                WhatsApp / Phone *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="254712345678"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Format: 254XXXXXXXXX (no +, no spaces)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Fresh fish daily"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Services offered
              </label>
              <input
                type="text"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g. Fried fish, Ugali, Takeaway"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Separate with commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Paste a photo link (for now)
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {message && (
              <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add business"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}