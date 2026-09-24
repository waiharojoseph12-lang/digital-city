"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";

// ---------- Region data ----------
const NAIROBI_REGIONS = [
  "Westlands", "Dagoretti North", "Dagoretti South", "Kibra", "Langata",
  "Starehe", "Kamukunji", "Mathare", "Makadara", "Embakasi West",
  "Embakasi Central", "Embakasi North", "Embakasi East", "Embakasi South",
  "Roysambu", "Kasarani", "Ruaraka",
];

const KIAMBU_REGIONS = [
  "Kikuyu", "Kabete", "Kiambu", "Ruiru", "Juja", "Thika",
];

// ---------- Business seed data (dummy for now — replace with real data later) ----------
type Business = {
  id: string;
  name: string;
  category: string;
  region: string;
  phone: string; // WhatsApp number, format: 254XXXXXXXXX
  image: string;
  tagline: string;
};
type Property = {
  id: string;
  name: string;
  listingType: "Rent" | "Sale";
  propertyType: string;
  region: string;
  phone: string;
  image: string;
  tagline: string;
  price: number;
  priceUnit: "month" | "total";
  bedrooms: number;
  bathrooms: number;
};

const CATEGORIES = [
  "Boutique", "Showroom", "Salon", "Furniture", "Café", "Electronics",
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop",
];

const hashOf = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

// Generate 3–6 fake businesses for any region, deterministically
const businessesForRegion = (region: string): Business[] => {
  const count = 3 + (hashOf(region) % 4); // 3 to 6 businesses
  const result: Business[] = [];

  for (let i = 0; i < count; i++) {
    const key = `${region}-${i}`;
    const h = hashOf(key);
    const category = CATEGORIES[h % CATEGORIES.length];
    const image = SAMPLE_IMAGES[h % SAMPLE_IMAGES.length];
    const nameVariants = [
      `${region} ${category}`,
      `${region} ${category}s`,
      `The ${region} ${category}`,
      `${category} Hub ${region}`,
    ];
    const taglines = [
      "Authentic Kenyan craftsmanship",
      "Premium quality, fair prices",
      "Trusted since 2015",
      "Nairobi's finest",
      "Walk-ins welcome",
      "We ship countrywide",
    ];

    result.push({
      id: key,
      name: nameVariants[h % nameVariants.length],
      category,
      region,
      phone: "254712345678",
      image,
      tagline: taglines[h % taglines.length],
    });
  }

  return result;
};
// Sample property cover images
const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop",
];

// Generate 2–4 fake properties per region, deterministically
const propertiesForRegion = (region: string): Property[] => {
  const count = 2 + (hashOf(region + "-props") % 3); // 2 to 4
  const result: Property[] = [];
  const types = ["Apartment", "House", "Townhouse", "Office"];
  const taglines = [
    "Modern finishes · Ready to move in",
    "Prime location · Secure compound",
    "Recently renovated · Ample parking",
    "Great views · Backup generator",
    "Furnished · Serviced",
    "Family-friendly neighborhood",
  ];

  for (let i = 0; i < count; i++) {
    const key = `${region}-prop-${i}`;
    const h = hashOf(key);
    const listingType: "Rent" | "Sale" = h % 2 === 0 ? "Rent" : "Sale";
    const propertyType = types[h % types.length];
    const bedrooms = 1 + (h % 4);
    const bathrooms = 1 + (h % 3);
    const price =
      listingType === "Rent"
        ? 30000 + (h % 16) * 10000
        : 6000000 + (h % 40) * 1000000;

    result.push({
      id: key,
      name: `${bedrooms}-Bedroom ${propertyType} in ${region}`,
      listingType,
      propertyType,
      region,
      phone: "254712345678",
      image: PROPERTY_IMAGES[h % PROPERTY_IMAGES.length],
      tagline: taglines[h % taglines.length],
      price,
      priceUnit: listingType === "Rent" ? "month" : "total",
      bedrooms,
      bathrooms,
    });
  }

  return result;
};


// ---------- Placeholder 360 panoramas ----------
const SAMPLE_PANORAMAS = [
  "https://pannellum.org/images/alma.jpg",
  "https://pannellum.org/images/cerro-toco-0.jpg",
  "https://pannellum.org/images/bma-0.jpg",
  "https://pannellum.org/images/from-tree.jpg",
];

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
];

