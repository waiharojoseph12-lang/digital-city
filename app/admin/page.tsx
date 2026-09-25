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
    const [adminTab, setAdminTab] = useState<"business" | "property">("business");
    const [pendingListings, setPendingListings] = useState<any[]>([]);
    const [approvedListings, setApprovedListings] = useState<any[]>([]);
    // Form state
    const [name, setName] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [region, setRegion] = useState(NAIROBI_REGIONS[0]);
    const [phone, setPhone] = useState("");
    const [tagline, setTagline] = useState("");
    const [services, setServices] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
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

    // Fetch pending listings
    const fetchPending = async () => {
        const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: false });
        if (error) {
            console.error("Error fetching pending listings:", error);
            return;
        }

        setPendingListings(data || []);
          };
        const fetchApproved = async () => {
            const { data, error } = await supabase
                .from("businesses")
                .select("*")
                .eq("status", "approved")
                .eq("is_paid", false)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching approved listings:", error);
                return;
            }

            setApprovedListings(data || []);
        };
        useEffect(() => {
            fetchPending();
            fetchApproved();
        }, []);

        const handleLogout = async () => {
            await supabase.auth.signOut();
            router.push("/login");
        };
        const handleApproval = async (
            id: string,
            newStatus: "approved" | "rejected"
        ) => {
            const { error } = await supabase
                .from("businesses")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) {
                alert(`Error: ${error.message}`);
                return;
            }

            fetchPending();
        };
  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase
      .from("businesses")
      .update({
        is_paid: true,
        paid_until: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    fetchApproved();
  };
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setSaving(true);
            setMessage(null);
            setError(null);
            // Upload photo if one was selected
            let finalImageUrl = imageUrl;
            if (imageFile) {
                const fileExt = imageFile.name.split(".").pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
                const filePath = `businesses/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("business-photos")
                    .upload(filePath, imageFile);

                if (uploadError) {
                    setSaving(false);
                    setError(`Upload failed: ${uploadError.message}`);
                    return;
                }

                const { data: urlData } = supabase.storage
                    .from("business-photos")
                    .getPublicUrl(filePath);

                finalImageUrl = urlData.publicUrl;
            }

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
                image: finalImageUrl || null,
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
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setAdminTab("business")}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition ${adminTab === "business"
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                🏪 Business
                            </button>
                            <button
                                type="button"
                                onClick={() => setAdminTab("property")}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition ${adminTab === "property"
                                        ? "bg-purple-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                🏠 Property
                            </button>
                        </div>

                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            Add a new {adminTab}
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
                                    Photo
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer border border-slate-300 rounded-lg"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    {imageFile ? `Selected: ${imageFile.name}` : "Choose a photo from your device"}
                                </p>

                                {imageFile && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={URL.createObjectURL(imageFile)}
                                        alt="Preview"
                                        className="mt-3 w-32 h-32 object-cover rounded-lg border border-slate-200"
                                    />
                                )}
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

                    {/* Pending Listings */}
                    {pendingListings.length > 0 && (
                        <div className="bg-white rounded-2xl shadow p-6 mt-8">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Pending Listings ({pendingListings.length})
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    New businesses awaiting approval
                                </p>
                            </div>

                            <div className="space-y-4">
                                {pendingListings.map((listing) => (
                                    <div
                                        key={listing.id}
                                        className="border border-slate-200 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-slate-800">
                                                        {listing.name}
                                                    </h3>
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                        Pending
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mb-2">
                                                    {listing.category} · {listing.region} ·{" "}
                                                    {listing.phone}
                                                </p>
                                                {listing.tagline && (
                                                    <p className="text-sm text-slate-600 mb-2">
                                                        {listing.tagline}
                                                    </p>
                                                )}
                                                {listing.services && listing.services.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {listing.services.map((s: string, i: number) => (
                                                            <span
                                                                key={i}
                                                                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                                                            >
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {listing.image && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={listing.image}
                                                        alt={listing.name}
                                                        className="w-24 h-24 object-cover rounded-lg border border-slate-200 mt-2"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleApproval(listing.id, "approved")}
                                                    className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => handleApproval(listing.id, "rejected")}
                                                    className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
                                                >
                                                    ✗ Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
        {/* Approved but Unpaid Listings */}
        {approvedListings.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                Approved — Awaiting Payment ({approvedListings.length})
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Mark as paid to make them visible on the map
              </p>
            </div>

            <div className="space-y-4">
              {approvedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">
                          {listing.name}
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Unpaid
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        {listing.category} · {listing.region} · {listing.phone}
                      </p>
                      {listing.tagline && (
                        <p className="text-sm text-slate-600 mb-2">
                          {listing.tagline}
                        </p>
                      )}
                      {listing.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.image}
                          alt={listing.name}
                          className="w-24 h-24 object-cover rounded-lg border border-slate-200 mt-2"
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleMarkPaid(listing.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
                      >
                        💰 Mark as Paid
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
                </div>
            </main>
        );
    }