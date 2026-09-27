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
      const [photoBusiness, setPhotoBusiness] = useState<any>(null);
      const [panoramaBusiness, setPanoramaBusiness] = useState<any>(null);  

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
            onClick={() => setPhotoBusiness(b)}
            className="text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition"
          >
            📷 Photos
          </button>
          <button
            onClick={() => setPanoramaBusiness(b)}
            className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
          >
            🌐 360°
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
        
      {/* Manage Photos Modal */}
      {photoBusiness && (
        <ManagePhotosModal
          business={photoBusiness}
          onClose={() => setPhotoBusiness(null)}
        />
      )}

      {/* Manage 360 Modal */}
      {panoramaBusiness && (
        <Manage360Modal
          business={panoramaBusiness}
          onClose={() => setPanoramaBusiness(null)}
          onSaved={() => {
            setPanoramaBusiness(null);
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

// ---------- Manage Photos Modal ----------
function ManagePhotosModal({
  business,
  onClose,
}: {
  business: any;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("business_id", business.id)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("Error loading photos:", error);
      setError(error.message);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    const startOrder = photos.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const filePath = `businesses/${business.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-photos")
        .upload(filePath, file);

      if (uploadError) {
        setError(`Upload failed for ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("business-photos")
        .getPublicUrl(filePath);

      await supabase.from("photos").insert({
        business_id: business.id,
        url: urlData.publicUrl,
        sort_order: startOrder + i,
      });
    }

    setUploading(false);
    fetchPhotos();
  };

  const handleDelete = async (photo: any) => {
    if (!confirm("Delete this photo? This cannot be undone.")) return;

    const url: string = photo.url || "";
    const marker = "/business-photos/";
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const storagePath = url.substring(idx + marker.length);
      await supabase.storage.from("business-photos").remove([storagePath]);
    }

    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("id", photo.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    fetchPhotos();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Manage Photos — {business.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            <span>{uploading ? "Uploading..." : "＋ Upload Photos"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
            />
          </label>
          <p className="text-xs text-slate-400 mt-2">
            You can upload multiple photos at once. Recommended: JPG or PNG.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading photos...</p>
        ) : photos.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm text-slate-500">
              No photos yet. Upload your first photo above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt="Business photo"
                  className="w-full aspect-square object-cover rounded-lg border border-slate-200"
                />
                <button
                  onClick={() => handleDelete(p)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs w-7 h-7 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                  title="Delete photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="bg-slate-100 text-slate-700 font-medium px-6 py-2 rounded-lg hover:bg-slate-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
// ---------- Manage 360 Modal ----------
function Manage360Modal({
  business,
  onClose,
  onSaved,
}: {
  business: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const fileName = `${business.id}-${Date.now()}.${ext}`;
    const filePath = `panoramas/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("business-photos")
      .upload(filePath, file);

    if (uploadError) {
      setUploading(false);
      setError(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("business-photos")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("businesses")
      .update({ panorama_url: urlData.publicUrl })
      .eq("id", business.id);

    setUploading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onSaved();
  };

  const handleRemove = async () => {
    if (!confirm("Remove this 360° panorama?")) return;
    setUploading(true);
    setError(null);

    const { error } = await supabase
      .from("businesses")
      .update({ panorama_url: null })
      .eq("id", business.id);

    setUploading(false);

    if (error) {
      setError(error.message);
      return;
    }

    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Manage 360° — {business.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {business.panorama_url ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Your 360° panorama is currently live:
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={business.panorama_url}
              alt="360 panorama"
              className="w-full aspect-video object-cover rounded-lg border border-slate-200 bg-slate-100"
            />
            <div className="flex gap-2">
              <label className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition cursor-pointer">
                <span>{uploading ? "Uploading..." : "Replace Panorama"}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="flex-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
              <div className="text-4xl mb-2">🌐</div>
              <p className="text-sm text-slate-500 mb-4">
                No 360° panorama yet.
              </p>
              <label className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition cursor-pointer">
                <span>{uploading ? "Uploading..." : "Upload 360° Panorama"}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Upload an equirectangular (2:1 ratio) 360° image for best results.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="bg-slate-100 text-slate-700 font-medium px-6 py-2 rounded-lg hover:bg-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}