// ---------- Cinematic hero video ----------
const HERO_VIDEO =
  "https://videos.pexels.com/video-files/18750424/18750424-hd_1920_1080_30fps.mp4";

const panoramaForRegion = (name: string) =>
  SAMPLE_PANORAMAS[hashOf(name) % SAMPLE_PANORAMAS.length];

const videoForRegion = (name: string) =>
  SAMPLE_VIDEOS[hashOf(name) % SAMPLE_VIDEOS.length];

type Tab = "map" | "360" | "video";

// ---------- Pannellum viewer wrapper ----------
function Panorama360({ region }: { region: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const init = () => {
      if (cancelled || !containerRef.current) return;

      const win = window as any;
      if (!win.pannellum) {
        setTimeout(init, 200);
        return;
      }

      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch {}
        viewerRef.current = null;
      }

      try {
        viewerRef.current = win.pannellum.viewer(containerRef.current, {
          type: "equirectangular",
          panorama: panoramaForRegion(region),
          autoLoad: true,
          autoRotate: -2,
          showControls: true,
          compass: false,
        });
      } catch (err) {
        console.error("Pannellum init error:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch {}
        viewerRef.current = null;
      }
    };
  }, [region]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      <div ref={containerRef} className="w-full aspect-video" />

      <div className="pointer-events-none absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur">
        {region} · 360° Preview
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur">
        Drag to look around · Scroll to zoom
      </div>
    </div>
  );
}
// ---------- Fullscreen 360° overlay ----------
function Fullscreen360({
  business,
  region,
  onClose,
}: {
  business: Business;
  region: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);

    let cancelled = false;

    const init = () => {
      if (cancelled || !containerRef.current) return;
      const win = window as any;
      if (!win.pannellum) {
        setTimeout(init, 200);
        return;
      }

      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch {}
        viewerRef.current = null;
      }

      try {
        viewerRef.current = win.pannellum.viewer(containerRef.current, {
          type: "equirectangular",
          panorama: panoramaForRegion(region),
          autoLoad: true,
          autoRotate: -1.5,
          showControls: true,
          compass: false,
        });
      } catch (err) {
        console.error("Pannellum fullscreen init error:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch {}
        viewerRef.current = null;
      }
    };
  }, [region, onClose]);

  const waLink = `https://wa.me/${business.phone}?text=${encodeURIComponent(
    `Hi ${business.name}, I found you on Digital Nairobi.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onClose}
            className="bg-black/60 hover:bg-black/80 text-white text-sm px-4 py-2 rounded-full backdrop-blur transition"
          >
            ← Back to map
          </button>
          <div className="bg-black/60 text-white text-sm px-3 py-2 rounded-full backdrop-blur">
            {region}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close fullscreen"
          className="pointer-events-auto bg-black/60 hover:bg-black/80 text-white text-2xl leading-none w-11 h-11 rounded-full backdrop-blur transition flex items-center justify-center"
        >
          ×
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="text-white max-w-xl">
            <span className="inline-block text-xs font-medium bg-white/20 px-2 py-1 rounded-full mb-2">
              {business.category}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              {business.name}
            </h2>
            <p className="text-sm text-white/80 mt-1">{business.tagline}</p>
          </div>
          <div className="flex gap-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-5 py-3 rounded-full transition"
            >
              WhatsApp
            </a>
            <a
              href={`tel:+${business.phone}`}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-3 rounded-full backdrop-blur transition"
            >
              Call
            </a>
          </div>
        </div>
        <p className="text-white/50 text-xs mt-4">
          Drag to look around · Scroll to zoom · Press Esc to close
        </p>
      </div>
    </div>
  );
}


