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
    "Kikuyu", "Kabete", "Kiambu", "Ruiru", "Juja", "Thika", "Kamakis", "Mwihoko"
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
    const [adminTab, setAdminTab] = useState<"business" | "property" | "queue">("business");
    const [pendingListings, setPendingListings] = useState<any[]>([]);
    const [approvedListings, setApprovedListings] = useState<any[]>([]);
    const [pendingProperties, setPendingProperties] = useState<any[]>([]);
    const [approvedProperties, setApprovedProperties] = useState<any[]>([]);
    const [queueListings, setQueueListings] = useState<any[]>([]);
    
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

    const fetchPending = async () => {
        const { data, error } = await supabase.from("businesses").select("*").eq("status", "pending").order("created_at", { ascending: false });
        if (error) console.error(error);
        setPendingListings(data || []);
    };

    const fetchApproved = async () => {
        const { data, error } = await supabase.from("businesses").select("*").eq("status", "approved").eq("is_paid", false).order("created_at", { ascending: false });
        if (error) console.error(error);
        setApprovedListings(data || []);
    };

    const fetchPendingProperties = async () => {
        const { data, error } = await supabase.from("properties").select("*").eq("status", "pending").order("created_at", { ascending: false });
        if (error) console.error(error);
        setPendingProperties(data || []);
    };

    const fetchApprovedProperties = async () => {
        const { data, error } = await supabase.from("properties").select("*").eq("status", "approved").eq("is_paid", false).order("created_at", { ascending: false });
        if (error) console.error(error);
        setApprovedProperties(data || []);
    };

    const fetchQueue = async () => {
        const { data: leadsData, error: leadsError } = await supabase.from("leads").select("*").eq("action", "360").eq("source", "signup_request").order("created_at", { ascending: false });
        if (leadsError || !leadsData || leadsData.length === 0) {
            setQueueListings([]);
            return;
        }
        const ids = leadsData.map(l => l.listing_id);
        const { data: bizData, error: bizError } = await supabase.from("businesses").select("id, name, phone, region").in("id", ids);
        if (bizError) return;
        setQueueListings(leadsData.map(lead => ({ ...lead, businesses: bizData?.find(b => b.id === lead.listing_id) || null })));
    };

    useEffect(() => {
        fetchPending();
        fetchApproved();
        fetchPendingProperties();
        fetchApprovedProperties();
        fetchQueue();
    }, []);

    const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

    const handleApproval = async (id: string, newStatus: "approved" | "rejected") => {
        const { error } = await supabase.from("businesses").update({ status: newStatus }).eq("id", id);
        if (error) alert(error.message); else fetchPending();
    };

    const handlePropertyApproval = async (id: string, newStatus: "approved" | "rejected") => {
        const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", id);
        if (error) alert(error.message); else fetchPendingProperties();
    };

    const handleMarkPaid = async (id: string) => {
        const { error } = await supabase.from("businesses").update({ is_paid: true, paid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).eq("id", id);
        if (error) alert(error.message); else fetchApproved();
    };

    const handlePropertyMarkPaid = async (id: string) => {
        const { error } = await supabase.from("properties").update({ is_paid: true, paid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).eq("id", id);
        if (error) alert(error.message); else fetchApprovedProperties();
    };

    const handleVerifyBusiness = async (id: string, current: boolean) => {
        const { error } = await supabase.from("businesses").update({ is_verified: !current }).eq("id", id);
        if (error) alert(error.message); else { fetchPending(); fetchApproved(); }
    };

    const handleVerifyProperty = async (id: string, current: boolean) => {
        const { error } = await supabase.from("properties").update({ is_verified: !current }).eq("id", id);
        if (error) alert(error.message); else { fetchPendingProperties(); fetchApprovedProperties(); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);
        let finalImageUrl = imageUrl;
        if (imageFile) {
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${imageFile.name.split(".").pop()}`;
            const { error: uploadError } = await supabase.storage.from("business-photos").upload(`businesses/${fileName}`, imageFile);
            if (uploadError) { setSaving(false); setError(uploadError.message); return; }
            const { data: urlData } = supabase.storage.from("business-photos").getPublicUrl(`businesses/${fileName}`);
            finalImageUrl = urlData.publicUrl;
        }
        const servicesArray = services.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
        const { error: insertError } = await supabase.from("businesses").insert({
            name, category, region, phone, tagline, image: finalImageUrl || null, services: servicesArray, is_paid: true, paid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        setSaving(false);
        if (insertError) { setError(insertError.message); return; }
        setMessage(`✅ "${name}" was added to ${region}!`);
        setName(""); setPhone(""); setTagline(""); setServices(""); setImageUrl(""); setImageFile(null);
    };

    if (checkingAuth) {
        return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Checking login...</p></main>;
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
                        <p className="text-sm text-slate-500">Logged in as {userEmail}</p>
                    </div>
                    <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-slate-900 underline">Log out</button>
                </div>

                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <button onClick={() => setAdminTab("business")} className={`px-4 py-2 text-sm font-medium rounded-full transition ${adminTab === "business" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100"}`}>🏪 Businesses</button>
                    <button onClick={() => setAdminTab("property")} className={`px-4 py-2 text-sm font-medium rounded-full transition ${adminTab === "property" ? "bg-purple-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100"}`}>🏠 Properties</button>
                    <button onClick={() => setAdminTab("queue")} className={`px-4 py-2 text-sm font-medium rounded-full transition ${adminTab === "queue" ? "bg-emerald-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100"}`}>📸 360° Queue ({queueListings.length})</button>
                </div>

                {adminTab !== "queue" && (
                    <div className="bg-white rounded-2xl shadow p-6 mb-8">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Add a new {adminTab}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Business name *</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Region *</label>
                                    <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                        <optgroup label="Nairobi">{NAIROBI_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</optgroup>
                                        <optgroup label="Kiambu">{KIAMBU_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</optgroup>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Phone *</label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                                <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Services</label>
                                <input type="text" value={services} onChange={(e) => setServices(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Photo</label>
                                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm border rounded-lg" />
                            </div>
                            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>}
                            {message && <div className="text-sm text-green-700 bg-green-50 p-2 rounded-lg">{message}</div>}
                            <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
                                {saving ? "Saving..." : "Add listing"}
                            </button>
                        </form>
                    </div>
                )}

                {adminTab === "queue" && (
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">360° Shoot Requests</h2>
                            {queueListings.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">No pending 360° requests right now.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {queueListings.map((req) => (
                                        <div key={req.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                            <h3 className="font-bold text-slate-800">{req.businesses?.name || "Unknown Business"}</h3>
                                            <p className="text-sm text-slate-600 mb-1">📍 {req.businesses?.region}</p>
                                            <p className="text-sm text-slate-600 mb-4">📞 {req.businesses?.phone}</p>
                                            <a href={`https://wa.me/${req.businesses?.phone}`} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-green-500 text-white font-medium py-2 rounded-lg">Message on WhatsApp</a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {adminTab === "business" && pendingListings.length > 0 && (
                    <div className="bg-white rounded-2xl shadow p-6 mt-8">
                        <h2 className="text-lg font-semibold mb-4">Pending Businesses ({pendingListings.length})</h2>
                        {pendingListings.map((l) => (
                            <div key={l.id} className="border rounded-lg p-4 mb-4 flex justify-between items-start gap-4">
                                <div><h3 className="font-semibold">{l.name}</h3><p className="text-xs text-slate-500">{l.category} · {l.region} · {l.phone}</p></div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleApproval(l.id, "approved")} className="bg-green-500 text-white text-xs px-4 py-2 rounded-lg">✓ Approve</button>
                                    <button onClick={() => handleApproval(l.id, "rejected")} className="bg-red-500 text-white text-xs px-4 py-2 rounded-lg">✗ Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {adminTab === "business" && approvedListings.length > 0 && (
                    <div className="bg-white rounded-2xl shadow p-6 mt-8">
                        <h2 className="text-lg font-semibold mb-4">Approved — Awaiting Payment ({approvedListings.length})</h2>
                        {approvedListings.map((l) => (
                            <div key={l.id} className="border rounded-lg p-4 mb-4 flex justify-between items-start gap-4">
                                <div><h3 className="font-semibold">{l.name}</h3><p className="text-xs text-slate-500">{l.category} · {l.region} · {l.phone}</p></div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleMarkPaid(l.id)} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg">💰 Mark Paid</button>
                                    <button onClick={() => handleVerifyBusiness(l.id, l.is_verified)} className={`text-xs px-4 py-2 rounded-lg ${l.is_verified ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>{l.is_verified ? "✓ Verified" : "Mark Verified"}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {adminTab === "property" && pendingProperties.length > 0 && (
                    <div className="bg-white rounded-2xl shadow p-6 mt-8">
                        <h2 className="text-lg font-semibold mb-4">Pending Properties ({pendingProperties.length})</h2>
                        {pendingProperties.map((l) => (
                            <div key={l.id} className="border rounded-lg p-4 mb-4 flex justify-between items-start gap-4">
                                <div><h3 className="font-semibold">{l.name}</h3><p className="text-xs text-slate-500">{l.property_type} · {l.region} · {l.phone}</p></div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handlePropertyApproval(l.id, "approved")} className="bg-green-500 text-white text-xs px-4 py-2 rounded-lg">✓ Approve</button>
                                    <button onClick={() => handlePropertyApproval(l.id, "rejected")} className="bg-red-500 text-white text-xs px-4 py-2 rounded-lg">✗ Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {adminTab === "property" && approvedProperties.length > 0 && (
                    <div className="bg-white rounded-2xl shadow p-6 mt-8">
                        <h2 className="text-lg font-semibold mb-4">Approved Properties — Awaiting Payment ({approvedProperties.length})</h2>
                        {approvedProperties.map((l) => (
                            <div key={l.id} className="border rounded-lg p-4 mb-4 flex justify-between items-start gap-4">
                                <div><h3 className="font-semibold">{l.name}</h3><p className="text-xs text-slate-500">{l.property_type} · {l.region} · {l.phone}</p></div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handlePropertyMarkPaid(l.id)} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg">💰 Mark Paid</button>
                                    <button onClick={() => handleVerifyProperty(l.id, l.is_verified)} className={`text-xs px-4 py-2 rounded-lg ${l.is_verified ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>{l.is_verified ? "✓ Verified" : "Mark Verified"}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}