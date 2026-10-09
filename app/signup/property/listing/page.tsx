"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
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

const PROPERTY_TYPES = [
  "Apartment", "House", "Townhouse", "Short Stay", "Guesthouse",
  "Hotel", "Office", "Plot", "Commercial", "Studio",
];

export default function PropertyListingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [listingType, setListingType] = useState<"Rent" | "Sale">("Rent");
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0]);
  const [region, setRegion] = useState(NAIROBI_REGIONS[0]);
  const [phone, setPhone] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState<"month" | "total">("month");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signup/property");
        return;
      }
      setUserId(session.user.id);
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  // Property types that have bedrooms/bathrooms
  const showRooms =
    propertyType !== "Plot" &&
    propertyType !== "Office" &&
    propertyType !== "Commercial" &&
    propertyType !== "Hotel";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setSaving(false);
      setError("Please enter a valid price");
      return;
    }

    let finalImageUrl: string | null = null;

    // Upload photo if provided
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-photos")
        .upload(filePath, imageFile);

      if (uploadError) {
        setSaving(false);
        setError(`Photo upload failed: ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("property-photos")
        .getPublicUrl(filePath);

      finalImageUrl = urlData.publicUrl;
    }

    // Build the insert payload
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
      image: finalImageUrl,
      status: "pending",
      is_paid: false,
      owner_id: userId,
    };

    // Only include bedrooms/bathrooms when applicable
    if (showRooms) {
      const bed = parseInt(bedrooms);
      const bath = parseInt(bathrooms);
      payload.bedrooms = isNaN(bed) ? null : bed;
      payload.bathrooms = isNaN(bath) ? null : bath;
    } else {
      payload.bedrooms = null;
      payload.bathrooms = null;
    }

    const { error: insertError } = await supabase
      .from("properties")
      .insert(payload);

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage(
      "🎉 Your property has been submitted! We'll review it and get back to you shortly."
    );
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Checking login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Tell us about your property
          </h1>
          <p className="text-slate-600">
            Fill in the details below. First month is free.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Property name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Modern 3-Bedroom Apartment in Westlands"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Listing type *
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
                  Property type *
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
                placeholder="e.g. Prime location · Secure compound"
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
                rows={4}
                placeholder="Describe the property — finishes, amenities, nearby landmarks..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price (KES) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min={0}
                  placeholder="e.g. 85000"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price unit *
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
                    placeholder="e.g. 3"
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
                    placeholder="e.g. 2"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cover photo
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
              disabled={saving || !!message}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {saving ? "Submitting..." : message ? "Submitted ✓" : "Submit property"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}