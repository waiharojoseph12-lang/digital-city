"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

const NAIROBI_REGIONS = [
  "Westlands", "Dagoretti North", "Dagoretti South", "Kibra", "Langata",
  "Starehe", "Kamukunji", "Mathare", "Makadara", "Embakasi West",
  "Embakasi Central", "Embakasi North", "Embakasi East", "Embakasi South",
  "Roysambu", "Kasarani", "Ruaraka", "Karen", "Kilimani", "Lavington", 
  "South B", "South C", "Eastleigh", "Industrial Area", "Gigiri", "Runda"
];

const KIAMBU_REGIONS = [
  "Kikuyu", "Kabete", "Kiambu Town", "Ruiru", "Juja", "Thika", 
  "Mwihoko", "Kamakis", "Githurai", "Limuru", "Tigoni", "Ndenderu"
];

const MACHAKOS_REGIONS = [
  "Mlolongo", "Syokimau", "Athi River", "Mavoko", "Kitengela"
];

const CATEGORIES = [
  "Boutique", "Salon", "Real Estate", "Food & Drink", "Electronics", "Hardware", "Other"
];

export default function ListingPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Boutique",
    region: "Kamakis",
    phone: "",
    tagline: "",
    wants360: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
        let finalImageUrl = null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("business-photos")
        .upload(fileName, imageFile);

      if (uploadError) {
        setErrorMsg("Photo upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("business-photos")
        .getPublicUrl(fileName);
        
      finalImageUrl = urlData.publicUrl;
    }
    setErrorMsg("");

    try {
      // 1. Insert the business
      const { data, error } = await supabase.from("businesses").insert({
        name: formData.name,
        category: formData.category,
        region: formData.region,
        phone: formData.phone,
        tagline: formData.tagline,
                image: finalImageUrl,
        status: "pending", // Must be approved by you in admin
        is_paid: true, // Free trial
        is_verified: false,
      }).select().single();

      if (error) throw error;

      // 2. If they want a 360 shoot, log it (we will use the leads table for now)
      if (formData.wants360 && data) {
        await supabase.from("leads").insert({
          listing_type: "business",
          listing_id: data.id,
          action: "360",
          source: "signup_request",
        });
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">You're on the list!</h1>
          <p className="text-slate-600 mb-6">
            Your business has been submitted. Our team will review it and reach out on WhatsApp shortly.
          </p>
          <a 
            href={`https://wa.me/254700000000?text=Hi, I just signed up my business ${formData.name} on Digital Nairobi.`}
            target="_blank"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition"
          >
            Chat with us on WhatsApp
          </a>
          <Link href="/" className="block mt-4 text-sm text-slate-500 hover:text-slate-800">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-2xl mb-4">🏙️</Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">List Your Business</h1>
          <p className="text-slate-600">Join Kenya's premium business directory.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-emerald-900 p-4 text-center">
            <p className="text-emerald-100 text-sm font-medium">
              🎉 First 100 businesses get a <strong>free 360° photoshoot</strong> & 1 month free!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Business Name *</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Kamakis Boutique"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Region *</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <optgroup label="Kiambu (Kamakis/Ruiru)">
                    {KIAMBU_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </optgroup>
                  <optgroup label="Nairobi">
                    {NAIROBI_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </optgroup>
                  <optgroup label="Machakos">
                    {MACHAKOS_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp Phone Number *</label>
              <input 
                required
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 0712345678"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Short Tagline</label>
              <input 
                type="text" 
                value={formData.tagline}
                onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Best dresses in Kamakis"
              />
                          <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Upload a Photo (Optional)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-emerald-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
              />
            </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.wants360}
                  onChange={(e) => setFormData({...formData, wants360: e.target.checked})}
                  className="mt-1 w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Request a Free 360° Virtual Tour</p>
                  <p className="text-slate-500 text-xs mt-0.5">We will visit your shop, take photos, and put them online.</p>
                </div>
              </label>
            </div>

            {errorMsg && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-lg py-4 rounded-xl transition shadow-md disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit My Business"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}