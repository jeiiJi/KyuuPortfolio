import { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/inkdrop-logo.png";
import brandName from "./assets/brand-name.png";
import placeholder from "./assets/placeholder.svg";
import heroArtwork from "./assets/Untitled200_20261016201217.png";
import chibiReference from "./assets/Untitled201_20261021205439.png";
const API_URL = "";

type Page = "home" | "guide" | "commission" | "admin";
type CommissionRequest = {
  id: number; name: string; email: string; social: string; type: string; finish: string;
  characters: number; background: string; commercial: boolean; priority: boolean;
  dueDate: string; notes: string; references: string[]; totalPhp: number;
  submittedAt: string; stage: number;
  historyType?: "Finished" | "Cancelled"; submittedToHistoryAt?: string;
};
type PublishedItem = {
  id: number; title: string; description: string; image: string; category: string;
  scope?: string; service?: string; colorFinish?: string;
  imageCount?: number; tools?: string; format?: string;
  publishedAt: string;
};
type GallerySelection = { category: "Chibi" | "Semi-Realistic"; facet: "Scope" | "Services" | "Color Finish"; value: string };
type AdminLibraryItem = {
  id: number; title: string; description: string; image?: string;
  category?: string; publishedAt?: string;
  artStyle?: string; scope?: string; service?: string; colorFinish?: string;
  tools?: string; format?: string; imageCount?: number; images?: string[];
};
type IconName =
  | "arrow"
  | "brush"
  | "calendar"
  | "check"
  | "close"
  | "grid"
  | "heart"
  | "instagram"
  | "facebook"
  | "mail"
  | "menu"
  | "more"
  | "logout"
  | "pen"
  | "plus"
  | "spark"
  | "trash"
  | "user"
  | "clock"
  | "eye"
  | "eye-off";

const Icon = ({ name, size = 18 }: { name: IconName; size?: number }) => {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    brush: <><path d="M14.5 4.5l5 5L9 20H4v-5L14.5 4.5Z" /><path d="m12 7 5 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" /></>,
    facebook: ( <><circle cx="12" cy="12" r="9" /><path d="M13.5 19v-6h2l.3-2.3h-2.3V9.2c0-.7.2-1.1 1.2-1.1H16V6.1c-.2 0-.9-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.2v1.5H9v2.3h2.1v6h2.4Z" fill="currentColor" stroke="none"/></>),
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
    more: <><circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" /></>,
    pen: <><path d="m15 5 4 4L8 20H4v-4L15 5Z" /><path d="m13 7 4 4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    spark: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    "eye-off": <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const Btn = ({ children, kind = "primary", onClick, type = "button", className = "", style, disabled }: { children: React.ReactNode; kind?: "primary" | "outline" | "ghost"; onClick?: () => void; type?: "button" | "submit"; className?: string; style?: React.CSSProperties; disabled?: boolean }) => (
  <button type={type} className={`btn btn-${kind} ${className}`} onClick={onClick} style={style} disabled={disabled}><span className="btn-label">{children}</span></button>
);

const apiRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, { credentials: "same-origin", ...init });
  if (response.status === 401) window.dispatchEvent(new Event("inkyuu:signed-out"));
  const text = await response.text();
  let data: unknown;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(response.ok ? "The server returned an invalid response." : text || `Request failed (${response.status}).`);
  }

  if (!response.ok) {
    const serverError = data && typeof data === "object" && "error" in data && typeof data.error === "string"
      ? data.error
      : `Request failed (${response.status}).`;
    throw new Error(serverError);
  }

  return data as T;
};

function useApiData<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<T[]>(path)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error(`The server returned invalid data for ${path}.`);
        if (active) {
          setItems(data);
          setError("");
        }
      })
      .catch((loadError) => {
        if (!active) return;
        const message = loadError instanceof Error ? loadError.message : String(loadError);
        setError(message);
        console.error(`Failed to load ${path} from D1:`, loadError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [path]);

  return { items, error, loading };
}
const money = (php: number) => `₱${php.toLocaleString()}`;

function Navbar({ page, go }: { page: Page; go: (page: Page) => void }) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when mobile nav drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Handle smooth scrolling to section IDs on the Home page
  const scrollToSection = (sectionId: string) => {
    setOpen(false);
    if (page !== "home") {
      go("home");
      // Wait for home page render before scrolling
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <div className="nav-actions left-action">
          <button
            type="button"
            className="menu-button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>

        <button className="brand" onClick={() => { go("home"); setOpen(false); }} aria-label="Inkyuu home">
          <img className="brand-symbol" src={logo} alt="" />
          <img className="brand-wordmark" src={brandName} alt="Inkyuu" />
        </button>

        {/* Backdrop positioned below the navbar */}
        {open && (
          <div className="nav-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
        )}

        <nav id="primary-nav" className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <button
            type="button"
            onClick={() => {
              if (page !== "home") go("home");
              else window.scrollTo({ top: 0, behavior: "smooth" });
              setOpen(false);
            }}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("about-section")}
          >
            About
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("home-gallery-section")}
          >
            Gallery
          </button>
        </nav>

        <div className="nav-actions">
          <Btn onClick={() => { go("commission"); setOpen(false); }}>
            Commission Now
          </Btn>
        </div>
      </div>
    </header>
  );
}

function ArtVisual({ art, label }: { art: string; label: string }) {
  return <div className={`art-visual art-${art}`}><img src={placeholder} alt={label} /></div>;
}

