"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";

// ---------- Region data ----------
// ---------- Region data ----------
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

// ---------- Business seed data (dummy for now — replace with real data later) ----------
type Business = {
  id: string;
  name: string;
  category: string;
  region: string;
  phone: string;
  image: string;
  tagline: string;
  services?: string[];
  panorama_url?: string | null;
  photos?: { id: string; url: string; sort_order: number }[];
    panoramas?: { id: string; room_name: string; url: string; sort_order: number }[];
      is_verified?: boolean;
};
type Property = {
  id: string;
  name: string;
  listing_type: "Rent" | "Sale";
  property_type: string;
  region: string;
  phone: string;
  tagline: string;
  description?: string | null;
  price: number;
  price_unit: "month" | "total";
  bedrooms?: number | null;
  bathrooms?: number | null;
  image: string | null;
  status: string;
  owner_id?: string | null;
  photos?: { id: string; url: string; sort_order: number }[];
  panoramas?: { id: string; room_name: string; url: string; sort_order: number }[];
    is_verified?: boolean;
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
function Panorama360({
  region,
  panoramaUrl,
}: {
  region: string;
  panoramaUrl?: string | null;
}) {
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
          panorama: panoramaUrl || panoramaForRegion(region),
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
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
    const [roomIndex, setRoomIndex] = useState(0);

  const rooms =
    business.panoramas && business.panoramas.length > 0
      ? business.panoramas
      : null;
        

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
        panorama: rooms
  ? rooms[roomIndex].url
  : business.panorama_url || panoramaForRegion(business.region),
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
    }, [business.panorama_url, business.region, onClose, roomIndex, rooms]);

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
         {business.region}
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
          
        {/* Room switcher — only if multi-room panoramas exist */}
        {rooms && rooms.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {rooms.map((room, idx) => (
              <button
                key={room.id}
                onClick={() => setRoomIndex(idx)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition backdrop-blur ${
                  idx === roomIndex
                    ? "bg-white text-slate-900"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {room.room_name}
              </button>
            ))}
          </div>
        )}
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
      onClick,
  reviews,
        onLeaveReview,
              onViewReviews,
                trackLead,
}: {
  business: Business;
  onView360: (business: Business) => void;
      onClick: (business: Business) => void;
        reviews: any[];
              onLeaveReview: (business: Business) => void;
                trackLead: (
    listingType: "business" | "property",
    listingId: string,
    action: "whatsapp" | "call" | "share" | "view"| "360",
    source?: string
  ) => void;
                    onViewReviews: (business: Business) => void;
}) {
  const waLink = `https://wa.me/${business.phone}?text=${encodeURIComponent(
    `Hi ${business.name}, I found you on Digital Nairobi.`
  )}`;
  
  const businessReviews = reviews.filter(
    (r: any) => r.business_id === business.id
  );
  const reviewCount = businessReviews.length;
  const avgRating =
    reviewCount > 0
      ? businessReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviewCount
      : 0;

  return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group" onClick={() => onClick(business)}>
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
          {(() => {
  const coverImage =
    business.photos && business.photos.length > 0
      ? business.photos[0].url
      : business.image;
  return coverImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={coverImage}
      alt={business.name}
      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-5xl">
      🏪
    </div>
  );
})()}
        <span className="absolute top-2 left-2 bg-white/95 text-slate-700 text-xs font-medium px-2 py-1 rounded-full">
          {business.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1">
          {business.name}
           {business.is_verified && (
   <span className="inline-flex items-center justify-center text-blue-500 ml-1" title="Verified">
     ✓
   </span>
 )}
        </h3>
        <p className="text-xs text-slate-500 mb-3">{business.tagline}</p>
                      {reviewCount > 0 && (
          <button
            type="button"
            onClick={() => onViewReviews(business)}
            className="flex items-center gap-1 mb-2 text-xs hover:bg-yellow-50 px-2 py-1 -ml-2 rounded-lg transition"
          >
            <span className="text-yellow-500">
              {"★".repeat(Math.round(avgRating))}
              {"☆".repeat(5 - Math.round(avgRating))}
            </span>
            <span className="text-slate-600 font-medium">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-slate-400">
              ({reviewCount})
            </span>
          </button>
        )}
                  {business.services && business.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {business.services.slice(0, 3).map((service, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {service}
                </span>
              ))}
              {business.services.length > 3 && (
                <span className="text-[10px] text-slate-400">
                  +{business.services.length - 3} more
                </span>
              )}
            </div>
          )}
                  <div className="grid grid-cols-3 gap-2">
            <a
              href={`tel:+${business.phone}`}
                    onClick={() => trackLead("business", business.id, "call", "card")}
              className="text-center text-xs font-medium bg-blue-500 text-white px-2 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              📞 Call
            </a>
            <a
              href={waLink}
                   onClick={() => trackLead("business", business.id, "whatsapp", "card")} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-xs font-medium bg-green-500 text-white px-2 py-2 rounded-lg hover:bg-green-600 transition"
            >
              WhatsApp
            </a>
            <button
                               onClick={(e) => { e.stopPropagation(); trackLead("business", business.id, "share", "card"); onView360(business); }}
              className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-2 rounded-lg hover:bg-slate-200 transition"
            >
              360°
            </button>
          </div>
                  <button
               onClick={() => onLeaveReview(business)}
          className="w-full mt-2 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-2 rounded-lg hover:bg-yellow-100 transition"
        >
          ⭐ Leave a Review
        </button>
      </div>
    </div>
  );
}
// ---------- Property 360 Viewer ----------
function Property360Viewer({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [roomIndex, setRoomIndex] = useState(0);

  const rooms =
    property.panoramas && property.panoramas.length > 0
      ? property.panoramas
      : null;

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

      if (!rooms) return;

      try {
        viewerRef.current = win.pannellum.viewer(containerRef.current, {
          type: "equirectangular",
          panorama: rooms[roomIndex].url,
          autoLoad: true,
          autoRotate: -1.5,
          showControls: true,
          compass: false,
        });
      } catch (err) {
        console.error("Pannellum property 360 init error:", err);
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
  }, [roomIndex, rooms, onClose]);

  const waLink = `https://wa.me/${property.phone}?text=${encodeURIComponent(
    `Hi, I'm interested in "${property.name}" listed on Digital Nairobi.`
  )}`;

  if (!rooms) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onClose}
            className="bg-black/60 hover:bg-black/80 text-white text-sm px-4 py-2 rounded-full backdrop-blur transition"
          >
            ← Back
          </button>
          <div className="bg-black/60 text-white text-sm px-3 py-2 rounded-full backdrop-blur">
            {property.region}
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

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div className="text-white max-w-xl">
            <span className="inline-block text-xs font-medium bg-white/20 px-2 py-1 rounded-full mb-2">
              {property.property_type}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              {property.name}
            </h2>
            <p className="text-sm text-white/80 mt-1">{property.tagline}</p>
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
              href={`tel:+${property.phone}`}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-3 rounded-full backdrop-blur transition"
            >
              Call
            </a>
          </div>
        </div>

        {/* Room switcher */}
        {rooms.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {rooms.map((room, idx) => (
              <button
                key={room.id}
                onClick={() => setRoomIndex(idx)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition backdrop-blur ${
                  idx === roomIndex
                    ? "bg-white text-slate-900"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {room.room_name}
              </button>
            ))}
          </div>
        )}

        <p className="text-white/50 text-xs">
          Drag to look around · Scroll to zoom · Press Esc to close
        </p>
      </div>
    </div>
  );
}


// ---------- Business Detail Modal ----------
function BusinessDetailModal({
  business,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Increment view count when modal opens
  useEffect(() => {
    if (!business?.id) return;
    supabase
      .from("views")
      .insert({
        listing_type: "business",
        listing_id: business.id,
      })
      .then(({ error }) => {
        if (error) console.error("View tracking failed:", error.message);
      });
  }, [business?.id]);

  const waLink = `https://wa.me/${business.phone}?text=${encodeURIComponent(
    `Hi ${business.name}, I found you on Digital Nairobi.`
  )}`;

  const coverImage =
    business.photos && business.photos.length > 0
      ? business.photos[0].url
      : business.image;

  const allPhotos =
    business.photos && business.photos.length > 0
      ? business.photos.map((p) => p.url)
      : coverImage
        ? [coverImage]
        : [];

  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);

  const prevPhoto = () => {
    if (lightboxIndex === null || allPhotos.length === 0) return;
    setLightboxIndex(
      lightboxIndex === 0 ? allPhotos.length - 1 : lightboxIndex - 1
    );
  };

  const nextPhoto = () => {
    if (lightboxIndex === null || allPhotos.length === 0) return;
    setLightboxIndex(
      lightboxIndex === allPhotos.length - 1 ? 0 : lightboxIndex + 1
    );
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) closeLightbox();
        else onClose();
      }
      if (e.key === "ArrowLeft" && lightboxIndex !== null) prevPhoto();
      if (e.key === "ArrowRight" && lightboxIndex !== null) nextPhoto();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, allPhotos.length]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              {business.category}
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Cover photo */}
          <div className="relative aspect-[16/9] bg-slate-100">
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt={business.name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => openLightbox(0)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-blue-100 to-purple-100">
                🏪
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {business.name}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {business.region} · Kenya
            </p>

            {business.tagline && (
              <p className="text-sm font-medium text-slate-700 mb-4">
                {business.tagline}
              </p>
            )}

            {/* Services chips */}
            {business.services && business.services.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {business.services.map((service, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Photo gallery */}
            {allPhotos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Photos ({allPhotos.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {allPhotos.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`${business.name} photo ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition"
                      onClick={() => openLightbox(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
              >
                WhatsApp
              </a>
              <a
                href={`tel:+${business.phone}`}
                className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                📞 Call
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {lightboxIndex !== null && allPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Prev */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevPhoto();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white text-2xl w-12 h-12 rounded-full backdrop-blur transition flex items-center justify-center"
            aria-label="Previous photo"
          >
            ←
          </button>

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allPhotos[lightboxIndex]}
            alt={`${business.name} photo ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextPhoto();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white text-2xl w-12 h-12 rounded-full backdrop-blur transition flex items-center justify-center"
            aria-label="Next photo"
          >
            →
          </button>

          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white text-2xl w-12 h-12 rounded-full backdrop-blur transition flex items-center justify-center"
            aria-label="Close lightbox"
          >
            ×
          </button>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full backdrop-blur">
            {lightboxIndex + 1} / {allPhotos.length}
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Review modal ----------
function ReviewModal({
  business,
  onClose,
  onSubmitted,
}: {
  business: any;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("reviews").insert({
      business_id: business.id,
      rating,
      comment,
      reviewer_name: name,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onSubmitted();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Leave a Review
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          For: <span className="font-medium text-slate-700">{business?.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Jane M."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rating
            </label>
            <div className="flex gap-1 text-3xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`${
                    star <= rating ? "text-yellow-500" : "text-slate-300"
                  } hover:text-yellow-500 transition`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell others about your experience..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Reviews List Modal ----------
function ReviewsListModal({
  business,
  reviews,
  onClose,
  onLeaveReview,
}: {
  business: any;
  reviews: any[];
  onClose: () => void;
  onLeaveReview: () => void;
}) {
  const businessReviews = reviews
    .filter((r: any) => r.business_id === business.id)
    .sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const reviewCount = businessReviews.length;
  const avgRating =
    reviewCount > 0
      ? businessReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviewCount
      : 0;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800">
                Reviews for {business?.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-yellow-500 text-lg">
                  {"★".repeat(Math.round(avgRating))}
                  {"☆".repeat(5 - Math.round(avgRating))}
                </span>
                <span className="text-slate-700 font-medium">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-slate-400 text-sm">
                  ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Reviews list (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          {reviewCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No reviews yet.</p>
              <p className="text-slate-400 text-xs mt-1">
                Be the first to leave one!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {businessReviews.map((r: any) => (
                <div
                  key={r.id}
                  className="border-b border-slate-100 pb-4 last:border-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-500 text-sm">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-slate-700 mb-1">
                      {r.comment}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">— {r.reviewer_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with "Leave a Review" button */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => {
              onClose();
              onLeaveReview();
            }}
            className="w-full bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm font-medium py-2.5 rounded-lg hover:bg-yellow-100 transition"
          >
            ⭐ Leave a Review
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
  onClick,
    trackLead,
}: {
  property: Property;
  onView360: () => void;
    trackLead: (
    listingType: "business" | "property",
    listingId: string,
    action: "whatsapp" | "call" | "share" | "view"| "360",
    source?: string
  ) => void;
  onClick: () => void;
}) {
  const waLink = `https://wa.me/${property.phone}?text=${encodeURIComponent(
    `Hi, I'm interested in "${property.name}" listed on Digital Nairobi.`
  )}`;

  const formattedPrice = property.price.toLocaleString("en-KE");

  // Cover image: first property_photos image if any, else property.image, else null
  const coverImage =
    property.photos && property.photos.length > 0
      ? property.photos[0].url
      : property.image;

  // Show bed/bath only for residential types where they make sense
  const showSpecs =
    property.bedrooms != null && property.bathrooms != null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition group cursor-pointer"
    >
      {/* Photo + badges + price */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-5xl">
            🏠
          </div>
        )}

        {/* For Rent / For Sale badge — top-left */}
        <span
          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${
            property.listing_type === "Rent"
              ? "bg-green-500 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          For {property.listing_type}
        </span>

        {/* Heart icon — top-right (visual only for now) */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-slate-600 shadow-sm transition"
          aria-label="Save property"
        >
          ♡
        </button>

        {/* Price — bottom-left overlay */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
          KES {formattedPrice}
          {property.price_unit === "month" && (
            <span className="text-xs font-normal opacity-80">/mo</span>
          )}
        </div>

        {/* Property type — bottom-right */}
        <span className="absolute bottom-3 right-3 bg-white/95 text-slate-700 text-xs font-medium px-2 py-1 rounded-full">
          {property.property_type}
        </span>
      </div>

      {/* Info block */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1 line-clamp-1">
          {property.name} {property.is_verified && (
  <span className="inline-flex items-center justify-center text-blue-500 ml-1" title="Verified">
    ✓
  </span>
    )}
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {property.region} · Kenya
        </p>

        {/* Specs row — only for residential */}
        {showSpecs && (
          <div className="flex items-center gap-3 text-xs text-slate-600 mb-3 pb-3 border-b border-slate-100">
            <span className="flex items-center gap-1">
              🛏️ {property.bedrooms} Bed
            </span>
            <span className="flex items-center gap-1">
              🚿 {property.bathrooms} Bath
            </span>
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
  e.stopPropagation();
  trackLead("property", property.id, "whatsapp", "card");
}}
            className="flex-1 text-center text-xs font-medium bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition"
          >
            WhatsApp
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              trackLead("property", property.id, "360", "card");
              onView360();
            }}
            className="flex-1 text-xs font-medium bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 transition"
          >
            View 360°
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Property Detail Modal ----------
function PropertyDetailModal({
  property,
  onClose,
    onView360,
}: {
  property: Property;
  onClose: () => void;
    onView360: () => void;
}) {
  
  // Increment view count when modal opens
  useEffect(() => {
    if (!property?.id) return;
    supabase
      .from("views")
      .insert({
        listing_type: "property",
        listing_id: property.id,
      })
      .then(({ error }) => {
        if (error) console.error("View tracking failed:", error.message);
      });
  }, [property?.id]);
  const waLink = `https://wa.me/${property.phone}?text=${encodeURIComponent(
    `Hi, I'm interested in "${property.name}" listed on Digital Nairobi.`
  )}`;

  const formattedPrice = property.price.toLocaleString("en-KE");

  const coverImage =
    property.photos && property.photos.length > 0
      ? property.photos[0].url
      : property.image;

  const showSpecs =
    property.bedrooms != null && property.bathrooms != null;

  const allPhotos =
    property.photos && property.photos.length > 0
      ? property.photos.map((p) => p.url)
      : property.image
        ? [property.image]
        : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                property.listing_type === "Rent"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              For {property.listing_type}
            </span>
            <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {property.property_type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Cover image */}
        <div className="relative aspect-[16/9] bg-slate-100">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-blue-100 to-purple-100">
              🏠
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {property.name}
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {property.region} · Kenya
          </p>

          {/* Price */}
          <div className="text-2xl font-bold text-slate-900 mb-4">
            KES {formattedPrice}
            {property.price_unit === "month" && (
              <span className="text-sm font-normal text-slate-500">/month</span>
            )}
          </div>

          {/* Specs row */}
          {showSpecs && (
            <div className="flex items-center gap-6 text-sm text-slate-700 mb-6 pb-6 border-b border-slate-200">
              <span className="flex items-center gap-2">
                🛏️ <span className="font-medium">{property.bedrooms}</span> Bed
              </span>
              <span className="flex items-center gap-2">
                🚿 <span className="font-medium">{property.bathrooms}</span> Bath
              </span>
            </div>
          )}

          {/* Tagline */}
          {property.tagline && (
            <p className="text-sm font-medium text-slate-700 mb-4">
              {property.tagline}
            </p>
          )}

          {/* Description */}
          {property.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                About this property
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          {/* Photo gallery */}
          {allPhotos.length > 1 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Photos
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {allPhotos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`${property.name} photo ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border border-slate-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 360° tour button */}
          {property.panoramas && property.panoramas.length > 0 && (
            <button
                    onClick={onView360}
              className="w-full mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium py-3 rounded-lg hover:bg-emerald-100 transition"
            >
              🌐 View 360° Tour ({property.panoramas.length} rooms)
            </button>
          )}

          {/* CTAs */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
            >
              WhatsApp
            </a>
            <a
              href={`tel:+${property.phone}`}
              className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              📞 Call
            </a>
          </div>
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

     const [contentTab, setContentTab] = useState<"businesses" | "properties">("businesses");
  const [searchQuery, setSearchQuery] = useState("");

const countyOf = (name: string): "Nairobi" | "Kiambu" | "Machakos" =>
  KIAMBU_REGIONS.includes(name) ? "Kiambu" : 
  MACHAKOS_REGIONS.includes(name) ? "Machakos" : "Nairobi";

  const pickRegion = (name: string) => {
    setSelected(name);
    setTab("360");
  };

  const regionProps = (name: string, county: "Nairobi" | "Kiambu" | "Machakos") => ({
    "data-region": name,
    "data-county": county,
    onMouseEnter: () => setHovered(name),
    onMouseLeave: () => setHovered(null),
    onClick: () => pickRegion(name),
    style: { cursor: "pointer" } as React.CSSProperties,
  });

 const fillFor = (name: string, county: "Nairobi" | "Kiambu" | "Machakos") => {
    if (selected === name) return county === "Kiambu" ? "#7c3aed" : "#1d4ed8";
    if (hovered === name) return county === "Kiambu" ? "#a78bfa" : "#60a5fa";
    return county === "Kiambu" ? "#c4b5fd" : "#93c5fd";
  };

  const strokeFor = (county: "Nairobi" | "Kiambu" | "Machakos") =>
    county === "Kiambu" ? "#5b21b6" : "#1e40af";

   const [businesses, setBusinesses] = useState<Business[]>([]);
     const [reviews, setReviews] = useState<any[]>([]);
       const [reviewModalOpen, setReviewModalOpen] = useState(false);
         const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
           const [reviewsListBusiness, setReviewsListBusiness] = useState<any>(null);
    const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [selectedProperty360, setSelectedProperty360] = useState<Property | null>(null);
    const [selectedBusinessDetail, setSelectedBusinessDetail] = useState<Business | null>(null);

  useEffect(() => {
    
    let cancelled = false;
    const fetchBusinesses = async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("is_paid", true);

      if (error) {
        console.error("Error fetching businesses:", error);
        setBusinesses([]);
        return;
      }

      const bizList = (data as Business[]) || [];

      // If there are businesses, fetch their photos in a single query
      if (bizList.length > 0) {
        const bizIds = bizList.map((b) => b.id);
        const { data: photoData, error: photoError } = await supabase
          .from("photos")
          .select("*")
          .in("business_id", bizIds)
          .order("sort_order", { ascending: true });

        if (photoError) {
          console.error("Error fetching photos:", photoError);
        } else if (photoData) {
          bizList.forEach((b) => {
            b.photos = (photoData as any[]).filter(
              (p) => p.business_id === b.id
            );
          });
        }
        
    // Fetch panoramas for these businesses
    const { data: panoData, error: panoError } = await supabase
      .from("business_panoramas")
      .select("*")
      .in("business_id", bizIds)
      .order("sort_order", { ascending: true });

    if (panoError) {
      console.error("Error fetching panoramas:", panoError);
    } else if (panoData) {

      bizList.forEach((b) => {
        b.panoramas = (panoData as any[]).filter(
          (p) => p.business_id === b.id
        );
    
      });
    }
      }

          if (!cancelled) setBusinesses(bizList);
    };
      
          const fetchReviews = async () => {
        const { data, error } = await supabase
          .from("reviews")
          .select("*");

        if (error) {
          console.error("Error fetching reviews:", error);
          return;
        }

        setReviews(data || []);
      };

    fetchBusinesses();
      // Fetch properties for the selected region
      (async () => {
        const { data: propData, error: propError } = await supabase
          .from("properties")
          .select("*")
          .eq("is_paid", true)
          .eq("status", "approved");

        if (propError) {
          console.error("Error fetching properties:", propError);
          setProperties([]);
          return;
        }

        const propList = (propData as Property[]) || [];

        if (propList.length > 0) {
          const propIds = propList.map((p) => p.id);
          const { data: photoData, error: photoError } = await supabase
            .from("property_photos")
            .select("*")
            .in("property_id", propIds)
            .order("sort_order", { ascending: true });

          if (photoError) {
            console.error("Error fetching property photos:", photoError);
          } else if (photoData) {
            propList.forEach((p) => {
              p.photos = (photoData as any[]).filter(
                (ph) => ph.property_id === p.id
              );
            });
          }
          
      // Fetch panoramas for these properties
      const { data: propPanoData, error: propPanoError } = await supabase
        .from("property_panoramas")
        .select("*")
        .in("property_id", propIds)
        .order("sort_order", { ascending: true });

      if (propPanoError) {
        console.error("Error fetching property panoramas:", propPanoError);
      } else if (propPanoData) {
        propList.forEach((p) => {
          p.panoramas = (propPanoData as any[]).filter(
            (pp) => pp.property_id === p.id
          );
        });
      }
        }

        setProperties(propList);
      })();
        fetchReviews();
     return () => {
      cancelled = true;
    };
      }, []);
  
  const fetchReviewsAll = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*");

    if (error) {
      console.error("Error fetching reviews:", error);
      return;
    }

    setReviews(data || []);
  };
  
  // Track WhatsApp/Call/360° clicks as leads
  const trackLead = (
    listingType: "business" | "property",
    listingId: string,
    action: "whatsapp" | "call" | "share" | "view"| "360",
    source?: string
  ) => {
    supabase
      .from("leads")
      .insert({
        listing_type: listingType,
        listing_id: listingId,
        action,
        source: source || null,
      })
      .then(({ error }) => {
        if (error) console.error("Lead tracking failed:", error.message);
      });
  };
    // Filter arrays based on search query
  const filteredBusinesses = businesses.filter((b) => 
    searchQuery === "" || 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProperties = properties.filter((p) => 
    searchQuery === "" || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.property_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-50">
            {/* ============ PREMIUM HEADER ============ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏙️</span>
            <span className="font-bold text-xl text-emerald-900 tracking-tight">Digital Nairobi</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://wa.me/254715363005" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-emerald-900 transition">
              Customer Care
            </a>
            <a href="/signup/listing" className="bg-emerald-900 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-emerald-800 transition shadow-md">
              List Your Business
            </a>
          </div>
        </div>
      </header>
            {/* ============ FLOATING CUSTOMER CARE ============ */}
      <a
        href="https://wa.me/254715363005?text=Hi%20Digital%20Nairobi,%20I%20need%20help%20with%20a%20listing."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Chat on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
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
                   <span className="inline-block text-xs uppercase tracking-[0.3em] text-emerald-200 font-semibold mb-6 bg-emerald-900/50 px-4 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-sm">
            Nairobi · Kiambu · Machakos
          </span>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
            Discover the Best of <br className="hidden md:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">Digital Nairobi</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mb-10 font-medium">
            The most trusted directory for businesses, real estate, and 360° virtual tours across Kenya.
          </p>

          {/* THE SEARCH BAR */}
          <div className="w-full max-w-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center bg-white rounded-xl px-4 py-3">
              <span className="text-slate-400 mr-3 text-xl">🔍</span>
                          <input 
                type="text" 
                placeholder="Search boutiques, apartments, plots..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium"
              />
                       <button 
              onClick={() => {
                const resultsSection = document.getElementById("explore");
                if (resultsSection) resultsSection.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-lg px-8 py-3 rounded-xl transition shadow-lg shrink-0"
            >
              Search
            </button>
          </div>
          </div>
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

        <div className="mb-8">
          

          {/* RIGHT PANEL */}
          <div className="w-full bg-white rounded-2xl shadow p-6">
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
                               <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-500 font-medium">
                    Browse by Category
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                  {[
                    { label: "Boutiques", icon: "👗" },
                    { label: "Salons", icon: "💇🏽‍♀️" },
                    { label: "Real Estate", icon: "🏠" },
                    { label: "Food & Drink", icon: "🍔" },
                    { label: "Electronics", icon: "📱" },
                    { label: "Hardware", icon: "🔧" },
                  ].map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => {
                        setSearchQuery(cat.label);
                        document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 p-4 rounded-xl text-center transition group"
                    >
                      <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-900">{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-emerald-900 rounded-xl p-6 text-center shadow-inner">
                  <h3 className="text-white font-bold text-lg mb-2">Can't find what you need?</h3>
                  <p className="text-emerald-100 text-sm">Search across all 47 regions in Nairobi, Kiambu, and Machakos using the search bar above.</p>
                </div>
              </div>
            )}

            {tab === "360" && (
              <div>
                {selected ? (
                  <>
                <Panorama360
  region={selected}
  panoramaUrl={businesses.find((b) => b.panorama_url)?.panorama_url}
/>
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
      {(selected || searchQuery !== "") && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                {contentTab === "businesses" ? "Businesses" : "Properties"} in {selected || "Search Results"}
              </h2>
              <p className="text-slate-600 text-sm">
                             {contentTab === "businesses"
                ? `${filteredBusinesses.length} places · click WhatsApp to contact`
                : `${filteredProperties.length} listings · click WhatsApp to enquire`}
              </p>
            </div>
                       <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  selected && countyOf(selected) === "Kiambu"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {selected ? `${countyOf(selected)} County` : "Search Results"}
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
              🏪 Businesses ({filteredBusinesses.length})
            </button>
            <button
              onClick={() => setContentTab("properties")}
              className={`px-5 py-2 text-sm font-medium rounded-full transition ${
                contentTab === "properties"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏠 Properties ({filteredProperties.length})
            </button>
          </div>

          {contentTab === "businesses" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
             {filteredBusinesses.map((b) => (
                <BusinessCard
                  key={b.id}
                  business={b}
                            onView360={(biz) => {
            setFullscreenBusiness(biz);
          }}
                    onClick={(biz) => setSelectedBusinessDetail(biz)}
                            reviews={reviews}
            onLeaveReview={(biz) => {
            setSelectedBusiness(biz);
            setReviewModalOpen(true);
          }}
          onViewReviews={(biz) => setReviewsListBusiness(biz)}
                trackLead={trackLead}
                />
              ))}
            </div>
          )}

          {contentTab === "properties" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                         {filteredProperties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onClick={() => setSelectedProperty(p)}
                onView360={() => setSelectedProperty(p)}
                                trackLead={trackLead}
              />
            ))}
            </div>
          )}
        </div>
      )}

        {/* No region selected yet — prompt */}
        {(!selected && searchQuery === "") && (
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
          onClose={() => setFullscreenBusiness(null)}
        />
      )}
      
      {/* Review Modal */}
      {reviewModalOpen && selectedBusiness && (
        <ReviewModal
          business={selectedBusiness}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedBusiness(null);
          }}
          onSubmitted={() => {
            setReviewModalOpen(false);
            setSelectedBusiness(null);
                       fetchReviewsAll();
          }}
        />
      )}
      
      {/* Reviews List Modal */}
      {reviewsListBusiness && (
        <ReviewsListModal
          business={reviewsListBusiness}
          reviews={reviews}
          onClose={() => setReviewsListBusiness(null)}
          onLeaveReview={() => {
            setSelectedBusiness(reviewsListBusiness);
            setReviewModalOpen(true);
          }}
               />
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
                onView360={() => {
        setSelectedProperty360(selectedProperty);
        setSelectedProperty(null);
      }}
        />
      )}

      
      {/* Business Detail Modal */}
      {selectedBusinessDetail && (
        <BusinessDetailModal
          business={selectedBusinessDetail}
          onClose={() => setSelectedBusinessDetail(null)}
        />
      )}
      
      {/* Property 360 Viewer */}
      {selectedProperty360 && (
        <Property360Viewer
          property={selectedProperty360}
          onClose={() => setSelectedProperty360(null)}
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