// ---------- Business card ----------
function BusinessCard({
  business,
  onView360,
}: {
  business: Business;
  onView360: (business: Business) => void;
}) {
  const waLink = `https://wa.me/${business.phone}?text=${encodeURIComponent(
    `Hi ${business.name}, I found you on Digital Nairobi.`
  )}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={business.image}
          alt={business.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <span className="absolute top-2 left-2 bg-white/95 text-slate-700 text-xs font-medium px-2 py-1 rounded-full">
          {business.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1">
          {business.name}
        </h3>
        <p className="text-xs text-slate-500 mb-3">{business.tagline}</p>
        <div className="flex gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition"
          >
            WhatsApp
          </a>
          <button
            onClick={() => onView360(business)}
            className="flex-1 text-xs font-medium bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 transition"
          >
            View 360°
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Property card ----------
function PropertyCard({
  property,
  onView360,
}: {
  property: Property;
  onView360: () => void;
}) {
  const waLink = `https://wa.me/${property.phone}?text=${encodeURIComponent(
    `Hi, I'm interested in "${property.name}" listed on Digital Nairobi.`
  )}`;

  // Format price: 45000 → "KES 45,000" ; 12000000 → "KES 12,000,000"
  const formattedPrice = property.price.toLocaleString("en-KE");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.image}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <span
          className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${
            property.listingType === "Rent"
              ? "bg-green-500 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          For {property.listingType}
        </span>
        <span className="absolute top-2 right-2 bg-white/95 text-slate-700 text-xs font-medium px-2 py-1 rounded-full">
          {property.propertyType}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1">
          {property.name}
        </h3>
        <p className="text-xs text-slate-500 mb-3">{property.tagline}</p>

        {/* Price + specs row */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div className="text-base font-bold text-slate-900">
            KES {formattedPrice}
            {property.priceUnit === "month" && (
              <span className="text-xs font-normal text-slate-500">/mo</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              🛏️ {property.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              🚿 {property.bathrooms}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition"
          >
            WhatsApp
          </a>
          <button
            onClick={onView360}
            className="flex-1 text-xs font-medium bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 transition"
          >
            View 360°
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main component ----------
export default function Home() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("map");
    const [fullscreenBusiness, setFullscreenBusiness]
   = useState<Business | null>(null);
     useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from("businesses").select("*");
      if (error) {
        console.error("Supabase connection error:", error);
      } else {
        console.log("Supabase connected! Businesses in DB:", data.length);
      }
    };
    testConnection();
  }, []);
     const [contentTab, setContentTab] = useState<"businesses" | "properties">("businesses");

  const countyOf = (name: string): "Nairobi" | "Kiambu" =>
    KIAMBU_REGIONS.includes(name) ? "Kiambu" : "Nairobi";

  const pickRegion = (name: string) => {
    setSelected(name);
    setTab("360");
  };

  const regionProps = (name: string, county: "Nairobi" | "Kiambu") => ({
    "data-region": name,
    "data-county": county,
    onMouseEnter: () => setHovered(name),
    onMouseLeave: () => setHovered(null),
    onClick: () => pickRegion(name),
    style: { cursor: "pointer" } as React.CSSProperties,
  });

  const fillFor = (name: string, county: "Nairobi" | "Kiambu") => {
    if (selected === name) return county === "Kiambu" ? "#7c3aed" : "#1d4ed8";
    if (hovered === name) return county === "Kiambu" ? "#a78bfa" : "#60a5fa";
    return county === "Kiambu" ? "#c4b5fd" : "#93c5fd";
  };

  const strokeFor = (county: "Nairobi" | "Kiambu") =>
    county === "Kiambu" ? "#5b21b6" : "#1e40af";

  const businesses = selected ? businessesForRegion(selected) : [];
    const properties = selected ? propertiesForRegion(selected) : [];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ============ CINEMATIC HERO ============ */}
      <section className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
        <video
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/80" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <span className="text-xs uppercase tracking-[0.3em] text-white/80 mb-4">
            Nairobi · Kiambu · Kenya
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Digital Nairobi
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
            Discover the city&apos;s finest showrooms, boutiques, and businesses — 
            all on one interactive map with 360° virtual views.
          </p>
          <a
            href="#explore"
            className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-full hover:bg-slate-100 transition shadow-lg"
          >
            Start exploring
            <span>↓</span>
          </a>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* ============ MAIN CONTENT ============ */}
      <div id="explore" className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            Pick a region
          </h2>
          <p className="text-slate-600">
            Explore the map · Take a 360° look · Watch its story
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow p-6">
            <div className="mb-4">
              <p className="text-sm text-slate-500">Hovering</p>
              <p className="font-semibold text-slate-800">{hovered ?? "—"}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-slate-500">Selected region</p>
              <p className="font-semibold text-blue-600 text-lg">
                {selected ?? "None yet"}
              </p>
            </div>

            <p className="text-sm text-slate-500 mb-2">
              Nairobi ({NAIROBI_REGIONS.length})
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {NAIROBI_REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => pickRegion(r)}
                  onMouseEnter={() => setHovered(r)}
                  onMouseLeave={() => setHovered(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    selected === r
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <p className="text-sm text-slate-500 mb-2">
              Kiambu ({KIAMBU_REGIONS.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {KIAMBU_REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => pickRegion(r)}
                  onMouseEnter={() => setHovered(r)}
                  onMouseLeave={() => setHovered(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    selected === r
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200">
              <div className="flex gap-1">
                <TabButton active={tab === "map"} onClick={() => setTab("map")}>
                  🗺️ Map
                </TabButton>
                <TabButton active={tab === "360"} onClick={() => setTab("360")}>
                  🌐 360° View
                </TabButton>
                <TabButton active={tab === "video"} onClick={() => setTab("video")}>
                  🎬 Video
                </TabButton>
              </div>
              {selected && (
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full mb-1 ${
                    countyOf(selected) === "Kiambu"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {selected} · {countyOf(selected)}
                </span>
              )}
            </div>

            {tab === "map" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-500">
                    Click a region to open its 360° view
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-sm bg-blue-300 border border-blue-800" />
                      Nairobi
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-sm bg-purple-300 border border-purple-800" />
                      Kiambu
                    </span>
                  </div>
                </div>

                <svg
                  viewBox="0 0 900 700"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Map of Nairobi and nearby Kiambu areas"
                >
                  <polygon points="220,180 300,150 360,170 340,230 260,240 210,220" fill={fillFor("Kikuyu", "Kiambu")} stroke={strokeFor("Kiambu")} strokeWidth="2" {...regionProps("Kikuyu", "Kiambu")} />
                  <text x="265" y="205" textAnchor="middle" fontSize="13" fill="#3b0764" pointerEvents="none">Kikuyu</text>
                  <polygon points="300,150 420,140 470,165 440,215 360,170" fill={fillFor("Kabete", "Kiambu")} stroke={strokeFor("Kiambu")} strokeWidth="2" {...regionProps("Kabete", "Kiambu")} />
                  <text x="400" y="185" textAnchor="middle" fontSize="13" fill="#3b0764" pointerEvents="none">Kabete</text>
                  <polygon points="470,165 560,155 600,185 560,225 440,215" fill={fillFor("Kiambu", "Kiambu")} stroke={strokeFor("Kiambu")} strokeWidth="2" {...regionProps("Kiambu", "Kiambu")} />
                  <text x="530" y="195" textAnchor="middle" fontSize="13" fill="#3b0764" pointerEvents="none">Kiambu</text>
                  <polygon points="600,185 720,175 760,205 700,235 560,225" fill={fillFor("Ruiru", "Kiambu")} stroke={strokeFor("Kiambu")} strokeWidth="2" {...regionProps("Ruiru", "Kiambu")} />
                  <text x="660" y="210" textAnchor="middle" fontSize="13" fill="#3b0764" pointerEvents="none">Ruiru</text>
                  <polygon points="760,205 850,210 880,240 820,265 700,235" fill={fillFor("Juja", "Kiambu")} stroke={strokeFor("Kiambu")} strokeWidth="2" {...regionProps("Juja", "Kiambu")} />
                  <text x="795" y="240" textAnchor="middle" fontSize="13" fill="#3b0764" pointerEvents="none">Juja</text>
                  <polygon points="880,240 940,245 950,285 880,300 820,265" fill={fillFor("Thika", "Kiambu")} stroke={strokeFor("Kiambu")} strokeWidth="2" {...regionProps("Thika", "Kiambu")} />
                  <text x="890" y="275" textAnchor="middle" fontSize="13" fill="#3b0764" pointerEvents="none">Thika</text>

                  <polygon points="130,330 220,290 300,300 290,380 200,400 140,380" fill={fillFor("Westlands", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Westlands", "Nairobi")} />
                  <text x="215" y="350" textAnchor="middle" fontSize="13" fill="#0c1e4a" pointerEvents="none">Westlands</text>
                  <polygon points="80,340 140,320 130,330 140,380 100,400 70,380" fill={fillFor("Dagoretti North", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Dagoretti North", "Nairobi")} />
                  <text x="85" y="360" textAnchor="middle" fontSize="11" fill="#0c1e4a" pointerEvents="none">Dago N</text>
                  <polygon points="60,400 100,400 140,380 120,440 70,450" fill={fillFor("Dagoretti South", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Dagoretti South", "Nairobi")} />
                  <text x="80" y="425" textAnchor="middle" fontSize="11" fill="#0c1e4a" pointerEvents="none">Dago S</text>
                  <polygon points="120,440 200,400 240,430 200,490 130,490" fill={fillFor("Kibra", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Kibra", "Nairobi")} />
                  <text x="180" y="455" textAnchor="middle" fontSize="13" fill="#0c1e4a" pointerEvents="none">Kibra</text>
                  <polygon points="70,460 130,490 200,490 240,540 130,570 60,520" fill={fillFor("Langata", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Langata", "Nairobi")} />
                  <text x="150" y="530" textAnchor="middle" fontSize="13" fill="#0c1e4a" pointerEvents="none">Langata</text>
                  <polygon points="240,380 300,360 350,390 330,440 260,450 230,420" fill={fillFor("Starehe", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Starehe", "Nairobi")} />
                  <text x="290" y="410" textAnchor="middle" fontSize="13" fill="#0c1e4a" pointerEvents="none">Starehe</text>
                  <polygon points="300,360 350,350 400,380 380,420 350,390" fill={fillFor("Kamukunji", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Kamukunji", "Nairobi")} />
                  <text x="355" y="390" textAnchor="middle" fontSize="11" fill="#0c1e4a" pointerEvents="none">Kamukunji</text>
                  <polygon points="260,450 330,440 380,470 350,510 280,500" fill={fillFor("Mathare", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Mathare", "Nairobi")} />
                  <text x="315" y="480" textAnchor="middle" fontSize="13" fill="#0c1e4a" pointerEvents="none">Mathare</text>
                  <polygon points="240,500 330,470 400,490 380,540 280,540" fill={fillFor("Makadara", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Makadara", "Nairobi")} />
                  <text x="325" y="515" textAnchor="middle" fontSize="13" fill="#0c1e4a" pointerEvents="none">Makadara</text>
                  <polygon points="380,420 460,410 500,440 470,480 400,470 380,440" fill={fillFor("Embakasi West", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Embakasi West", "Nairobi")} />
                  <text x="435" y="450" textAnchor="middle" fontSize="11" fill="#0c1e4a" pointerEvents="none">Emb W</text>
                  <polygon points="470,440 520,420 570,450 540,490 470,480" fill={fillFor("Embakasi Central", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Embakasi Central", "Nairobi")} />
                  <text x="515" y="460" textAnchor="middle" fontSize="11" fill="#0c1e4a" pointerEvents="none">Emb C</text>
                  <polygon points="460,340 540,320 600,360 560,400 480,400 460,380" fill={fillFor("Embakasi North", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Embakasi North", "Nairobi")} />
                  <text x="530" y="370" textAnchor="middle" fontSize="11" fill="#0c1e4a" pointerEvents="none">Emb N</text>
                  <polygon points="620,380 720,360 780,400 740,450 640,450 610,420" fill={fillFor("Embakasi East", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Embakasi East", "Nairobi")} />
                  <text x="690" y="410" textAnchor="middle" fontSize="11" fill="#0c1e4a" pointerEvents="none">Emb E</text>
                  <polygon points="450,510 550,490 640,510 700,560 620,600 500,600 430,560" fill={fillFor("Embakasi South", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Embakasi South", "Nairobi")} />
                  <text x="565" y="555" textAnchor="middle" fontSize="13" fill="#0c1e4a" pointerEvents="none">Embakasi South</text>
                  <polygon points="300,300 400,280 470,300 460,340 380,350 300,340" fill={fillFor("Roysambu", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Roysambu", "Nairobi")} />
                  <text x="385" y="320" textAnchor="middle" fontSize="13" fill="#0c1e4a" pointerEvents="none">Roysambu</text>
                  <polygon points="470,300 600,280 680,310 660,360 600,360 470,340" fill={fillFor("Kasarani", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Kasarani", "Nairobi")} />
                  <text x="570" y="325" textAnchor="middle" fontSize="13" fill="#0c1e4a" pointerEvents="none">Kasarani</text>
                  <polygon points="400,350 460,340 470,380 460,410 400,410 380,380" fill={fillFor("Ruaraka", "Nairobi")} stroke={strokeFor("Nairobi")} strokeWidth="2" {...regionProps("Ruaraka", "Nairobi")} />
                  <text x="425" y="385" textAnchor="middle" fontSize="11" fill="#0c1e4a" pointerEvents="none">Ruaraka</text>
                </svg>
              </div>
            )}

            {tab === "360" && (
              <div>
                {selected ? (
                  <>
                    <Panorama360 region={selected} />
                    <p className="text-xs text-slate-400 mt-3">
                      Sample 360° panorama — will be replaced with real {selected} footage.
                    </p>
                  </>
                ) : (
                  <EmptyPrompt
                    emoji="🌐"
                    title="Pick a region first"
                    text="Choose a region from the left, or click one on the Map tab."
                  />
                )}
              </div>
            )}

            {tab === "video" && (
              <div>
                {selected ? (
                  <>
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                      <video
                        key={selected}
                        src={videoForRegion(selected)}
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls
                        className="w-full h-full object-cover"
                      />
                      <div className="pointer-events-none absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur">
                        {selected} · Video
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                      Sample video — will be replaced with real {selected} footage.
                    </p>
                  </>
                ) : (
                  <EmptyPrompt
                    emoji="🎬"
                    title="Pick a region first"
                    text="Choose a region from the left, or click one on the Map tab."
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============ BUSINESSES IN SELECTED REGION ============ */}
      {selected && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                {contentTab === "businesses" ? "Businesses" : "Properties"} in {selected}
              </h2>
              <p className="text-slate-600 text-sm">
                {contentTab === "businesses"
                  ? `${businesses.length} places · click WhatsApp to contact`
                  : `${properties.length} listings · click WhatsApp to enquire`}
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                countyOf(selected) === "Kiambu"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {countyOf(selected)} County
            </span>
          </div>

          {/* Content toggle */}
          <div className="inline-flex bg-slate-100 rounded-full p-1 mb-6">
            <button
              onClick={() => setContentTab("businesses")}
              className={`px-5 py-2 text-sm font-medium rounded-full transition ${
                contentTab === "businesses"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏪 Businesses ({businesses.length})
            </button>
            <button
              onClick={() => setContentTab("properties")}
              className={`px-5 py-2 text-sm font-medium rounded-full transition ${
                contentTab === "properties"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏠 Properties ({properties.length})
            </button>
          </div>

          {contentTab === "businesses" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {businesses.map((b) => (
                <BusinessCard
                  key={b.id}
                  business={b}
                  onView360={(biz) => setFullscreenBusiness(biz)}
                />
              ))}
            </div>
          )}

          {contentTab === "properties" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                           onView360={() =>
                setFullscreenBusiness({
                  id: p.id,
                  name: p.name,
                  category: `For ${p.listingType} · ${p.propertyType}`,
                  region: p.region,
                  phone: p.phone,
                  image: p.image,
                  tagline: `${p.tagline} · KES ${p.price.toLocaleString("en-KE")}${
                    p.priceUnit === "month" ? "/mo" : ""
                  }`,
                })
              }
                />
              ))}
            </div>
          )}
        </div>
      )}

        {/* No region selected yet — prompt */}
        {!selected && (
          <div className="mt-12 text-center py-12">
            <div className="text-5xl mb-3">🏪</div>
            <p className="text-slate-600 font-medium">
              Pick a region above to see its businesses
            </p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 py-8">
        Powered by Digital Nairobi · Built with Next.js
      </p>
            {/* Fullscreen 360° overlay */}
      {fullscreenBusiness && selected && (
        <Fullscreen360
          business={fullscreenBusiness}
          region={selected}
          onClose={() => setFullscreenBusiness(null)}
        />
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyPrompt({
  emoji,
  title,
  text,
}: {
  emoji: string;
  title: string;
  text: string;
}) {
  return (
    <div className="aspect-video rounded-xl bg-slate-100 flex flex-col items-center justify-center text-center p-6">
      <div className="text-5xl mb-3">{emoji}</div>
      <p className="text-slate-700 font-semibold">{title}</p>
      <p className="text-slate-500 text-sm mt-1 max-w-xs">{text}</p>
    </div>
  );
}