function Home({ go }: { go: (page: Page, selection?: GallerySelection) => void }) {
  const { items: published } = useApiData<PublishedItem>("/api/gallery");
  
  // Gallery state integrated directly into Home
  const [filter, setFilter] = useState<"Chibi" | "Semi-Realistic">("Chibi");
  const [scopeValue, setScopeValue] = useState("");
  const [contextValue, setContextValue] = useState("");
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const allItems: GalleryItem[] = published.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.category?.startsWith("Semi-Realistic") ? "Semi-Realistic" : "Chibi",
    desc: item.description,
    image: item.image,
    imageCount: item.imageCount,
    size: "medium",
    tags: ["published", item.category || "Chibi", item.scope, item.service || item.category?.match(/\(([^)]+)\)/)?.[1], item.colorFinish].filter((tag): tag is string => Boolean(tag)),
    publishedAt: item.publishedAt,
    scope: item.scope,
    service: item.service || item.category?.match(/\(([^)]+)\)/)?.[1],
    colorFinish: item.colorFinish,
    tools: item.tools,
    format: item.format,
  }));

  const scopeOptions = filter === "Chibi" ? ["Headshot", "Fullbody"] : ["Headshot", "Bust-up", "Waist-up", "Thigh-up"];
  const contextLabel = filter === "Chibi" ? "Service" : "Color Finish";
  const contextOptions = filter === "Chibi"
    ? ["Solo Deals", "Sticker set", "Acrylic Merch", "Badges/Pins/Pfp Design", "Character Reference sheet", "2D Model character sheet", "YCH", "Alternate outfits/expressions"]
    : ["Rendered", "Plain", "Monochrome"];

  const visible = allItems.filter((item) => {
    if (item.type !== filter) return false;
    if (scopeValue && item.scope !== scopeValue) return false;
    if (!contextValue) return true;
    const value = filter === "Chibi" ? item.service : item.colorFinish;
    return value === contextValue;
  });

  const visual = (item: GalleryItem) => {
    if ("image" in item && item.image) {
      return <img className="gallery-real-image" src={item.image} alt={item.title} />;
    }
    return <ArtVisual art="placeholder" label={item.title} />;
  };

  // Handle loading full image sets for modals
  useEffect(() => {
    if (!selected || !("image" in selected)) {
      setSelectedImages([]);
      return;
    }
    setSelectedImages(selected.image ? [selected.image] : []);
    if (!selected.imageCount || selected.imageCount < 2) return;
    let active = true;
    apiRequest<{ images: string[] }>(`/api/gallery/${selected.id}/images`)
      .then((data) => {
        if (active && Array.isArray(data.images) && data.images.length) setSelectedImages(data.images);
      })
      .catch((loadError) => console.error("Failed to load the full image set:", loadError));
    return () => { active = false; };
  }, [selected]);

  const canvasCards: { icon: IconName; title: string; desc: string; selection: GallerySelection }[] = [
    { icon: "brush", title: "Character art", desc: "Originals, fan art & portraits", selection: { category: "Semi-Realistic", facet: "Scope", value: "Headshot" } },
    { icon: "pen", title: "Chibi cuties", desc: "Tiny style, big personality", selection: { category: "Chibi", facet: "Scope", value: "Headshot" } },
    { icon: "spark", title: "Merch design", desc: "Stickers, cards & keepsakes", selection: { category: "Chibi", facet: "Services", value: "Sticker set" } },
    { icon: "grid", title: "Visual stories", desc: "Covers, scenes & key art", selection: { category: "Semi-Realistic", facet: "Color Finish", value: "Rendered" } },
  ];

  return (
    <>
      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="hero wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> Digital artist & illustrator</div>
            <h1>Small moments,<br /><em>boldly drawn.</em></h1>
            <p>I turn warm ideas, favorite characters, and little daydreams into expressive digital art.</p>
            <div className="hero-actions">
              <Btn onClick={() => {
                const galleryEl = document.getElementById("home-gallery-section");
                galleryEl?.scrollIntoView({ behavior: "smooth" });
              }}>Explore my work <Icon name="arrow" /></Btn>
            </div>
          </div>
          <div className="hero-canvas">
            <div className="art-visual art-hero">
              <img src={heroArtwork} alt="Featured artwork" />
            </div>
          </div>
        </section>

        <ChalkDivider />

        {/* About Strip */}
        <section id="about-section" className="about-strip">
          <div className="wrap intro-grid">
            <div className="portrait-card"><ArtVisual art="artist" label="Illustrated portrait of the artist" /><span className="seal">ID<br />Artist</span></div>
            <div className="intro-copy">
              <p className="kicker">Meet the artist</p><h2>Hi, I'm Kyuu. I draw feelings you can keep.</h2>
              <p>I'm a digital illustrator who loves expressive faces, cozy color stories, and the magic of turning your favorite idea into something unmistakably yours.</p>
              <div className="quick-terms">
                <div>
                  <span>01</span>
                  <p><strong>Kind collaboration</strong>Clear communication from sketch to final.</p>
                </div>
                <div>
                  <span>02</span>
                  <p><strong>Made for you</strong> Personal use is included; commercial use is quoted.</p>
                </div>
                <div>
                  <span>03</span>
                  <p><strong>High-res files</strong> Delivered ready for print, web, or licensing.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EMBEDDED GALLERY SECTION */}
        <section id="home-gallery-section" className="section wrap">
          <div className="section-heading">
            <div><p className="kicker">Gallery</p><h2>Explore my work</h2></div>
          </div>

          <div className="filter-bar" style={{ position: "static", background: "transparent", border: "none", marginBottom: "20px" }}>
            <div className="filter-toggle sliding-filter" role="group" aria-label="Filter artwork">
              <div className={`filter-slider-indicator ${filter === "Semi-Realistic" ? "slide-right" : ""}`} aria-hidden="true" />
              {(["Chibi", "Semi-Realistic"] as const).map((item) => (
                <button key={item} type="button" className={`filter-btn ${filter === item ? "active" : ""}`} aria-pressed={filter === item} onClick={() => { setFilter(item); setScopeValue(""); setContextValue(""); }}>
                  {item}<span>{allItems.filter((art) => art.type === item).length}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sub-filter-bar" style={{ marginBottom: "30px", borderRadius: "8px" }}>
            <strong className="sub-filter-label">Filter</strong>
            <label className="sub-filter-select">
              <span className="sr-only">Scope</span>
              <select aria-label="Scope" value={scopeValue} onChange={(event) => setScopeValue(event.target.value)}>
                <option value="">Scope</option>
                {scopeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="sub-filter-select">
              <span className="sr-only">{contextLabel}</span>
              <select aria-label={contextLabel} value={contextValue} onChange={(event) => setContextValue(event.target.value)}>
                <option value="">{contextLabel}</option>
                {contextOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <button type="button" className="sub-filter-clear" onClick={() => { setScopeValue(""); setContextValue(""); }}>Clear filters</button>
          </div>

          <div className="gallery-grid" style={{ paddingTop: 0 }}>
            {visible.map((item) => (
              <button className={`gallery-card gallery-image-only ${item.size}`} key={item.id} onClick={() => setSelected(item)} aria-label={`View ${item.title} details`}>
                {visual(item)}
                <span className="gallery-hover">View artwork <Icon name="arrow" /></span>
              </button>
            ))}
            {visible.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
                <p>No {[scopeValue, contextValue, filter].filter(Boolean).join(" ")} artwork has been added yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Modal for viewing individual artwork details */}
        {selected && (
          <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
            <div className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-title" onMouseDown={(e) => e.stopPropagation()}>
              <button type="button" className="modal-close" aria-label="Close artwork details" autoFocus onClick={() => setSelected(null)}><Icon name="close" /></button>
              <ImageCarousel key={selected.id} images={selectedImages} title={selected.title} />
              <div className="project-copy">
                <p className="kicker">{selected.type} · Featured project</p>
                <h2 id="project-title">{selected.title}</h2>
                <p>{selected.desc}</p>
                <div className="tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <div className="project-meta">
                  <span>Published<strong>{"publishedAt" in selected ? selected.publishedAt : "2025"}</strong></span>
                  {"tools" in selected && selected.tools && <span>Tools<strong>{selected.tools}</strong></span>}
                  {"format" in selected && selected.format && <span>Format<strong>{selected.format}</strong></span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="home-commission-cta">
          <div className="wrap">
            <h2>Ready to bring your idea to life?</h2>
            <p>Tell me what you’re imagining and receive a personalized quote.</p>
            <Btn onClick={() => go("commission")}>Commission now <Icon name="arrow" /></Btn>
          </div>
        </section>
      </main>
    </>
  );
}

type GalleryItem =
  | {
      id: number;
      title: string;
      type: string;
      desc: string;
      art: string;
      size: string;
      tags: string[];
      scope?: string;
      service?: string;
      colorFinish?: string;
    }
  | {
      id: number;
      title: string;
      type: string;
      desc: string;
      image: string;
      imageCount?: number;
      size: string;
      tags: string[];
      publishedAt: string;
      scope?: string;
      service?: string;
      colorFinish?: string;
      tools?: string;
      format?: string;
    };

function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const total = images.length;

  useEffect(() => { setIndex(0); }, [images]);

  const step = (delta: number) => setIndex((current) => (current + delta + total) % total);

  useEffect(() => {
    if (total < 2) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + total) % total);
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % total);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [total]);

  if (total === 0) {
    return <div className="project-image"><ArtVisual art="placeholder" label={title} /></div>;
  }

  return (
    <div
      className="project-image carousel"
      role={total > 1 ? "group" : undefined}
      aria-roledescription={total > 1 ? "carousel" : undefined}
      aria-label={total > 1 ? `${title}, ${total} images` : undefined}
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null || total < 2) return;
        const distance = event.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (Math.abs(distance) > 45) step(distance < 0 ? 1 : -1);
      }}
    >
      <img className="gallery-real-image" src={images[index]} alt={total > 1 ? `${title}, image ${index + 1} of ${total}` : title} />

      {total > 1 && (
        <>
          <button type="button" className="carousel-btn prev" aria-label="Previous image" onClick={() => step(-1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="carousel-btn next" aria-label="Next image" onClick={() => step(1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="carousel-dots" role="group" aria-label="Choose an image">
            {images.map((_, position) => (
              <button
                key={position}
                type="button"
                className={position === index ? "on" : ""}
                aria-label={`Show image ${position + 1} of ${total}`}
                aria-current={position === index}
                onClick={() => setIndex(position)}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">Image {index + 1} of {total}</p>
        </>
      )}
    </div>
  );
}

const ChalkField = ({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) => (
  <label className="field"><span>{label}</span>{hint && <small>{hint}</small>}<span className="chalk-input">{children}</span></label>
);

const Field = ({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) => <label className="field"><span>{label}</span>{hint && <small>{hint}</small>}{children}</label>;

function Commission({ go }: { go: (page: Page) => void }) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    email: "",
    social: "",
    dueDate: "",
    artStyle: "",
    usageType: "",
    baseOption: "",
    chibiService: "",
    stickerCount: 4,
    alternativesCount: 2,
    ychTheme: "",
    colorOption: "",
    bgOption: "",
    characters: 1,
    backgroundDetails: "",
    additionalDetails: "",
    confirm1: false,
    confirm2: false,
    confirm3: false,
  });
  const [references, setReferences] = useState<string[]>([]);
  const { items: requests, error: requestError, loading: requestsLoading } = useApiData<CommissionRequest>("/api/commissions");

  const setValue = (key: keyof typeof form, value: any) => {
    if (key === "artStyle" && value === "Semi-Realistic" && form.artStyle !== "Semi-Realistic") {
      if (requestsLoading) {
        alert("Commission availability is still loading. Please try again in a moment.");
        return;
      }
      const activeSemiCount = requests.filter(r => !r.historyType && r.type.startsWith("Semi-Realistic")).length;
      
      if (activeSemiCount >= 5) {
        alert("Semi-Realistic commissions are currently unavailable as all active and reservation slots are fully occupied.");
        return;
      } else if (activeSemiCount >= 3) {
        alert("All active Semi-Realistic slots are currently taken. Your order will be placed in a reserved slot.");
      }
    }
    if (key === "artStyle") {
      setForm((prev) => ({
        ...prev,
        artStyle: value,
        baseOption: "",
        chibiService: "",
        ychTheme: "",
        colorOption: "",
        bgOption: "",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const basePrice = form.artStyle === "Chibi" 
    ? (form.baseOption === "Headshot" ? 170 
      : form.baseOption === "Fullbody" ? 200 : 0) 
    : form.artStyle === "Semi-Realistic" 
    ? (form.baseOption === "Headshot" ? 250 
      : form.baseOption === "Bust-up" ? 380 
      : form.baseOption === "Waist-up" ? 520 
      : form.baseOption === "Thigh-up" ? 680 : 0)
    : 0;

  const calculateChibiServicePrice = () => {
    if (form.artStyle !== "Chibi" || !form.chibiService) return 0;

    switch (form.chibiService) {
      case "Solo Deals":
        return basePrice;
      case "Sticker set": {
        const discount = 20 + (form.stickerCount - 4) * 10;
        return (basePrice * form.stickerCount) - discount;
      }
      case "Acrylic Merch":
        return basePrice + 50;
      case "Badges/Pins/Pfp Design":
        return basePrice + 30;
      case "Character Reference sheet":
        return (basePrice * 4) + 30;
      case "2D Model character sheet":
        return (basePrice * 5) + 300;
      case "YCH":
        return Math.max(0, basePrice - 10);
      case "Alternate outfits/expressions":
        return (basePrice * form.alternativesCount) + 30;
      default:
        return 0;
    }
  };

  const chibiServicePrice = calculateChibiServicePrice();

  const colorPrice = form.artStyle === "Semi-Realistic" 
    ? (form.colorOption === "Rendered" ? 475 
      : form.colorOption === "Plain" ? 280 : 0)
    : 0;

  const bgPrice = form.artStyle === "Chibi" 
    ? (form.bgOption === "Complex" ? 50 
      : form.bgOption === "Plain" ? 0
      : form.bgOption === "None/Transparent" ? 0 : 0) 
    : form.artStyle === "Semi-Realistic" 
    ? (form.bgOption === "Complex" ? 220 
      : form.bgOption === "Plain" ? 150 
      : form.bgOption === "None/Transparent" ? 680 : 0)
    : 0;
  
  const scopeAndOptionsTotal = form.artStyle === "Chibi"
    ? chibiServicePrice + bgPrice
    : basePrice + colorPrice + bgPrice;

  const charMultiplier = form.characters > 1 
    ? (form.characters - 1) * (
        form.artStyle === "Semi-Realistic" 
          ? Math.round(scopeAndOptionsTotal * 0.80 + 50) 
          : form.artStyle === "Chibi" 
          ? Math.round(scopeAndOptionsTotal * 0.80 + 35) 
          : 0
      ) 
    : 0;
  
  const subtotal = scopeAndOptionsTotal + charMultiplier;
  const commercialFee = form.usageType === "Commercial Use" ? 500 : 0;

  const getDueDatePercentage = () => {
    if (!form.dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(form.dueDate);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 14 ? 0.10 : 0.18;
  };

  const dueDateRate = getDueDatePercentage();
  const priorityFee = form.dueDate ? Math.round(subtotal * dueDateRate) : 0;
  const total = subtotal + commercialFee + priorityFee;
  const estimateBreakdown = (
    <>
      <p><span>{form.artStyle ? `${form.artStyle} (${form.baseOption || "Select base"})` : "Base scope"}</span><b>{money(basePrice)}</b></p>
      {form.artStyle === "Chibi" ? (
        <p><span>Chibi finish</span><b>Rendered (Free)</b></p>
      ) : (
        <p><span>{form.colorOption || "Color finish"}</span><b>+{money(colorPrice)}</b></p>
      )}
      {form.chibiService && (
        <p>
          <span>
            Service: {form.chibiService}
            {form.chibiService === "Sticker set" ? ` (${form.stickerCount} stickers)` : ""}
            {form.chibiService === "Alternate outfits/expressions" ? ` (${form.alternativesCount} options)` : ""}
          </span>
          <b>+{money(chibiServicePrice)}</b>
        </p>
      )}
      <p><span>{form.bgOption || "Background"} background</span><b>+{money(bgPrice)}</b></p>
      {form.characters > 0 && <p><span>{form.characters} character{form.characters > 1 ? "s" : ""}</span><b>+{money(charMultiplier)}</b></p>}
      {(form.usageType === "Commercial Use" || form.dueDate) && (
        <>
          <p className="estimate-subheading"><span>Additional Fees</span></p>
          {form.usageType === "Commercial Use" && <p><span>Commercial license</span><b>+{money(commercialFee)}</b></p>}
          {form.dueDate && <p><span>Priority due date fee ({dueDateRate === 0.1 ? "10%" : "18%"})</span><b>+{money(priorityFee)}</b></p>}
        </>
      )}
    </>
  );

  const uploadReferences = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 10 - references.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setReferences((current) => [...current, String(reader.result)].slice(0, 10));
      reader.readAsDataURL(file);
    });
  };

  const removeReference = (index: number) => {
    setReferences((current) => current.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1 && (!form.confirm1 || !form.confirm2 || !form.confirm3)) {
      alert("Please check all three confirmation boxes to proceed.");
      return;
    }
    if (step === 2 && (!form.name || !form.email || !form.usageType)) {
      alert("Please fill in your name, email, and usage type.");
      return;
    }
    if (step === 3) {
      if (!form.artStyle) {
        alert("Please select an Art Style.");
        return;
      }
      if (!form.baseOption || !form.bgOption) {
        alert("Please select your base scope and background style.");
        return;
      }
      if (form.artStyle === "Chibi" && !form.chibiService) {
        alert("Please select a Chibi Solo Deal / Service.");
        return;
      }
      if (form.artStyle === "Chibi" && form.chibiService === "YCH" && !form.ychTheme) {
        alert("Please select a YCH theme.");
        return;
      }
      if (form.artStyle === "Semi-Realistic" && !form.colorOption) {
        alert("Please select your color finish.");
        return;
      }
    }
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handleFinalSubmit = async () => {
    const request: CommissionRequest = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      social: form.social,
      type: `${form.artStyle} - ${form.baseOption}${form.chibiService ? ` (${form.chibiService})` : ""}`,
      finish: form.artStyle === "Chibi" ? "Rendered (Default)" : form.colorOption,
      characters: form.characters,
      background: form.bgOption,
      commercial: form.usageType === "Commercial Use",
      priority: Boolean(form.dueDate),
      dueDate: form.dueDate,
      notes: `Usage: ${form.usageType}\nService: ${form.chibiService || "N/A"}${form.chibiService === "Alternate outfits/expressions" ? ` (${form.alternativesCount} alternatives)` : ""}${form.ychTheme ? `\nYCH Theme: ${form.ychTheme}` : ""}\nBg Details: ${form.backgroundDetails}\nNotes: ${form.additionalDetails}\nConfirmed all terms: Yes`,
      references,
      totalPhp: total,
      submittedAt: new Date().toISOString(),
      stage: 0,
    };

    try {
      await apiRequest<{ success: boolean }>("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });

      alert("Your commission request was successfully submitted to the database!");
      go("home");
    } catch (error) {
      console.error("Submission Error Details:", error);
      alert(`Failed to save request: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const maxChars = form.artStyle === "Chibi" ? 4 : form.artStyle === "Semi-Realistic" ? 2 : 4;

  return (
    <main id="main-content" tabIndex={-1} className="page-main commission-page">
      <section className="page-hero wrap">
        <p className="kicker">Commission Request Form</p>
        <h1>Let's make something <em>yours.</em></h1>
        <p>Step-by-step studio commission intake modeled after live Google Forms.</p>
      </section>
      {requestError && <p className="wrap" role="alert">Live commission data could not be loaded: {requestError}</p>}

      <div className={`wrap commission-layout ${step > 2 && step < 5 ? "has-estimate" : "without-estimate"}`}>
        <div className="commission-form">
          <div className="commission-progress">
            <div>
              <span className="commission-progress-step">Section {step} of 5</span>
              <h3 style={{ margin: "2px 0 0", fontFamily: "DM Serif Display", fontSize: "20px" }}>
                {step === 1 && "Terms of Service Agreement & Confirmation"}
                {step === 2 && "General Information"}
                {step === 3 && `${form.artStyle || "Art"} Scope & Options`}
                {step === 4 && "Project References & Final Notes"}
                {step === 5 && "Review & Checkout"}
              </h3>
            </div>
            <div className="commission-progress-track">
              <div className="commission-progress-fill" style={{ width: `${(step / 5) * 100}%` }} />
            </div>
          </div>

          {step === 1 && (
            <div className="form-section form-section-accent">
              <div className="form-number">01</div>
              <div>
                <h2>Terms of Service Agreement & Confirmation <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></h2>
                <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: "1.6", marginTop: "6px" }}>
                  Please review and check each box below to proceed with your application. By checking these requirements, you acknowledge that you have read the official Commission Guide and explicitly agree to follow these operational boundaries throughout our project.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
                <label className="check-row" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.confirm1} onChange={(e) => setValue("confirm1", e.target.checked)} />
                  <span><strong>Guide Review <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></strong><small>I confirm that I have accessed, read, and fully understood the rules and regulations provided in the official Commission Guide.</small></span>
                </label>
                <label className="check-row" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.confirm2} onChange={(e) => setValue("confirm2", e.target.checked)} />
                  <span><strong>Payment Terms <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></strong><small>I explicitly accept the payment terms, including the 20% mid-project downpayment and the mandatory 3-day final payment window upon artwork completion.</small></span>
                </label>
                <label className="check-row" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.confirm3} onChange={(e) => setValue("confirm3", e.target.checked)} />
                  <span><strong>Operational Boundaries <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></strong><small>I explicitly agree to follow all rules, regulations, and operational terms outlined within the guide for the duration of this project.</small></span>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-section form-section-accent">
              <div className="form-number">02</div>
              <div><h2>General Information</h2><p>Provide your contact details and usage preferences.</p></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Field label={<>Name / Nickname <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}>
                  <input value={form.name} onChange={(e) => setValue("name", e.target.value)} placeholder="Your name" />
                </Field>
                <Field label={<>Email address <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}>
                  <input type="email" value={form.email} onChange={(e) => setValue("email", e.target.value)} placeholder="you@example.com" />
                </Field>
                <Field label="Social media handle"><input value={form.social} onChange={(e) => setValue("social", e.target.value)} placeholder="@username" /></Field>
                
                <Field label="Planned due date (Optional)" hint="NOTE: Expected commissioned pieces will be labeled as PRIORITY. In PRIORITY, it will be prioritized over non-prioritized pieces, and will be charged an extra 18% of total price (or 10% if the due date is more than 14 days away).">
                  <input type="date" value={form.dueDate} onChange={(e) => setValue("dueDate", e.target.value)} />
                </Field>
                <Field label={<>Usage Type <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}>
                  <select value={form.usageType} onChange={(e) => setValue("usageType", e.target.value)}>
                    <option value="" disabled>-- Select Usage Type --</option>
                    <option value="Personal Use">Personal Use</option>
                    <option value="Commercial Use">Commercial Use</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-section form-section-accent">
              <div className="form-number">03</div>
              <div><h2>Art Style, Scope & Options</h2><p>Choose your art style, then select a composition and its matching options.</p></div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="field">
                  <span>Art Style <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></span>
                  <div className="art-style-grid">
                    {[
                      { name: "Chibi", art: "scout", description: "Cute, expressive character art" },
                      { name: "Semi-Realistic", art: "sunset", description: "Detailed portraits and illustrations" },
                    ].map(({ name, art, description }) => (
                      <button
                        key={name}
                        type="button"
                        className={`art-style-card ${form.artStyle === name ? "selected" : ""}`}
                        aria-pressed={form.artStyle === name}
                        onClick={() => setValue("artStyle", name)}
                      >
                        {name === "Chibi"
                          ? <div className="art-visual art-chibi-reference"><img src={chibiReference} alt="Chibi style example artwork" /></div>
                          : <ArtVisual art={art} label={`${name} example artwork`} />}
                        <span className="art-style-copy"><strong>{name}</strong><small>{description}</small></span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field" style={{ marginBottom: "8px" }}><span>Base Scope <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></span></label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {form.artStyle === "Chibi" ? (
                      [
                        ["Headshot", 170], 
                        ["Fullbody", 200]
                      ].map(([name, price]) => (
                        <button type="button" className={`choice-card ${form.baseOption === name ? "selected" : ""}`} aria-pressed={form.baseOption === name} onClick={() => setValue("baseOption", name)} key={name} style={{ width: "100%" }}>
                          <span className="radio" /><strong>{name}</strong><b>{money(Number(price))}</b><small>Chibi tier (Rendered by default)</small>
                        </button>
                      ))
                    ) : form.artStyle === "Semi-Realistic" ? (
                      [
                        ["Headshot", 250], 
                        ["Bust-up", 380], 
                        ["Waist-up", 520], 
                        ["Thigh-up", 680]
                      ].map(([name, price]) => (
                        <button type="button" className={`choice-card ${form.baseOption === name ? "selected" : ""}`} aria-pressed={form.baseOption === name} onClick={() => setValue("baseOption", name)} key={name} style={{ width: "100%" }}>
                          <span className="radio" /><strong>{name}</strong><b>{money(Number(price))}</b><small>Semi-realism tier</small>
                        </button>
                      ))
                    ) : (
                      <p style={{ color: "var(--muted)", fontSize: "14px" }}>Choose an Art Style to see the available scopes and options.</p>
                    )}
                  </div>
                </div>

                {form.artStyle === "Chibi" ? (
                  <>
                    <Field label={<>Chibi Solo Deal / Service <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}>
                      <select value={form.chibiService} onChange={(e) => setValue("chibiService", e.target.value)}>
                        <option value="" disabled>-- Select Chibi Service --</option>
                        <option value="Solo Deals">Solo Deals</option>
                        <option value="Sticker set">Sticker set</option>
                        <option value="Acrylic Merch">Acrylic Merch</option>
                        <option value="Badges/Pins/Pfp Design">Badges/Pins/Pfp Design</option>
                        <option value="Character Reference sheet">Character Reference sheet</option>
                        <option value="2D Model character sheet">2D Model character sheet</option>
                        <option value="YCH">YCH (Your Character Here)</option>
                        <option value="Alternate outfits/expressions">Alternate outfits/expressions</option>
                      </select>
                    </Field>

                    {form.chibiService === "Sticker set" && (
                      <Field label={<>Sticker Count (4 to 9 stickers) <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}>
                        <div className="stepper" style={{ maxWidth: "160px" }}>
                          <button type="button" onClick={() => setValue("stickerCount", Math.max(4, form.stickerCount - 1))}>−</button>
                          <strong>{form.stickerCount}</strong>
                          <button type="button" onClick={() => setValue("stickerCount", Math.min(9, form.stickerCount + 1))}>+</button>
                        </div>
                      </Field>
                    )}

                    {form.chibiService === "Alternate outfits/expressions" && (
                      <Field label={<>Number of Alternatives (2 to 6 options) <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}>
                        <div className="stepper" style={{ maxWidth: "160px" }}>
                          <button type="button" onClick={() => setValue("alternativesCount", Math.max(2, form.alternativesCount - 1))}>−</button>
                          <strong>{form.alternativesCount}</strong>
                          <button type="button" onClick={() => setValue("alternativesCount", Math.min(6, form.alternativesCount + 1))}>+</button>
                        </div>
                      </Field>
                    )}

                    {form.chibiService === "YCH" && (
                      <div>
                        <label className="field" style={{ marginBottom: "8px" }}><span>Select YCH Theme <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></span></label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                          {[
                            ["Cozy Tea Time", "tea"],
                            ["Pocket Mascot", "scout"],
                            ["Cheerful Orange", "orange"]
                          ].map(([themeName, artKey]) => (
                            <button
                              type="button"
                              key={themeName}
                              className={`choice-card ${form.ychTheme === themeName ? "selected" : ""}`}
                              aria-pressed={form.ychTheme === themeName}
                              onClick={() => setValue("ychTheme", themeName)}
                              style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px", textAlign: "center" }}
                            >
                              <div style={{ width: "100%", height: "70px", marginBottom: "8px", borderRadius: "6px", overflow: "hidden" }}>
                                <ArtVisual art={artKey} label={themeName} />
                              </div>
                              <strong>{themeName}</strong>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Field label={<>Color Finish <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}>
                    <select value={form.colorOption} onChange={(e) => setValue("colorOption", e.target.value)}>
                      <option value="" disabled>-- Select Color Finish --</option>
                      <option value="Rendered">Rendered</option>
                      <option value="Plain">Plain Color</option>
                      <option value="Monochrome">Monochrome</option>
                    </select>
                  </Field>
                )}

                <Field label={<>Background Style <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}>
                  <select value={form.bgOption} onChange={(e) => setValue("bgOption", e.target.value)}>
                    <option value="" disabled>-- Select Background Style --</option>
                    <option value="None/Transparent">None / Transparent</option>
                    <option value="Plain">Plain Solid Color</option>
                    <option value="Complex">Complex Background</option>
                  </select>
                </Field>

                <Field label={<>Number of Characters (Max {maxChars}) <span className="req" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}>
                  <div className="stepper">
                    <button type="button" onClick={() => setValue("characters", Math.max(1, form.characters - 1))}>−</button>
                    <strong>{form.characters}</strong>
                    <button type="button" onClick={() => setValue("characters", Math.min(maxChars, form.characters + 1))}>+</button>
                  </div>
                </Field>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-section form-section-accent">
              <div className="form-number">04</div>
              <div><h2>Project references & final notes</h2><p>Provide specific details and upload visual references (up to 10 images).</p></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Field label="Background details"><textarea rows={3} value={form.backgroundDetails} onChange={(e) => setValue("backgroundDetails", e.target.value)} placeholder="Describe background elements or props..." /></Field>
                <Field label="Additional details"><textarea rows={4} value={form.additionalDetails} onChange={(e) => setValue("additionalDetails", e.target.value)} placeholder="Pose description, clothing styles, mood..." /></Field>
                <Field label="Reference images (Max 10 files)" hint={`Uploaded: ${references.length} / 10`}>
                  <input type="file" accept="image/*" multiple onChange={(e) => uploadReferences(e.target.files)} />
                </Field>
                {references.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                    {references.map((image, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img src={image} alt={`Reference ${index + 1}`} style={{ width: "80px", height: "80px", objectFit: "cover", border: "1px solid var(--gold)" }} />
                        <button type="button" onClick={() => removeReference(index)} style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: "10px" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="form-section form-section-accent">
              <div className="form-number">05</div>
              <div>
                <h2>Review & Checkout</h2>
                <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: "1.6", marginTop: "6px" }}>
                  Review your total and submit your request.
                </p>
              </div>
              
              <div className="checkout-summary estimate-card">
                <div className="estimate-top"><span>Order Summary · PHP</span><Icon name="spark" /></div>
                <h2>{money(total)}</h2>
                <div className="estimate-lines">{estimateBreakdown}</div>
                <div className="estimate-total"><span>Estimated total</span><strong>{money(total)}</strong></div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                  <Btn type="button" kind="outline" onClick={() => setStep(2)}>Edit General Info</Btn>
                  <Btn type="button" kind="outline" onClick={() => setStep(3)}>Edit Scope & Options</Btn>
                </div>
              </div>
            </div>
          )}

          {step > 2 && step < 5 && (
            <aside className="estimate-card estimate-card-mobile">
              <div className="estimate-top"><span>Live Estimate · PHP</span><Icon name="spark" /></div>
              <h2>{money(total)}</h2>
              <div className="estimate-lines">{estimateBreakdown}</div>
              <div className="estimate-total"><span>Estimated total</span><strong>{money(total)}</strong></div>
              <p className="fine-print">GCASH is the accepted payment platform. Final confirmation is sent after admin review.</p>
            </aside>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            {step > 1 ? (
              <Btn type="button" kind="outline" onClick={() => setStep((prev) => Math.max(1, prev - 1))}>Back</Btn>
            ) : <div />}

            {step < 5 ? (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleNext}
              >
                Next <Icon name="arrow" />
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary submit-btn"
                onClick={handleFinalSubmit}
              >
                Submit <Icon name="arrow" />
              </button>
            )}
          </div>
        </div>

        {step > 2 && step < 5 && <aside className="estimate-card estimate-card-desktop">
          <div className="estimate-top"><span>Live Estimate · PHP</span><Icon name="spark" /></div>
          <h2>{money(total)}</h2>
          <div className="estimate-lines">{estimateBreakdown}</div>
          <div className="estimate-total"><span>Estimated total</span><strong>{money(total)}</strong></div>
          <p className="fine-print">GCASH is the accepted payment platform. Final confirmation is sent after admin review.</p>
        </aside>}
      </div>
    </main>
  );
}

function Guide() {
  return (
    <main id="main-content" tabIndex={-1} className="page-main guide-page">
      <section className="page-hero wrap">
        <p className="kicker">Kyuu commission guide</p>
        <h1>Commission <em>Terms & Guidelines.</em></h1>
        <p>Please review the complete terms below before securing a commission slot.</p>
      </section>
      <section className="wrap guide-sections">
        <article className="guide-section-card">
          <div className="guide-section-heading"><span>I.</span><h2>RULES & REGULATIONS</h2></div>
          <div className="guide-topic-grid">
            <section className="guide-topic-card">
              <h3>A. NSFW CONTENTS</h3>
              <p><strong>Not Safe For Work content is NOT allowed,</strong> may the project be in PUBLIC or in PRIVATE. Any commission request that is judged to be NSFW or suggestive will not be accepted and will be rejected immediately.</p>
              <p>The following will automatically be tagged as NSFW: <em>pornography, nudity, heavy gore, depiction of bodily fluids (e.g., semen), violence, suggestive content, controversial content.</em></p>
            </section>
            <section className="guide-topic-card">
              <h3>B. THEMES</h3>
              <table className="guide-table guide-theme-table">
                <thead><tr><th scope="col">Will Draw:</th><th scope="col">Won't Draw:</th></tr></thead>
                <tbody><tr>
                  <td data-label="Will Draw:"><ul className="guide-theme-list"><li>OC</li><li>Fictional Characters</li><li>Character Ships</li><li>Nonsexual Nudity</li></ul></td>
                  <td data-label="Won't Draw:"><ul className="guide-theme-list"><li>NSFW</li><li>Real People without their consent</li><li>Changing a canon character's design (e.g., race, major features)</li><li>Mecha, Cars, etc.</li></ul></td>
                </tr></tbody>
              </table>
            </section>
          </div>
        </article>

        <article className="guide-section-card">
          <div className="guide-section-heading"><span>II.</span><h2>COPYRIGHTS</h2></div>
          <div className="guide-topic-grid">
            <section className="guide-topic-card"><h3>A. ARTIST RIGHTS</h3><p><strong>Pursuant to Republic Act No. 8293 (The Intellectual Property Code of the Philippines), the copyright of the artwork inherently and permanently belongs to the artist.</strong> The artist retains all rights regarding the reproduction, distribution, and public display of the artwork for promotional, portfolio, and social media purposes.</p></section>
            <section className="guide-topic-card"><h3>B. CLIENT RIGHTS</h3><p>Upon final payment, the client is granted a license to use the artwork for expected purposes. The artist must be clearly and visibly credited whenever the artwork is used or displayed publicly. The client may not alter, edit, or claim the artwork as their own creation.</p></section>
            <section className="guide-topic-card"><h3>C. AI & BLOCKCHAIN PROHIBITIONS</h3><p>Under no circumstances is the artwork permitted for use in Artificial Intelligence (AI) training databases, machine learning datasets, or any blockchain/NFT platforms. Any such utilization constitutes a direct violation of these terms and copyright law.</p></section>
            <section className="guide-topic-card"><h3>D. TRANSFER OF OWNERSHIP</h3><p>Full copyright ownership remains with the artist unless a separate, formal agreement is signed/explicitly said by both parties to assign the copyright to the client or an organization. Copyright buyout fees will apply for such transfers.</p></section>
          </div>
        </article>

        <article className="guide-section-card">
          <div className="guide-section-heading"><span>III.</span><h2>CONTRACT & WORKFLOW TERMS</h2></div>
          <p className="guide-intro">By securing a commission slot, both the artist and the client agree to the following parameters regarding the execution, payment, and legal boundaries of the commission.</p>
          <div className="guide-topic-grid">
            <section className="guide-topic-card"><h3>A. REVISIONS</h3><p>Once the final artwork is finished and presented for final approval, any requests for major modifications or revisions will incur mandatory additional charges depending on the weight of the adjustment. Work on these final alterations will only commence after the client has paid the required revision fee.</p></section>
            <section className="guide-topic-card"><h3>B. DEADLINES</h3><p>Clients requiring an expected delivery can opt to designate their commission as a PRIORITY. Priority pieces are fast-tracked ahead of the standard production queue to ensure significantly quicker completion, which will incur an additional charge equivalent to 10% of the project's total price.</p></section>
            <section className="guide-topic-card guide-topic-wide">
              <h3>C. PAYMENT TERMS</h3>
              <p>To ensure a secure and collaborative workflow, payments are broken down into milestone installations. No upfront cost is required to begin the initial drafting phase, but progress is strictly tied to the following payment schedule:</p>
              <table className="guide-table">
                <thead><tr><th scope="col">Milestone</th><th scope="col">Payment schedule</th></tr></thead>
                <tbody>
                  <tr><th scope="row">Initial Phase</th><td data-label="Payment schedule">The project will be initiated and developed up to the midpoint milestone without an upfront cost.</td></tr>
                  <tr><th scope="row">Mid-Project Downpayment</th><td data-label="Payment schedule">Upon reaching the midpoint milestone (the finalization of the approved sketch), a mandatory 20% downpayment of the total project fee will be requested.</td></tr>
                  <tr><th scope="row">Final Settlement</th><td data-label="Payment schedule">The remaining balance must be paid in full within three (3) calendar days after the artwork is finished and presented. High-resolution—without any obstructive watermark—final deliverables will only be released once the full payment has cleared.</td></tr>
                </tbody>
              </table>
            </section>
            <section className="guide-topic-card">
              <h3>D. CANCELLATION & REFUND POLICY</h3>
              <p>Clients may change their minds or cancel the project within a specific window. However, because time and labor are invested into the project as it progresses, the refund policy changes depending on when the cancellation is requested:</p>
              <ul>
                <li>Standard Grace Period: The client is entitled to a 100% full cancellation and refund within one (1) week (7 days) of the initial project booking.</li>
                <li>Mid-Project & Mid-Production: If no cancellation is requested within the first week, production automatically proceeds. If the client persists in canceling the project after the 1-week grace period has passed, the project will enter immediate termination. In this event, the client will only be refunded 12% of their total downpayment amount, and they will be given the latest work-in-progress export of the drawing as-is.</li>
              </ul>
            </section>
            <section className="guide-topic-card">
              <h3>E. TERMINATION POLICY</h3>
              <p>The artist reserves the right to suspend work or permanently terminate the contract if the client breaches communication or payment deadlines. Forfeiting a slot due to non-payment will result in the cancellation of the project.</p>
              <ul>
                <li>Failure to Provide Downpayment: If the client refuses or fails to settle the 20% mid-project downpayment within one (1) week (7 days) of the initial payment request, production will be immediately halted, the commission will be terminated, and the slot will be forfeited.</li>
                <li>Failure to Settle Final Balance: Failure to pay the remaining balance within the designated 3-day post-completion window will result in the immediate withholding of the final artwork, termination of future services, and potential blacklisting from subsequent commission openings.</li>
              </ul>
            </section>
          </div>
        </article>

        <article className="guide-section-card">
          <div className="guide-section-heading"><span>IV.</span><h2>COMMUNICATION & CLIENT RESPONSIVENESS</h2></div>
          <div className="guide-topic-grid">
            <section className="guide-topic-card"><h3>A. RESPONSE WINDOW</h3><p>Clients are expected to respond to milestone updates, feedback requests, or approvals within three (3) calendar days.</p></section>
            <section className="guide-topic-card"><h3>B. INACTIVITY CLOSURE</h3><p>If a client fails to communicate or respond for more than fourteen (14) consecutive days without prior notice, the project will be considered abandoned. The contract will be terminated, the 20% downpayment (if paid) will be forfeited as a cancellation fee, and the slot will be reopened to the public.</p></section>
            <section className="guide-topic-card guide-topic-wide">
              <h3>C. FORCE MAJEURE</h3>
              <p>The artist is not held liable for delays caused by emergency situations, illness, power outages, natural disasters, or technical failures. In the event of such a delay, the client will be notified immediately, and a revised timeline will be established.</p>
              <p>If an operational delay occurs and the artist fails to respond to client inquiries or provide milestone updates for more than fourteen (14) consecutive days without prior notice, the client is granted the right to choose one of the following options:</p>
              <ul>
                <li><strong>Immediate Project Cancellation:</strong> The client may cancel the contract and receive a 12% refund of the settled downpayment, along with the latest work-in-progress export of the artwork as-is.</li>
                <li><strong>Timeline Extension:</strong> The client may choose to maintain the commission slot under a newly negotiated, mutually agreed-upon delivery deadline.</li>
              </ul>
            </section>
          </div>
        </article>

        <article className="guide-section-card">
          <div className="guide-section-heading"><span>V.</span><h2>FILE STORAGE & DELIVERY MAINTENANCE</h2></div>
          <section className="guide-topic-card">
            <p>Final high-resolution files will be hosted on a cloud drive (e.g., Google Drive) and guaranteed to be accessible for six (6) months following final delivery. Clients are strongly advised to download and back up their files immediately upon receipt.</p>
            <p>If a client loses their files or requires a new download link after the 6-month hosting period has expired, they may reach out to the artist directly. While the artist will make every effort to retrieve the artwork from their personal archives, recovery is not guaranteed if the data has been permanently cleared or archived.</p>
          </section>
        </article>
      </section>
    </main>
  );
}

type FilterKind = "scope" | "service" | "colorFinish";
type ActiveTag = { kind: FilterKind; value: string };

const ART_STYLES = ["Chibi", "Semi-Realistic"];
const SCOPES_BY_STYLE: Record<string, string[]> = {
  "Chibi": ["Headshot", "Fullbody"],
  "Semi-Realistic": ["Headshot", "Bust-up", "Waist-up", "Thigh-up"],
};
const CHIBI_SERVICES = ["Solo Deals", "Sticker set", "Acrylic Merch", "Badges/Pins/Pfp Design", "Character Reference sheet", "2D Model character sheet", "YCH", "Alternate outfits/expressions"];
const COLOR_FINISHES = ["Rendered", "Plain", "Monochrome"];
const TOOL_PRESETS = ["Clip Studio Paint", "Procreate", "Adobe Photoshop", "Krita", "Paint Tool SAI", "MediBang Paint", "Ibis Paint X", "Adobe Illustrator"];
const FORMAT_PRESETS = ["Digital illustration", "Digital print", "Sticker sheet", "Acrylic merch", "Pin / Badge", "Photocard", "Reference sheet", "2D model sheet"];
const KIND_LABEL: Record<FilterKind, string> = { scope: "Scope", service: "Service", colorFinish: "Finish" };

const itemArtStyle = (item: AdminLibraryItem) => {
  if (item.artStyle) return item.artStyle;
  if (/semi/i.test(item.category || "")) return "Semi-Realistic";
  if (/chibi/i.test(item.category || "")) return "Chibi";
  return "";
};
const itemService = (item: AdminLibraryItem) => item.service || item.category?.match(/\(([^)]+)\)/)?.[1] || "";

const matchesFilters = (item: AdminLibraryItem, artStyle: string, tags: ActiveTag[]) => {
  if (artStyle && itemArtStyle(item) !== artStyle) return false;
  for (const kind of ["scope", "service", "colorFinish"] as FilterKind[]) {
    const picked = tags.filter((tag) => tag.kind === kind).map((tag) => tag.value);
    if (!picked.length) continue;
    const value = kind === "scope" ? item.scope : kind === "service" ? itemService(item) : item.colorFinish;
    if (!value || !picked.includes(value)) return false;
  }
  return true;
};

const MAX_ENTRY_BYTES = 10 * 1024 * 1024;
const ENTRY_LIMIT_LABEL = `${MAX_ENTRY_BYTES / (1024 * 1024)} MB`;
const MAX_STORED_IMAGE_BYTES = 1_500_000;

// Real size of an image: a data URL decodes to roughly 3/4 of its base64 length. Anything else counts by text length.
const dataUrlBytes = (src: string) => {
  const comma = src.indexOf(",");
  if (!src.startsWith("data:") || comma === -1) return src.length;
  const base64 = src.slice(comma + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};
const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const pad2 = (value: number) => String(value).padStart(2, "0");

const todayInput = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

const toInputDate = (value?: string) => {
  if (!value) return todayInput();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? todayInput() : `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
};

const formatPublishedDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

const encodeImage = (img: HTMLImageElement, maxSize: number, quality: number): string | null => {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  let data = canvas.toDataURL("image/webp", quality);
  if (!data.startsWith("data:image/webp")) {
    // Older Safari can’t encode WebP: fall back to JPEG with a white background behind transparent areas.
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    data = canvas.toDataURL("image/jpeg", quality);
  }
  return data;
};

const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const attempts: Array<[number, number]> = [[1600, 0.85], [1600, 0.72], [1280, 0.72], [1000, 0.65], [800, 0.6]];
      for (const [maxSize, quality] of attempts) {
        const data = encodeImage(img, maxSize, quality);
        if (!data) {
          reject(new Error("This browser can’t resize images."));
          return;
        }
        if (dataUrlBytes(data) <= MAX_STORED_IMAGE_BYTES) {
          resolve(data);
          return;
        }
      }
      reject(new Error(`${file.name} is too detailed to store even after resizing. Try a simpler version of it.`));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} couldn’t be read as an image.`));
    };
    img.src = url;
  });

function ActionMenu({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="kebab" ref={ref}>
      <button type="button" className="kebab-btn" aria-label={`Actions for ${label}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <Icon name="more" />
      </button>
      {open && (
        <div className="kebab-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEdit(); }}><Icon name="pen" size={16} /> Edit</button>
          <button type="button" role="menuitem" className="danger" onClick={() => { setOpen(false); onDelete(); }}><Icon name="trash" size={16} /> Delete</button>
        </div>
      )}
    </div>
  );
}

function LibraryFilterBar({ artStyle, tags, onArtStyle, onToggleTag, onClear }: {
  artStyle: string; tags: ActiveTag[]; onArtStyle: (value: string) => void;
  onToggleTag: (tag: ActiveTag) => void; onClear: () => void;
}) {
  const [drawer, setDrawer] = useState<"scope" | "service" | null>(null);
  const scopeOptions = artStyle ? SCOPES_BY_STYLE[artStyle] : Array.from(new Set(Object.values(SCOPES_BY_STYLE).flat()));
  const serviceLabel = artStyle === "Chibi" ? "Service" : artStyle === "Semi-Realistic" ? "Color Finish" : "Service / Color Finish";
  const serviceGroups: { kind: FilterKind; label: string; options: string[] }[] = [];
  if (artStyle !== "Semi-Realistic") serviceGroups.push({ kind: "service", label: "Service (Chibi)", options: CHIBI_SERVICES });
  if (artStyle !== "Chibi") serviceGroups.push({ kind: "colorFinish", label: "Color Finish (Semi-Realistic)", options: COLOR_FINISHES });

  const isOn = (kind: FilterKind, value: string) => tags.some((tag) => tag.kind === kind && tag.value === value);
  const toggleDrawer = (name: "scope" | "service") => setDrawer((current) => (current === name ? null : name));
  const pill = (kind: FilterKind, value: string) => (
    <button key={`${kind}:${value}`} type="button" className={`chalk-pill ${isOn(kind, value) ? "on" : ""}`} aria-pressed={isOn(kind, value)} onClick={() => onToggleTag({ kind, value })}>
      {value}
    </button>
  );

  return (
    <div className="library-filter">
      <div className="library-filter-row">
        <strong className="sub-filter-label">Filter</strong>
        <label className="sub-filter-select">
          <span className="sr-only">Art Style</span>
          <select value={artStyle} onChange={(event) => { setDrawer(null); onArtStyle(event.target.value); }}>
            <option value="">Art Style</option>
            {ART_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
          </select>
        </label>
        <button type="button" className={`chalk-pill-btn ${drawer === "scope" ? "open" : ""}`} aria-expanded={drawer === "scope"} aria-controls="filter-drawer" onClick={() => toggleDrawer("scope")}>
          Scope <span aria-hidden="true">{drawer === "scope" ? "▴" : "▾"}</span>
        </button>
        <button type="button" className={`chalk-pill-btn ${drawer === "service" ? "open" : ""}`} aria-expanded={drawer === "service"} aria-controls="filter-drawer" onClick={() => toggleDrawer("service")}>
          {serviceLabel} <span aria-hidden="true">{drawer === "service" ? "▴" : "▾"}</span>
        </button>
        {tags.length > 0 && <button type="button" className="sub-filter-clear" onClick={onClear}>Clear filters</button>}
      </div>

      {drawer && (
        <div className="library-filter-drawer" id="filter-drawer">
          {drawer === "scope" && scopeOptions.map((value) => pill("scope", value))}
          {drawer === "service" && serviceGroups.map((group) => (
            <div className="filter-group" key={group.kind}>
              {serviceGroups.length > 1 && <span className="filter-group-label">{group.label}</span>}
              {group.options.map((value) => pill(group.kind, value))}
            </div>
          ))}
        </div>
      )}

      <div className="library-filter-tray" aria-live="polite">
        {tags.length === 0 && <span className="tray-empty">No filters selected</span>}
        {tags.map((tag) => (
          <span className="chalk-tag" key={`${tag.kind}:${tag.value}`}>
            <small>{KIND_LABEL[tag.kind]}</small> {tag.value}
            <button type="button" aria-label={`Remove ${tag.value} filter`} onClick={() => onToggleTag(tag)}><Icon name="close" size={12} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function PublishManager() {
  const emptyDraft = () => ({
    title: "",
    description: "",
    artStyle: "Chibi",
    subCategory: "Sticker set",
    scope: "Headshot",
    colorFinish: "",
    images: [] as string[],
    tools: "", format: "",
    publishedDate: todayInput()
  });

  const [items, setItems] = useState<AdminLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLibraryItem | null>(null);
  const [artStyleFilter, setArtStyleFilter] = useState("");
  const [tags, setTags] = useState<ActiveTag[]>([]);
  const [draft, setDraft] = useState(emptyDraft());
  const [previewIndex, setPreviewIndex] = useState(0);
  const [formError, setFormError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [loadingSet, setLoadingSet] = useState(false);   // fetching the other images of a set being edited
  const [lockSave, setLockSave] = useState(false);       // set when that fetch failed, so a partial set is never saved
  const editRequest = useRef(0);                         // ignores answers that arrive after the editor was closed

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<AdminLibraryItem[]>("/api/gallery");
      if (!Array.isArray(data)) throw new Error("The server returned invalid gallery data.");
      setItems(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : String(loadError);
      setError(message);
      console.error("Failed to load gallery from D1:", loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const visible = useMemo(() => items.filter((item) => matchesFilters(item, artStyleFilter, tags)), [items, artStyleFilter, tags]);

  // Changing Art Style wipes every sub-filter (Scope, Service, Color Finish).
  const changeArtStyleFilter = (value: string) => { setArtStyleFilter(value); setTags([]); };
  const toggleTag = (tag: ActiveTag) => setTags((current) =>
    current.some((existing) => existing.kind === tag.kind && existing.value === tag.value)
      ? current.filter((existing) => !(existing.kind === tag.kind && existing.value === tag.value))
      : [...current, tag]
  );

  // Any number of images can be picked at once and become one set (the first is the cover).
  // The only limit is the combined stored size of the entry (10 MB), checked as each image is added.
  const addImages = async (picked: File[]) => {
    const files = picked.filter((file) => file.type.startsWith("image/"));
    if (!files.length) {
      setFormError("Please choose image files.");
      return;
    }
    setFormError("");
    setProcessing(true);
    let running = draft.images.reduce((total, src) => total + dataUrlBytes(src), 0);
    const added: string[] = [];
    const problems: string[] = [];
    let leftOut = 0;
    try {
      for (let index = 0; index < files.length; index++) {
        setProgress(`Processing ${index + 1} of ${files.length}…`);
        let data: string;
        try {
          data = await compressImage(files[index]);
        } catch (uploadError) {
          problems.push(uploadError instanceof Error ? uploadError.message : String(uploadError));
          continue;
        }
        const bytes = dataUrlBytes(data);
        if (running + bytes > MAX_ENTRY_BYTES) {
          leftOut = files.length - index;
          break;
        }
        running += bytes;
        added.push(data);
      }
      if (added.length) setDraft((prev) => ({ ...prev, images: [...prev.images, ...added] }));
      if (leftOut) problems.push(`Added ${added.length} of ${files.length} images. The other ${leftOut} would go over the ${ENTRY_LIMIT_LABEL} limit for one entry.`);
      if (problems.length) setFormError(problems.join(" "));
    } finally {
      setProgress("");
      setProcessing(false);
    }
  };

  const removeImage = (index: number) => {
    setDraft((prev) => ({ ...prev, images: prev.images.filter((_, position) => position !== index) }));
    setPreviewIndex((current) => Math.max(0, Math.min(current, draft.images.length - 2)));
  };

  const moveImage = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= draft.images.length) return;
    setDraft((prev) => {
      const next = [...prev.images];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, images: next };
    });
    setPreviewIndex(target);
  };

  const changeDraftStyle = (style: string) => setDraft((prev) => ({
    ...prev,
    artStyle: style,
    scope: SCOPES_BY_STYLE[style][0],
    subCategory: style === "Chibi" ? "Sticker set" : "",
    colorFinish: style === "Semi-Realistic" ? "Rendered" : "",
  }));

  const openAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft()); // Date Published defaults to today each time the form opens
    setPreviewIndex(0);
    setFormError("");
    editRequest.current += 1;
    setLoadingSet(false);
    setLockSave(false);
    setOpen(true);
  };

  const closeModal = () => {
    editRequest.current += 1;
    setLoadingSet(false);
    setLockSave(false);
    setOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
    setPreviewIndex(0);
    setFormError("");
  };

  const startEdit = (item: AdminLibraryItem) => {
    const style = itemArtStyle(item) || "Chibi";
    setDraft({
      ...emptyDraft(),
      title: item.title,
      description: item.description || "",
      artStyle: style,
      subCategory: itemService(item) || (style === "Chibi" ? "Sticker set" : ""),
      scope: item.scope || SCOPES_BY_STYLE[style][0],
      colorFinish: item.colorFinish || (style === "Semi-Realistic" ? "Rendered" : ""),
      images: item.image && item.image !== placeholder ? [item.image] : [],
      tools: item.tools || "", format: item.format || "",
      publishedDate: toInputDate(item.publishedAt)
    });
    setPreviewIndex(0);
    setFormError("");
    setEditingId(item.id);
    setOpen(true);

    // The list only carries each entry's cover, so fetch the rest of its set. Saving stays disabled until it arrives.
    const token = ++editRequest.current;
    setLockSave(false);
    setLoadingSet(false);
    if ((item.imageCount ?? 1) > 1) {
      setLoadingSet(true);
      apiRequest<{ images: string[] }>(`/api/gallery/${item.id}/images`)
        .then((data) => {
          if (token !== editRequest.current) return;
          if (!Array.isArray(data.images) || !data.images.length) throw new Error("the server returned no images");
          setDraft((prev) => ({ ...prev, images: data.images.filter((image) => image && image !== placeholder) }));
        })
        .catch((loadError) => {
          if (token !== editRequest.current) return;
          setLockSave(true);
          setFormError(`Couldn’t load this set’s images (${loadError instanceof Error ? loadError.message : String(loadError)}). Close the editor and try again so nothing gets lost.`);
        })
        .finally(() => {
          if (token === editRequest.current) setLoadingSet(false);
        });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest<{ success: boolean }>(`/api/gallery/${deleteTarget.id}`, { method: "DELETE" });
      setItems((current) => current.filter((existing) => existing.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : String(deleteError);
      setError(message);
      console.error("Failed to delete gallery item from D1:", deleteError);
      alert(`Failed to delete: ${message}`);
    }
  };

  const setSize = draft.images.reduce((total, src) => total + dataUrlBytes(src), 0);
  const overBudget = setSize > MAX_ENTRY_BYTES;
  const usedPercent = Math.min(100, Math.round((setSize / MAX_ENTRY_BYTES) * 100));

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingSet || lockSave) return;
    setFormError("");

    if (!draft.images.length) { setFormError("Add at least one image to publish."); return; }
    if (overBudget) {
      setFormError(`These images total ${formatMB(setSize)}, over the ${ENTRY_LIMIT_LABEL} limit for one entry. Remove a few and try again.`);
      return;
    }

    const style = draft.artStyle;
    const service = style === "Chibi" ? draft.subCategory : "";
    const colorFinish = style === "Semi-Realistic" ? draft.colorFinish : "";
    const scope = style ? draft.scope : "";
    const publishedAt = formatPublishedDate(draft.publishedDate || todayInput());
    const common = { id: editingId ?? Date.now(), title: draft.title, description: draft.description, artStyle: style, scope, service, colorFinish };

    const item: AdminLibraryItem = {
      ...common,
      // Keep the legacy "Chibi (Service)" category string: the public gallery still reads it.
      category: style === "Chibi" ? `Chibi (${service})` : style,
      image: draft.images[0],
      images: draft.images,
      tools: draft.tools, format: draft.format,
      publishedAt
    };

    try {
      await apiRequest<{ success: boolean }>(editingId !== null ? `/api/gallery/${editingId}` : "/api/gallery", {
        method: editingId !== null ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      await loadItems();
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : String(publishError);
      setError(message);
      console.error("Failed to save gallery item to D1:", publishError);
      alert(`Failed to save: ${message}`);
      return;
    }
    closeModal();
  };

  const previewSrc = draft.images[previewIndex];
  const replaceLabel = processing
    ? progress || "Processing…"
    : loadingSet
      ? "Loading images…"
      : draft.images.length ? "Add more images" : "Choose images";

  return (
    <div className="admin-panel media-manager">
      <div className="panel-head">
        <div>
          <p>PUBLISHED LIBRARY</p>
          <h2>Gallery images</h2>
        </div>
        <button className="admin-plus" onClick={openAdd}>
          <Icon name="plus" /> Add artwork
        </button>
      </div>

      <LibraryFilterBar artStyle={artStyleFilter} tags={tags} onArtStyle={changeArtStyleFilter} onToggleTag={toggleTag} onClear={() => setTags([])} />

      <div className="media-list">
        {loading && <p className="empty-row">Loading from D1…</p>}
        {error && <p className="empty-row" role="alert">Unable to load or update data: {error}</p>}
        {visible.map((item) => {
          const imageCount = item.imageCount ?? 1;
          const metaParts = [item.tools, item.format].filter(Boolean);
          return (
            <article key={item.id}>
              <img src={item.image || placeholder} alt={item.title} />
              <div>
                <span>{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <small>
                  Published {item.publishedAt}
                  {imageCount > 1 ? ` · Set of ${imageCount} images` : ""}
                </small>
                {metaParts.length > 0 && (
                  <small className="media-meta">{metaParts.join(" · ")}</small>
                )}
              </div>
              <ActionMenu label={item.title} onEdit={() => startEdit(item)} onDelete={() => setDeleteTarget(item)} />
            </article>
          );
        })}
        {!loading && !error && items.length === 0 && <div className="empty-row">Nothing published yet. Use the plus button to add the first item.</div>}
        {!loading && !error && items.length > 0 && visible.length === 0 && <div className="empty-row">No items match these filters.</div>}
      </div>

      {deleteTarget && (
        <div className="modal-backdrop" onMouseDown={() => setDeleteTarget(null)}>
          <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-title" onMouseDown={(e) => e.stopPropagation()}>
            <h2 id="confirm-delete-title">Delete this artwork?</h2>
            <p>“{deleteTarget.title}” will be removed from the database. This can’t be undone.</p>
            <div className="confirm-actions">
              <Btn kind="outline" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
              <Btn onClick={confirmDelete}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <form className="publish-modal" onSubmit={publish} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" aria-label="Close editor" onClick={closeModal}><Icon name="close" /></button>

            <div className="publish-preview">
              <img src={previewSrc || placeholder} alt="Upload preview" />

              {draft.images.length > 0 && (
                <>
                  <ul className="set-thumbs" aria-label="Images in this set">
                    {draft.images.map((src, index) => (
                      <li key={`${index}-${src.length}`}>
                        <button type="button" className={`set-thumb ${index === previewIndex ? "on" : ""}`} aria-pressed={index === previewIndex} aria-label={`Show image ${index + 1}${index === 0 ? " (cover)" : ""}`} onClick={() => setPreviewIndex(index)}>
                          <img src={src} alt="" />
                          {index === 0 && <b>Cover</b>}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="set-actions">
                    <button type="button" aria-label="Move image earlier" disabled={previewIndex === 0} onClick={() => moveImage(previewIndex, -1)}>←</button>
                    <button type="button" aria-label="Move image later" disabled={previewIndex >= draft.images.length - 1} onClick={() => moveImage(previewIndex, 1)}>→</button>
                    <button type="button" className="danger" onClick={() => removeImage(previewIndex)}><Icon name="trash" size={14} /> Remove</button>
                  </div>
                  <div className="set-meter" aria-hidden="true"><i className={overBudget ? "over" : ""} style={{ width: `${usedPercent}%` }} /></div>
                  <small className={`set-size ${overBudget ? "over" : ""}`}>
                    {draft.images.length} {draft.images.length === 1 ? "image" : "images"} · {formatMB(setSize)} of {ENTRY_LIMIT_LABEL}
                  </small>
                </>
              )}

              <label className={`publish-replace ${processing || loadingSet ? "busy" : ""}`}>
                <Icon name="plus" /> {replaceLabel}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={processing || loadingSet}
                  onChange={(e) => {
                    const input = e.target;
                    const picked = Array.from(input.files || []); // copy first: clearing the input empties the live FileList
                    input.value = "";
                    void addImages(picked);
                  }}
                />
              </label>
            </div>

            <div className="publish-fields">
              <p className="kicker">{editingId !== null ? "Editing" : "New"} gallery artwork</p>
              <h2>{editingId !== null ? "Edit details" : "Publish something new"}</h2>

              <ChalkField label="Title">
                <input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Item title" />
              </ChalkField>

              <ChalkField label="Description">
                <textarea required rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Write a brief description..." />
              </ChalkField>

              <ChalkField label="Art Style">
                <select value={draft.artStyle} onChange={(e) => changeDraftStyle(e.target.value)}>
                  {ART_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
                </select>
              </ChalkField>

              {draft.artStyle && (
                <ChalkField label="Scope">
                  <select value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })}>
                    {SCOPES_BY_STYLE[draft.artStyle].map((scope) => <option key={scope} value={scope}>{scope}</option>)}
                  </select>
                </ChalkField>
              )}

              {draft.artStyle === "Chibi" && (
                <ChalkField label="Service">
                  <select value={draft.subCategory} onChange={(e) => setDraft({ ...draft, subCategory: e.target.value })}>
                    {CHIBI_SERVICES.map((service) => <option key={service} value={service}>{service === "YCH" ? "YCH (Your Character Here)" : service}</option>)}
                  </select>
                </ChalkField>
              )}

              {draft.artStyle === "Semi-Realistic" && (
                <ChalkField label="Color Finish">
                  <select value={draft.colorFinish} onChange={(e) => setDraft({ ...draft, colorFinish: e.target.value })}>
                    {COLOR_FINISHES.map((finish) => <option key={finish} value={finish}>{finish === "Plain" ? "Plain Color" : finish}</option>)}
                  </select>
                </ChalkField>
              )}

              <ChalkField label="Tools" hint="Type your own or pick a preset">
                <input list="gallery-tools-list" autoComplete="off" value={draft.tools} onChange={(e) => setDraft({ ...draft, tools: e.target.value })} placeholder="e.g. Clip Studio Paint" />
                <datalist id="gallery-tools-list">{TOOL_PRESETS.map((value) => <option key={value} value={value} />)}</datalist>
              </ChalkField>
              <ChalkField label="Format" hint="Type your own or pick a preset">
                <input list="gallery-format-list" autoComplete="off" value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} placeholder="e.g. Digital illustration" />
                <datalist id="gallery-format-list">{FORMAT_PRESETS.map((value) => <option key={value} value={value} />)}</datalist>
              </ChalkField>
              <ChalkField label="Date Published" hint="Defaults to today. Pick another date if you need to.">
                <input type="date" required value={draft.publishedDate} onChange={(e) => setDraft({ ...draft, publishedDate: e.target.value })} />
              </ChalkField>

              {formError && <p className="form-error" role="alert">{formError}</p>}

              <Btn type="submit" disabled={processing || loadingSet || lockSave}>{editingId !== null ? "Save changes" : "Publish"} <Icon name="arrow" /></Btn>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

type CommissionRequestWithHistory = CommissionRequest & {
  historyType?: "Finished" | "Cancelled";
  submittedToHistoryAt?: string;
};

function HistoryManager({ onRestore }: { onRestore: (request: CommissionRequest) => void }) {
  const [historyItems, setHistoryItems] = useState<CommissionRequestWithHistory[]>([]);
  const [itemToDelete, setItemToDelete] = useState<CommissionRequestWithHistory | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<CommissionRequestWithHistory[]>("/api/commissions")
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("The server returned invalid commission history.");
        setHistoryItems(data.filter((item) => item.historyType));
      })
      .catch((loadError) => {
        const message = loadError instanceof Error ? loadError.message : String(loadError);
        setError(message);
        console.error("Failed to load commission history from D1:", loadError);
      });
  }, []);

  const handleUndo = async (id: number) => {
    const itemToRestore = historyItems.find(item => item.id === id);
    if (!itemToRestore) return;

    if (itemToRestore.historyType !== "Cancelled" && itemToRestore.submittedToHistoryAt) {
      const elapsed = Date.now() - new Date(itemToRestore.submittedToHistoryAt).getTime();
      const hours24 = 24 * 60 * 60 * 1000;
      if (elapsed > hours24) {
        alert("The 24-hour window to undo has expired. This work is now permanently saved in history.");
        return;
      }
    }

    const restoredItem: CommissionRequest = {
      ...itemToRestore,
      historyType: undefined,
      submittedToHistoryAt: undefined,
      stage: itemToRestore.historyType === "Finished" ? 4 : itemToRestore.stage,
    };

    try {
      await apiRequest<{ success: boolean }>(`/api/commissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: restoredItem.stage, historyType: null, submittedToHistoryAt: null })
      });
      setHistoryItems((current) => current.filter((item) => item.id !== id));
      onRestore(restoredItem);
    } catch (restoreError) {
      const message = restoreError instanceof Error ? restoreError.message : String(restoreError);
      setError(message);
      console.error("Failed to restore commission from D1 history:", restoreError);
      alert(`Failed to restore request: ${message}`);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!itemToDelete) return;
    try {
      await apiRequest<{ success: boolean }>(`/api/commissions/${itemToDelete.id}`, { method: "DELETE" });
      setHistoryItems((current) => current.filter((item) => item.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : String(deleteError);
      setError(message);
      console.error("Failed to permanently delete commission from D1 history:", deleteError);
      alert(`Failed to delete history record: ${message}`);
    }
  };

  const isWithin24Hours = (dateString?: string) => {
    if (!dateString) return false;
    const elapsed = Date.now() - new Date(dateString).getTime();
    return elapsed < 24 * 60 * 60 * 1000;
  };

  return (
    <div className="admin-panel media-manager">
      <div className="panel-head">
        <div><p>COMPLETED ARCHIVE</p><h2>History</h2></div>
        <span>{historyItems.length} total records</span>
      </div>
      {error && <p className="empty-row" role="alert">Unable to load or update history: {error}</p>}
      <div className="media-list" style={{ gridTemplateColumns: "1fr" }}>
        {historyItems.map((item) => {
          const isFinished = item.historyType !== "Cancelled";
          const canUndo = isFinished && isWithin24Hours(item.submittedToHistoryAt);
          const canRestore = item.historyType === "Cancelled" || canUndo;
          return (
            <article key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px" }}>
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ color: isFinished ? "var(--orange)" : "#d9534f", fontWeight: "bold" }}>{item.historyType || "Finished"}</span>
                  <span>· {item.type} · {money(item.totalPhp)}</span>
                </div>
                <h3>{item.name}</h3>
                <p>Recorded on: {new Date(item.submittedToHistoryAt || item.submittedAt).toLocaleString()}</p>
                <small>{isFinished && canUndo ? "Undo available (within 24h)" : "Permanently saved in history"}</small>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {canRestore && (
                  <button 
                    onClick={() => handleUndo(item.id)} 
                    title={isFinished ? "Restore finished request to submissions" : "Restore cancelled request to submissions"}
                    style={{ border: "1px solid var(--line)", background: "white", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center", fontWeight: "bold" }}
                  >
                    <Icon name="arrow" size={14} />
                  </button>
                )}
                <button 
                  onClick={() => setItemToDelete(item)} 
                  title="Permanently delete record"
                  style={{ border: "1px solid #d9534f", background: "#fff5f5", color: "#d9534f", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center" }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </article>
          );
        })}
        {historyItems.length === 0 && !error && <div className="empty-row">No history records yet. Finished or cancelled requests will appear here.</div>}
      </div>

      {itemToDelete && (
        <div className="modal-backdrop" onMouseDown={() => setItemToDelete(null)}>
          <div className="dialog-modal" style={{ maxWidth: "420px", padding: "30px", textAlign: "center" }} onMouseDown={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "DM Serif Display", fontSize: "24px", marginBottom: "12px" }}>Permanently Delete Record?</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>
              Are you sure you want to permanently delete <strong>{itemToDelete.name}</strong>'s history record? This action cannot be undone.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Btn type="button" kind="outline" onClick={() => setItemToDelete(null)}>Cancel</Btn>
              <Btn type="button" onClick={confirmPermanentDelete} style={{ background: "#d9534f", borderColor: "#d9534f" }}>OK</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestDetail({ request, close }: { request: CommissionRequest; close: () => void }) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
  const openZoom = (image: string) => {
    setZoomedImage(image);
    setZoomScale(1);
  };

  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="request-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close}><Icon name="close" /></button>
        <p className="kicker">Submitted {new Date(request.submittedAt).toLocaleString()}</p>
        <h2>{request.name}’s request</h2>
        <div className="request-answers">
          {[
            ["Email", request.email], 
            ["Social handle", request.social || "Not provided"], 
            ["Scope", request.type], 
            ["Finish", request.finish], 
            ["Characters", String(request.characters)], 
            ["Background", request.background], 
            ["Commercial use", request.commercial ? "Yes" : "No"], 
            ["Priority", request.priority ? "Yes" : "No"], 
            ["Due date", request.dueDate], 
            ["Estimate", `₱${request.totalPhp.toLocaleString()}`], 
            ["Project notes", request.notes]
          ].map(([label, answer]) => (
            <div key={label}><span>{label}</span><p>{answer}</p></div>
          ))}
        </div>
        
        {request.references.length > 0 && (
          <div className="request-references">
            <h3>Reference images (Click to view larger)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
              {request.references.map((image, i) => (
                <img 
                  src={image} 
                  alt={`Client reference ${i + 1}`} 
                  key={i} 
                  onClick={() => openZoom(image)}
                  style={{ width: "120px", height: "120px", objectFit: "cover", cursor: "pointer", border: "1px solid var(--line)", transition: "transform 0.2s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {zoomedImage && (
        <div className="modal-backdrop" style={{ zIndex: 110, background: "rgba(0,0,0,0.85)" }} onMouseDown={() => setZoomedImage(null)}>
          <div 
            style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center" }} 
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "12px", background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "8px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={handleZoomIn} style={{ background: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Zoom +</button>
                <button type="button" onClick={handleZoomOut} style={{ background: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Zoom -</button>
                <button type="button" onClick={() => setZoomScale(1)} style={{ background: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Reset</button>
              </div>
              <button 
                type="button" 
                onClick={() => setZoomedImage(null)} 
                style={{ background: "white", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: "16px" }}
                aria-label="Close zoomed image"
              >
                ✕
              </button>
            </div>

            <div style={{ overflow: "auto", maxWidth: "100%", maxHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <img 
                src={zoomedImage} 
                alt="Enlarged reference view" 
                style={{ transform: `scale(${zoomScale})`, transition: "transform 0.2s ease", transformOrigin: "center center", maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Admin({ go, onLogout }: { go: (page: Page) => void; onLogout: () => void }) {
  const [tab, setTab] = useState("overview");
  const [requests, setRequests] = useState<CommissionRequest[]>([]);
  const [selected, setSelected] = useState<CommissionRequest | null>(null);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let active = true;
    setRequestError("");

    apiRequest<CommissionRequest[]>("/api/commissions")
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("The server returned invalid commission data.");
        if (active) setRequests(data.filter((request) => !request.historyType));
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : String(err);
        setRequestError(message);
        console.error("Error loading commissions from D1:", err);
      });

    return () => { active = false; };
  }, [tab]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [filterSlotStatus, setFilterSlotStatus] = useState<string>("all");
  
  const stages = ["Review", "Sketch", "Lineart", "Color", "Render", "Approved"];
  
  const adminLinks = [
    ["overview", "grid", "Overview"], 
    ["submissions", "user", "Submissions"], 
    ["schedule", "calendar", "Schedule"], 
    ["requests", "mail", "Client requests"], 
    ["artworks", "brush", "Gallery images"], 
    ["history", "clock", "History"]
  ];

  const updateStage = async (id: number, stageIndex: number) => {
    try {
      await apiRequest<{ success: boolean }>(`/api/commissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: stageIndex }),
      });
      setRequests((current) => current.map((request) => Number(request.id) === Number(id) ? { ...request, stage: stageIndex } : request));
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : String(updateError);
      console.error("Failed to update commission stage in D1:", updateError);
      alert(`Failed to update commission: ${message}`);
    }
  };

  const moveToHistoryAsFinished = async (id: number) => {
    const submittedToHistoryAt = new Date().toISOString();
    try {
      await apiRequest<{ success: boolean }>(`/api/commissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: 5, historyType: "Finished", submittedToHistoryAt }),
      });
      setRequests((current) => current.filter((request) => Number(request.id) !== Number(id)));
      setTab("history");
    } catch (archiveError) {
      const message = archiveError instanceof Error ? archiveError.message : String(archiveError);
      console.error("Failed to move commission to D1 history:", archiveError);
      alert(`Failed to archive commission: ${message}`);
    }
  };

  const removeRequest = async (id: number) => {
    const targetRequest = requests.find(r => Number(r.id) === Number(id));
    if (!targetRequest) return;

    const timestamp = new Date().toISOString();
    try {
      await apiRequest<{ success: boolean }>(`/api/commissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: targetRequest.stage,
          historyType: "Cancelled",
          submittedToHistoryAt: timestamp,
        }),
      });
      setRequests((current) => current.filter((request) => Number(request.id) !== Number(id)));
    } catch (error) {
      console.error("Failed to update cancellation status in D1:", error);
      alert(`Error updating commission status: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const upcoming = [...requests].filter((r) => r.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const semiRealisticRequests = requests
    .filter(r => r.type.startsWith("Semi-Realistic"))
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  const activeSemiIds = new Set(semiRealisticRequests.slice(0, 3).map(r => r.id));
  const reservedSemiIds = new Set(semiRealisticRequests.slice(3, 5).map(r => r.id));

  const filteredRequests = requests.filter((request) => {
    if (searchQuery.trim() && !request.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterPriority === "priority" && !request.priority) return false;
    if (filterPriority === "normal" && request.priority) return false;

    if (filterStyle !== "all" && !request.type.startsWith(filterStyle)) return false;

    if (filterSlotStatus !== "all") {
      const isSemi = request.type.startsWith("Semi-Realistic");
      if (filterSlotStatus === "active") {
        if (!isSemi || !activeSemiIds.has(request.id)) return false;
      } else if (filterSlotStatus === "reserved") {
        if (!isSemi || !reservedSemiIds.has(request.id)) return false;
      } else if (filterSlotStatus === "unoccupied") {
        if (isSemi && (activeSemiIds.has(request.id) || reservedSemiIds.has(request.id))) return false;
      }
    }

    return true;
  });

  return (
    <main className="admin-shell">
      <aside className="admin-nav">
        <button className="admin-brand" onClick={() => go("home")}><img src={logo} alt="" /><img src={brandName} alt="Inkyuu" /></button>
        <nav>{adminLinks.map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon name={icon as IconName} />{label}</button>)}</nav>
        <button className="back-site" onClick={() => go("home")}><Icon name="arrow" /> Back to website</button>
        <button className="logout-btn" onClick={onLogout}><Icon name="logout" /> Log out</button>
      </aside>
      <section className="admin-main">
        <header><div><p>STUDIO DASHBOARD</p><h1>{adminLinks.find(([id]) => id === tab)?.[2]}</h1></div></header>
        {requestError && <p className="empty-row" role="alert">Unable to load admin data from D1: {requestError}</p>}
        
        {tab === "overview" && (
          <div className="notification-grid">
            <section className="admin-panel">
              <div className="panel-head"><div><p>INBOX</p><h2>New requests</h2></div><span>{requests.filter((r) => r.stage === 0).length} new</span></div>
              <div className="notification-list">
                {requests.filter((r) => r.stage === 0).slice(0, 5).map((request) => (
                  <button key={request.id} onClick={() => setSelected(request)}>
                    <span><Icon name="mail" /></span>
                    <div><strong>{request.name} submitted a commission</strong><small>{request.type} · {new Date(request.submittedAt).toLocaleDateString()}</small></div>
                    <Icon name="arrow" />
                  </button>
                ))}
                {requests.length === 0 && <p className="empty-row">New commission requests will appear here.</p>}
              </div>
            </section>
            <section className="admin-panel">
              <div className="panel-head"><div><p>CALENDAR</p><h2>Upcoming deadlines</h2></div></div>
              <div className="deadline-list">
                {upcoming.slice(0, 5).map((request) => (
                  <button key={request.id} onClick={() => setSelected(request)}>
                    <time>{new Date(`${request.dueDate}T00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</time>
                    <span><strong>{request.name}</strong><small>{request.type} · {stages[request.stage]}</small></span>
                  </button>
                ))}
                {upcoming.length === 0 && <p className="empty-row">No client deadlines scheduled.</p>}
              </div>
            </section>
          </div>
        )}

        {tab === "submissions" && (
          <div className="admin-panel database-panel">
            <div className="panel-head">
              <div><p>PROJECT DATABASE</p><h2>Submission tracker</h2></div>
              <span>Saved automatically · {filteredRequests.length} of {requests.length} records</span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "10px", padding: "16px 0", borderBottom: "1px solid var(--line)", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <input 
                  type="text" 
                  placeholder="Search by customer name..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--cream)", fontSize: "12px", borderRadius: "4px" }}
                />
              </div>
              <div>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", background: "var(--cream)", fontSize: "12px", borderRadius: "4px" }}>
                  <option value="all">All Priorities</option>
                  <option value="priority">Priority Only</option>
                  <option value="normal">Normal Only</option>
                </select>
              </div>
              <div>
                <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", background: "var(--cream)", fontSize: "12px", borderRadius: "4px" }}>
                  <option value="all">All Art Styles</option>
                  <option value="Chibi">Chibi</option>
                  <option value="Semi-Realistic">Semi-Realistic</option>
                </select>
              </div>
              <div>
                <select value={filterSlotStatus} onChange={(e) => setFilterSlotStatus(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", background: "var(--cream)", fontSize: "12px", borderRadius: "4px" }}>
                  <option value="all">All Slot Status</option>
                  <option value="active">Active Slots (Semi)</option>
                  <option value="reserved">Reserved Slots (Semi)</option>
                  <option value="unoccupied">Unoccupied / Chibi</option>
                </select>
              </div>
            </div>

            <div className="database-table">
              <div className="database-row database-head" style={{ gridTemplateColumns: "1.2fr 1fr .75fr 1.0fr 1.1fr 75px" }}>
                <span>Client</span><span>Project</span><span>Due</span><span>Finish level</span><span>Progress</span><span />
              </div>
              {filteredRequests.map((request) => {
                const progressPercent = request.stage === 5 ? 100 : Math.min(100, Math.round((request.stage / 5) * 100));
                const isSemi = request.type.startsWith("Semi-Realistic");
                const badgeText = isSemi && activeSemiIds.has(request.id) ? " [Active Slot]" : isSemi && reservedSemiIds.has(request.id) ? " [Reserved Slot]" : "";
                
                return (
                  <div 
                    className="database-row" 
                    key={request.id} 
                    style={{ 
                      gridTemplateColumns: "1.2fr 1fr .75fr 1.0fr 1.1fr 75px",
                      background: request.priority ? "rgba(248, 118, 42, 0.08)" : "transparent" 
                    }}
                  >
                    <button type="button" className="client-cell" onClick={() => setSelected(request)}>
                      <strong>{request.name} {request.priority && <span style={{ color: "var(--orange)", fontSize: "10px" }}>(Priority)</span>}</strong>
                      <small>{request.email}</small>
                    </button>
                    <span>{request.type}{badgeText} · {request.characters} char.</span>
                    <time>{request.dueDate || "None"}</time>
                    <select value={request.stage} onChange={(e) => updateStage(request.id, Number(e.target.value))}>
                      {stages.map((stage, index) => <option value={index} key={stage}>{stage}</option>)}
                    </select>
                    <div className="progress-cell">
                      <span><i style={{ width: `${progressPercent}%` }} /></span>
                      <b>{progressPercent}%</b>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button 
                        type="button"
                        onClick={() => moveToHistoryAsFinished(request.id)} 
                        title="Mark as Finished & move to history"
                        style={{ border: "1px solid var(--orange)", background: "var(--cream)", color: "var(--orange)", width: "30px", height: "30px", borderRadius: "4px", cursor: "pointer", display: "grid", placeItems: "center" }}
                      >
                        <Icon name="check" size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => removeRequest(request.id)} 
                        title="Cancel & move to history"
                        style={{ border: "1px solid var(--line)", background: "white", color: "var(--muted)", width: "30px", height: "30px", borderRadius: "4px", cursor: "pointer", display: "grid", placeItems: "center" }}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredRequests.length === 0 && <p className="empty-row">No matching submissions found.</p>}
            </div>
          </div>
        )}

        {tab === "schedule" && <div className="admin-panel schedule-panel"><div className="panel-head"><div><p>CLIENT DUE DATES</p><h2>Schedule</h2></div><span>{upcoming.length} planned</span></div><div className="schedule-list">{upcoming.map((request) => <button key={request.id} onClick={() => setSelected(request)}><time><strong>{new Date(`${request.dueDate}T00:00`).toLocaleDateString("en-US", { day: "2-digit" })}</strong><span>{new Date(`${request.dueDate}T00:00`).toLocaleDateString("en-US", { month: "short" })}</span></time><div><h3>{request.name}</h3><p>{request.type} · {request.finish} · {request.characters} character{request.characters > 1 ? "s" : ""}</p></div><span className="admin-status">{stages[request.stage]}</span><Icon name="arrow" /></button>)}{upcoming.length === 0 && <p className="empty-row">Requested client due dates will appear automatically.</p>}</div></div>}
        {tab === "requests" && <div className="admin-panel"><div className="panel-head"><div><p>AUTOMATIC INBOX</p><h2>Client requests</h2></div><span>{requests.length} total</span></div><div className="request-list">{requests.map((request) => <button key={request.id} onClick={() => setSelected(request)}><span className="request-avatar">{request.name.slice(0, 2).toUpperCase()}</span><div><strong>{request.name}</strong><small>{request.type} · {request.finish} · submitted {new Date(request.submittedAt).toLocaleDateString()}</small></div><span>{request.dueDate}</span><Icon name="arrow" /></button>)}{requests.length === 0 && <p className="empty-row">Completed commission forms will be added here automatically.</p>}</div></div>}
        
        {tab === "artworks" && <PublishManager />}
        
        {tab === "history" && <HistoryManager onRestore={(request) => setRequests((current) => [request, ...current.filter((item) => item.id !== request.id)])} />}
      </section>
      {selected && <RequestDetail request={selected} close={() => setSelected(null)} />}
    </main>
  );
}

function Login({ onLogin, go }: { onLogin: () => void; go: (page: Page) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest<{ success: boolean }>("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      setPassword("");
      onLogin();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to log in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <button className="login-back" onClick={() => go("home")}>
        <Icon name="arrow" /> Back to website
      </button>
      <div className="login-card">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <img src={logo} alt="" style={{ width: "72px", height: "auto", display: "block", margin: "0 auto" }} />
          <img className="login-wordmark" src={brandName} alt="Inkyuu" style={{ display: "block", margin: "-7px auto 0" }} />
        </div>
        <p>Studio Admin Access</p>
        <form onSubmit={handleLogin}>
          <Field label="Username">
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              placeholder="Enter username..."
            />
          </Field>
          
          <Field label="Password">
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter password..."
                style={{ width: "100%", paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  padding: "4px",
                  color: "var(--muted)"
                }}
              >
                <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
              </button>
            </div>
          </Field>

          {error && <span className="login-error" role="alert">{error}</span>}
          <Btn type="submit" disabled={busy}>{busy ? "Checking…" : "Log in"} <Icon name="arrow" /></Btn>
        </form>
        <small>Protected studio route</small>
      </div>
    </div>
  );
}

function Footer({ go }: { go: (page: Page) => void }) {
  return (
    <footer>
      <div className="wrap footer-bottom">
        {/* Left side group */}
        <div className="footer-bottom-group">
          <span>© 2026 Inkyuu. All rights reserved.</span>
          <span className="dot-sep">•</span>
          <button type="button" className="footer-link-btn" onClick={() => go("guide")}>Terms and Conditions</button>
        </div>

        {/* Right side group */}
        <div className="footer-bottom-group">
          <span className="footer-section-label">Contacts |</span>
          <a href="mailto:kyuukyuuji@gmail.com">Email</a>
          <span className="dot-sep">•</span>
          <a href="https://www.instagram.com/jeii_ji" target="_blank" rel="noreferrer">
            Instagram<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <span className="dot-sep">•</span>
          <a href="https://www.facebook.com/christinejoy.morata02/" target="_blank" rel="noreferrer">
            Facebook<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function ChalkDivider() {
  const art = useMemo(() => {
    let seed = 11;
    const rnd = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const line = (base: number, amp: number, step: number) => {
      const points: string[] = [];
      for (let x = -20; x <= 1460; x += step) points.push(`${x},${(base + (rnd() - 0.5) * amp * 2).toFixed(1)}`);
      return points;
    };
    const open = (points: string[]) => `M${points.join(" L")}`;
    const closed = (points: string[]) => `M-20,180 L${points.join(" L")} L1460,180 Z`;
    return {
      dust: closed(line(72, 14, 30)),
      strokeA: open(line(58, 7, 22)),
      strokeB: open(line(76, 6, 18)),
      paper: closed(line(98, 5, 14)),
      flecks: Array.from({ length: 46 }, () => ({ x: rnd() * 1440, y: 30 + rnd() * 76, r: 0.9 + rnd() * 2.2, gold: rnd() > 0.72 })),
    };
  }, []);
  return (
    <div className="chalk-divider" aria-hidden="true">
      <svg viewBox="0 0 1440 170" preserveAspectRatio="none" focusable="false">
        
        {/*
         <path className="cd-dust" d={art.dust} filter="url(#chalk-rough-strong)" />

         <g filter="url(#chalk-soft)">
          <path className="cd-stroke cd-stroke-a" d={art.strokeA} />
          <path className="cd-stroke cd-stroke-b" d={art.strokeB} />
         </g>
        */}
        <path className="cd-paper" d={art.paper} filter="url(#chalk-edge)" />
        {/* 
         <g className="cd-flecks">
          {art.flecks.map((fleck, index) => <ellipse key={index} className={fleck.gold ? "cd-fleck-gold" : undefined} cx={fleck.x.toFixed(1)} cy={fleck.y.toFixed(1)} rx={(fleck.r * 1.5).toFixed(1)} ry={fleck.r.toFixed(1)} />)}
        </g>
        */}
      </svg>
    </div>
  );
}

function ChalkDefs() {
  const grain = "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.9 0 0 0 -.32";
  return (
    <svg className="chalk-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="chalk-rough" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="bent" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="grain" />
          <feColorMatrix in="grain" type="matrix" values={grain} result="speckle" />
          <feComposite in="bent" in2="speckle" operator="in" />
        </filter>
        <filter id="chalk-rough-strong" x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="21" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="9" xChannelSelector="R" yChannelSelector="G" result="bent" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -.12" result="speckle" />
          <feComposite in="bent" in2="speckle" operator="in" />
        </filter>
        <filter id="chalk-soft" x="-10%" y="-100%" width="120%" height="300%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="12" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="bent" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -.05" result="speckle" />
          <feComposite in="bent" in2="speckle" operator="in" />
        </filter>
        <filter id="chalk-edge" x="-2%" y="-10%" width="104%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.08" numOctaves="3" seed="17" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="chalk-edge-fine" x="-4%" y="-20%" width="108%" height="180%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.12" numOctaves="2" seed="23" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="chalk-text" x="-2%" y="-10%" width="104%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="2" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="bent" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.55" numOctaves="3" seed="5" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.2 0 0 0 1.5" result="speckle" />
          <feComposite in="bent" in2="speckle" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

export default function App() {
  const getPage = (): Page => {
    const hash = window.location.hash.replace("#", "").split("?")[0] as Page;
    return ["home", "gallery", "guide", "commission", "admin"].includes(hash) ? hash : "home";
  };
  const getGallerySelection = (): GallerySelection | null => {
    const query = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const category = query.get("category");
    const facet = query.get("facet");
    const value = query.get("value");
    if ((category !== "Chibi" && category !== "Semi-Realistic") || !value) return null;
    const validFacets = category === "Chibi" ? ["Scope", "Services"] : ["Scope", "Color Finish"];
    if (!facet || !validFacets.includes(facet)) return null;
    return { category, facet: facet as GallerySelection["facet"], value };
  };
  const [page, setPage] = useState<Page>(getPage);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const checkAdminSession = async () => {
    try {
      const session = await apiRequest<{ authenticated: boolean }>("/api/admin/session");
      setIsAdminAuth(Boolean(session.authenticated));
    } catch {
      setIsAdminAuth(false);
    } finally {
      setAuthChecked(true);
    }
  };

  // Check the login whenever the admin page is opened, and drop back to the login form if the server ever says 401.
  useEffect(() => {
    if (page === "admin") {
      setAuthChecked(false);
      void checkAdminSession();
    }
  }, [page]);

  useEffect(() => {
    const onSignedOut = () => setIsAdminAuth(false);
    window.addEventListener("inkyuu:signed-out", onSignedOut);
    return () => window.removeEventListener("inkyuu:signed-out", onSignedOut);
  }, []);

  const logout = async () => {
    try {
      await apiRequest<{ success: boolean }>("/api/admin/logout", { method: "POST" });
    } catch (logoutError) {
      console.error("Log out request failed (the login still expires by itself):", logoutError);
    }
    setIsAdminAuth(false);
    go("home");
  };

  useEffect(() => {
    const onHash = () => setPage(getPage());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll("main > section, .featured-card, .medium-card, .gallery-card, .guide-sections article, .form-section");
    elements.forEach((element) => element.classList.add("scroll-reveal"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("revealed"); observer.unobserve(entry.target); } }), { threshold: .08 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [page]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [page]);

  const go = (next: Page, selection?: GallerySelection) => {
    const query = selection ? `?category=${encodeURIComponent(selection.category)}&facet=${encodeURIComponent(selection.facet)}&value=${encodeURIComponent(selection.value)}` : "";
    window.location.hash = `${next}`;    
    setPage(next);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  };
  const content = { home: <Home go={go} />, guide: <Guide />, commission: <Commission go={go} />, admin: <Admin go={go} onLogout={logout} /> };
  
  if (page === "admin") {
    if (!authChecked) {
      return <main className="login-page" aria-busy="true"><p role="status">Checking access…</p></main>;
    }
    if (!isAdminAuth) {
      return <Login onLogin={() => setIsAdminAuth(true)} go={go} />;
    }
    return (
      <div className="chalk-theme">
        <ChalkDefs />
        {content.admin}
      </div>
    );
  }

  return (
    <div className="site-shell chalk-theme">
      <ChalkDefs />
      <Navbar page={page} go={go} />
      {content[page]}
      <Footer go={go} />
    </div>
  );
}