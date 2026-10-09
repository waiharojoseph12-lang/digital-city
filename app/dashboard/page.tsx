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
        const [myProperties, setMyProperties] = useState<any[]>([]);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [photoProperty, setPhotoProperty] = useState<any>(null);
  const [panoramaProperty, setPanoramaProperty] = useState<any>(null);

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
      
      // Load user's properties
      const { data: propData, error: propError } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });

      if (propError) {
        console.error("Error loading properties:", propError);
      } else {
        setMyProperties(propData || []);
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

      
        {/* My Properties */}
        <div className="bg-white rounded-2xl shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            My Properties ({myProperties.length})
          </h2>

          {myProperties.length === 0 ? (
            <p className="text-slate-500 text-sm">
              You don&apos;t have any properties yet.
            </p>
          ) : (
            <div className="space-y-3">
              {myProperties.map((p) => (
                <div
                  key={p.id}
                  className="border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    <p className="text-xs text-slate-500">
                      {p.property_type} · {p.listing_type} · {p.region}
                    </p>
                    <p className="text-xs text-slate-500">
                      KES {p.price?.toLocaleString("en-KE")}
                      {p.price_unit === "month" ? "/mo" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setEditingProperty(p)}
                      className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setPhotoProperty(p)}
                      className="text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition"
                    >
                      📷 Photos
                    </button>
                    <button
                      onClick={() => setPanoramaProperty(p)}
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

        
      {/* Edit Property Modal */}
      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onSaved={() => {
            setEditingProperty(null);
            if (user) {
              supabase
                .from("properties")
                .select("*")
                .eq("owner_id", user.id)
                .order("created_at", { ascending: false })
                .then(({ data }) => setMyProperties(data || []));
            }
          }}
        />
      )}

      {/* Manage Property Photos Modal */}
      {photoProperty && (
        <ManagePropertyPhotosModal
          property={photoProperty}
          onClose={() => setPhotoProperty(null)}
        />
      )}

      {/* Manage Property 360 Modal */}
      {panoramaProperty && (
        <ManageProperty360Modal
          property={panoramaProperty}
          onClose={() => setPanoramaProperty(null)}
        />
      )}
      
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


// ---------- Edit Property Modal ----------
function EditPropertyModal({
  property,
  onClose,
  onSaved,
}: {
  property: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(property.name || "");
  const [listingType, setListingType] = useState<"Rent" | "Sale">(
    property.listing_type || "Rent"
  );
  const [propertyType, setPropertyType] = useState(
    property.property_type || "Apartment"
  );
  const [region, setRegion] = useState(property.region || "Westlands");
  const [phone, setPhone] = useState(property.phone || "");
  const [tagline, setTagline] = useState(property.tagline || "");
  const [description, setDescription] = useState(property.description || "");
  const [price, setPrice] = useState(
    property.price ? String(property.price) : ""
  );
  const [priceUnit, setPriceUnit] = useState<"month" | "total">(
    property.price_unit || "month"
  );
  const [bedrooms, setBedrooms] = useState(
    property.bedrooms != null ? String(property.bedrooms) : ""
  );
  const [bathrooms, setBathrooms] = useState(
    property.bathrooms != null ? String(property.bathrooms) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PROPERTY_TYPES = [
    "Apartment", "House", "Townhouse", "Short Stay", "Guesthouse",
    "Hotel", "Office", "Plot", "Commercial", "Studio",
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

  const showRooms =
    propertyType !== "Plot" &&
    propertyType !== "Office" &&
    propertyType !== "Commercial" &&
    propertyType !== "Hotel";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setSaving(false);
      setError("Please enter a valid price");
      return;
    }

    const payload: any = {
      name,
      listing_type: listingType,
      property_type: propertyType,
      region,
      phone,
      tagline,
      description: description || null,
      price: parsedPrice,
      price_unit: priceUnit,
    };

    if (showRooms) {
      const bed = parseInt(bedrooms);
      const bath = parseInt(bathrooms);
      payload.bedrooms = isNaN(bed) ? null : bed;
      payload.bathrooms = isNaN(bath) ? null : bath;
    } else {
      payload.bedrooms = null;
      payload.bathrooms = null;
    }

    const { error: updateError } = await supabase
      .from("properties")
      .update(payload)
      .eq("id", property.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
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
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Edit Property
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
              Property name
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
                Listing type
              </label>
              <select
                value={listingType}
                onChange={(e) =>
                  setListingType(e.target.value as "Rent" | "Sale")
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Rent">For Rent</option>
                <option value="Sale">For Sale</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Property type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
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
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price (KES)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min={0}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price unit
              </label>
              <select
                value={priceUnit}
                onChange={(e) =>
                  setPriceUnit(e.target.value as "month" | "total")
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="month">Per month</option>
                <option value="total">Total</option>
              </select>
            </div>
          </div>

          {showRooms && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  min={0}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  min={0}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

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


// ---------- Manage Property Photos Modal ----------
function ManagePropertyPhotosModal({
  property,
  onClose,
}: {
  property: any;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("property_photos")
      .select("*")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("Error loading property photos:", error);
      setError(error.message);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]);

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
      const filePath = `properties/${property.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-photos")
        .upload(filePath, file);

      if (uploadError) {
        setError(`Upload failed for ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("property-photos")
        .getPublicUrl(filePath);

      await supabase.from("property_photos").insert({
        property_id: property.id,
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
    const marker = "/property-photos/";
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const storagePath = url.substring(idx + marker.length);
      await supabase.storage.from("property-photos").remove([storagePath]);
    }

    const { error: deleteError } = await supabase
      .from("property_photos")
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
            Manage Photos — {property.name}
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
                  alt="Property photo"
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


// ---------- Manage Property 360 Modal ----------
function ManageProperty360Modal({
  property,
  onClose,
}: {
  property: any;
  onClose: () => void;
}) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [roomName, setRoomName] = useState("Living Room");
  const [customRoom, setCustomRoom] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ROOM_OPTIONS = [
    "Living Room", "Kitchen", "Master Bedroom", "Bedroom",
    "Bathroom", "Dining Room", "Balcony", "Garden",
    "Garage", "Hallway", "Study", "Store", "Other",
  ];

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("property_panoramas")
      .select("*")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("Error loading property panoramas:", error);
      setError(error.message);
    } else {
      setRooms(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]);

  const handleAdd = async () => {
    if (!pendingFile) {
      setError("Please choose a panorama image first");
      return;
    }

    const finalRoomName =
      roomName === "Other" && customRoom.trim()
        ? customRoom.trim()
        : roomName;

    if (!finalRoomName) {
      setError("Please enter a room name");
      return;
    }

    setUploading(true);
    setError(null);

    const ext = pendingFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const filePath = `panoramas/${property.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-photos")
      .upload(filePath, pendingFile);

    if (uploadError) {
      setUploading(false);
      setError(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("property-photos")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase
      .from("property_panoramas")
      .insert({
        property_id: property.id,
        room_name: finalRoomName,
        url: urlData.publicUrl,
        sort_order: rooms.length,
      });

    setUploading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setPendingFile(null);
    setCustomRoom("");
    setRoomName("Living Room");
    fetchRooms();
  };

  const handleDelete = async (room: any) => {
    if (!confirm(`Delete "${room.room_name}"? This cannot be undone.`)) return;

    const url: string = room.url || "";
    const marker = "/property-photos/";
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const storagePath = url.substring(idx + marker.length);
      await supabase.storage.from("property-photos").remove([storagePath]);
    }

    const { error: deleteError } = await supabase
      .from("property_panoramas")
      .delete()
      .eq("id", room.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    fetchRooms();
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
            Manage 360° Tour — {property.name}
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

        {/* Add room form */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            ＋ Add a room
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Room name
              </label>
              <select
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROOM_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {roomName === "Other" && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Custom name
                </label>
                <input
                  type="text"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  placeholder="e.g. Rooftop"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Panorama image (equirectangular, 2:1)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer border border-slate-300 rounded-lg"
            />
            {pendingFile && (
              <p className="text-xs text-slate-500 mt-2">
                Selected: {pendingFile.name}
              </p>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={uploading || !pendingFile}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Add Room"}
          </button>
        </div>

        {/* Existing rooms */}
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Rooms ({rooms.length})
        </h3>

        {loading ? (
          <p className="text-sm text-slate-500">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            <div className="text-4xl mb-2">🌐</div>
            <p className="text-sm text-slate-500">
              No rooms yet. Add your first 360° room above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rooms.map((room) => (
              <div key={room.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={room.url}
                  alt={room.room_name}
                  className="w-full aspect-video object-cover rounded-lg border border-slate-200 bg-slate-100"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-b-lg truncate">
                  {room.room_name}
                </div>
                <button
                  onClick={() => handleDelete(room)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs w-7 h-7 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                  title="Delete room"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 mt-6 border-t border-slate-200">
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