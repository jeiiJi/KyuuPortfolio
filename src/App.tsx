import { useEffect, useMemo, useState } from "react";
import logo from "./assets/inkdrop-logo.png";
import brandName from "./assets/brand-name.png";
import placeholder from "./assets/placeholder.svg";
import guidePdf from "./assets/Kyuu Commission Guide.pdf";

type Page = "home" | "gallery" | "shop" | "guide" | "about" | "commission" | "admin";
type CommissionRequest = {
  id: number; name: string; email: string; social: string; type: string; finish: string;
  characters: number; background: string; commercial: boolean; priority: boolean;
  dueDate: string; notes: string; references: string[]; totalPhp: number;
  submittedAt: string; stage: number; discountCode?: string; discountName?: string; discountAmount?: number;
};
type PublishedItem = {
  id: number; title: string; description: string; image: string; category: string;
  price?: number; publishedAt: string;
};
type DiscountItem = {
  id: number; title: string; percentage: number; requirementType: string;
  description: string; startDate: string; endDate: string; bannerImage: string; code: string;
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
  | "mail"
  | "menu"
  | "pen"
  | "plus"
  | "spark"
  | "trash"
  | "user"
  | "clock";

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
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    pen: <><path d="m15 5 4 4L8 20H4v-4L15 5Z" /><path d="m13 7 4 4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    spark: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const artItems = [
  { id: 1, title: "Golden Hour", type: "Semi-Realistic", desc: "A study in soft light, quiet confidence, and warm summer color.", art: "sunset", size: "tall", tags: ["portrait", "warm light", "digital"] },
  { id: 2, title: "Tea Break", type: "Chibi", desc: "A tiny afternoon ritual with an oversized cup and extra joy.", art: "tea", size: "short", tags: ["chibi", "character", "cozy"] },
  { id: 3, title: "Koi Dreams", type: "Semi-Realistic", desc: "Dreamlike currents inspired by koi ponds and silk.", art: "koi", size: "medium", tags: ["fantasy", "water", "editorial"] },
  { id: 4, title: "Lucky Scout", type: "Chibi", desc: "A pocket-sized adventurer ready for the next quest.", art: "scout", size: "medium", tags: ["chibi", "game art", "cute"] },
  { id: 5, title: "Flora", type: "Semi-Realistic", desc: "Botanical shapes meet expressive portraiture.", art: "flora", size: "short", tags: ["nature", "portrait", "green"] },
  { id: 6, title: "Orange Club", type: "Chibi", desc: "A playful character set made for stickers.", art: "orange", size: "tall", tags: ["sticker", "chibi", "collection"] },
];

const Btn = ({ children, kind = "primary", onClick, type = "button", className = "", style }: { children: React.ReactNode; kind?: "primary" | "outline" | "ghost"; onClick?: () => void; type?: "button" | "submit"; className?: string; style?: React.CSSProperties }) => (
  <button type={type} className={`btn btn-${kind} ${className}`} onClick={onClick} style={style}>{children}</button>
);

const loadStored = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
};
const money = (php: number) => `₱${php.toLocaleString()}`;

function Navbar({ page, go }: { page: Page; go: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const links: { label: string; page: Page }[] = [
    { label: "Home", page: "home" },
    { label: "Gallery", page: "gallery" },
    { label: "Shop", page: "shop" },
    { label: "Guide", page: "guide" },
    { label: "About", page: "about" },
  ];
  return (
    <header className="navbar">
      <div className="nav-inner">
        <button className="brand" onClick={() => go("home")} aria-label="Inkyuu home">
          <img className="brand-symbol" src={logo} alt="" /><img className="brand-wordmark" src={brandName} alt="Inkyuu" />
        </button>
        <nav className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          {links.map((link) => <button key={link.page} className={page === link.page ? "active" : ""} onClick={() => { go(link.page); setOpen(false); }}>{link.label}</button>)}
        </nav>
        <div className="nav-actions">
          <button className="menu-button" aria-label="Toggle menu" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /></button>
        </div>
      </div>
    </header>
  );
}

function ArtVisual({ art, label }: { art: string; label: string }) {
  return <div className={`art-visual art-${art}`}><img src={placeholder} alt={label} /></div>;
}

function PromoModal({ close, go }: { close: () => void; go: (page: Page) => void }) {
  const discounts = loadStored<DiscountItem[]>("inkyuu_discounts", []);
  const activeDiscount = discounts[0] || {
    title: "Your idea deserves to be drawn.",
    percentage: 15,
    description: "Book a commission this month and enjoy 15% off your first character illustration.",
    code: "FIRSTDROP15",
    bannerImage: ""
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <div className="promo-modal" role="dialog" aria-modal="true" aria-labelledby="promo-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="Close"><Icon name="close" /></button>
        <div className="promo-layout">
          <div className="promo-art">
            {activeDiscount.bannerImage ? (
              <img src={activeDiscount.bannerImage} alt={activeDiscount.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <><img src={logo} alt="Inkyuu bottle logo" /><span>{activeDiscount.percentage}%</span></>
            )}
          </div>
          <div className="promo-content">
            <div className="eyebrow"><Icon name="spark" size={15} /> Special Offer</div>
            <h2 id="promo-title">{activeDiscount.title}</h2>
            <p>{activeDiscount.description}</p>
            <div className="promo-code"><span>Discount Code</span><strong>{activeDiscount.code || "PROMO"}</strong></div>
            <Btn onClick={() => { close(); go("commission"); }}>Start a commission <Icon name="arrow" /></Btn>
            <button className="text-link" onClick={close}>Maybe later</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home({ go, openPromo }: { go: (page: Page) => void; openPromo: () => void }) {
  const discounts = loadStored<DiscountItem[]>("inkyuu_discounts", []);
  return (
    <>
      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> Digital artist & illustrator</div>
            <h1>Small moments,<br /><em>boldly drawn.</em></h1>
            <p>I turn warm ideas, favorite characters, and little daydreams into expressive digital art.</p>
            <div className="hero-actions">
              <Btn onClick={() => go("gallery")}>Explore my work <Icon name="arrow" /></Btn>
              <Btn kind="ghost" onClick={() => go("commission")}>Commission me</Btn>
            </div>
          </div>
          <div className="hero-canvas">
            <div className="canvas-label">Featured piece · 06/24</div>
            <ArtVisual art="hero" label="Abstract illustrated portrait in orange and charcoal" />
            <div className="float-card"><Icon name="heart" /><span>Made with<br /><strong>lots of heart</strong></span></div>
            <div className="scribble">original<br />characters</div>
          </div>
        </section>

        <section className="section wrap featured">
          <div className="section-heading">
            <div><p className="kicker">Fresh from the sketchbook</p><h2>This month's favorites</h2></div>
            <p>Pieces I loved bringing to life lately. Tap through to see the process and story behind each one.</p>
          </div>
          <div className="featured-grid">
            {artItems.slice(0, 3).map((item, index) => (
              <a className="featured-card" key={item.id} href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                <div className="featured-number">0{index + 1}</div>
                <ArtVisual art={item.art} label={item.title} />
                <div className="card-copy"><span>{item.type}</span><h3>{item.title}</h3><p>{item.desc}</p><b>View social post <Icon name="arrow" size={16} /></b></div>
              </a>
            ))}
          </div>
          <div className="center"><Btn kind="outline" onClick={() => go("gallery")}>There's more <Icon name="arrow" /></Btn></div>
        </section>

        <section className="about-strip">
          <div className="wrap intro-grid">
            <div className="portrait-card"><ArtVisual art="artist" label="Illustrated portrait of the artist" /><span className="seal">ID<br />Artist</span></div>
            <div className="intro-copy">
              <p className="kicker">Meet the artist</p><h2>Hi, I'm Kyuu. I draw feelings you can keep.</h2>
              <p>I'm a digital illustrator who loves expressive faces, cozy color stories, and the magic of turning your favorite idea into something unmistakably yours.</p>
              <Btn kind="ghost" onClick={() => go("about")}>A little more about me <Icon name="arrow" /></Btn>
              <div className="quick-terms"><div><span>01</span><p><strong>Kind collaboration</strong>Clear communication from sketch to final.</p></div><div><span>02</span><p><strong>Made for you</strong>Personal use is included; commercial use is quoted.</p></div></div>
            </div>
          </div>
        </section>

        <section className="section wrap">
          <div className="section-heading compact"><div><p className="kicker">Ways I make magic</p><h2>Pick your canvas</h2></div></div>
          <div className="medium-grid">
            {[["brush", "Character art", "Originals, fan art & portraits"], ["pen", "Chibi cuties", "Tiny style, big personality"], ["spark", "Merch design", "Stickers, cards & keepsakes"], ["grid", "Visual stories", "Covers, scenes & key art"]].map(([icon, title, desc], i) => <button key={title} onClick={() => go("commission")} className="medium-card"><span>0{i + 1}</span><Icon name={icon as IconName} size={25} /><h3>{title}</h3><p>{desc}</p><b><Icon name="arrow" /></b></button>)}
          </div>
          {discounts.length > 0 && (
            <div className="promo-banner"><div><span>SPECIAL OFFER</span><h2>{discounts[0].title}</h2><p>{discounts[0].description}</p></div><Btn kind="outline" onClick={openPromo}>Reveal my offer <Icon name="spark" /></Btn></div>
          )}
        </section>
        <section className="home-commission-cta"><div className="wrap"><p className="kicker">Three active slots only</p><h2>Ready to bring your idea to life?</h2><p>Tell me what you’re imagining and receive a personalized quote.</p><Btn onClick={() => go("commission")}>Commission now <Icon name="arrow" /></Btn></div></section>
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
    }
  | {
      id: number;
      title: string;
      type: string;
      desc: string;
      image: string;
      size: string;
      tags: string[];
      publishedAt: string;
    };

function Gallery() {
  const [filter, setFilter] = useState<"Chibi" | "Semi-Realistic">("Chibi");
  const published = loadStored<PublishedItem[]>("inkyuu_gallery", []);
  
  // Only published items appear in the gallery now (placeholders removed)
  const allItems: GalleryItem[] = published.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.category || "Chibi",
    desc: item.description,
    image: item.image,
    size: "medium",
    tags: ["published", item.category || "Chibi"],
    publishedAt: item.publishedAt,
  }));

  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const visible = allItems.filter((item) => item.type === filter);
  
  const visual = (item: GalleryItem) => {
    if ("image" in item && item.image) {
      return <img className="gallery-real-image" src={item.image} alt={item.title} />;
    }
    return <ArtVisual art="placeholder" label={item.title} />;
  };

  return (
    <main className="page-main">
      <section className="page-hero wrap">
        <p className="kicker">Selected works · 2023—2025</p>
        <h1>Gallery of <em>little worlds.</em></h1>
        <p>A collection of character-led illustrations, warm studies, and playful experiments.</p>
      </section>
      
      {/* Sliding Filter Toggle Bar */}
      <div className="filter-bar">
        <div className="filter-toggle sliding-filter" aria-label="Filter artwork">
          <div className={`filter-slider-indicator ${filter === "Semi-Realistic" ? "slide-right" : ""}`} />
          {(["Chibi", "Semi-Realistic"] as const).map((item) => (
            <button key={item} className={`filter-btn ${filter === item ? "active" : ""}`} onClick={() => setFilter(item)}>
              {item}<span>{allItems.filter((art) => art.type === item).length}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="wrap gallery-grid">
        {visible.map((item) => (
          <button className={`gallery-card gallery-image-only ${item.size}`} key={item.id} onClick={() => setSelected(item)} aria-label={`View ${item.title} details`}>
            {visual(item)}
            <span className="gallery-hover">View artwork <Icon name="arrow" /></span>
          </button>
        ))}
        {visible.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
            <p>No {filter} artwork has been added yet.</p>
          </div>
        )}
      </section>

      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <div className="project-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}><Icon name="close" /></button>
            <div className="project-image">{visual(selected)}</div>
            <div className="project-copy">
              <p className="kicker">{selected.type} · Featured project</p>
              <h2>{selected.title}</h2>
              <p>{selected.desc}</p>
              <div className="tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="project-meta">
                <span>Published<strong>{"publishedAt" in selected ? selected.publishedAt : "2025"}</strong></span>
                <span>Tools<strong>Procreate</strong></span>
                <span>Format<strong>Digital art</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const Field = ({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) => <label className="field"><span>{label}</span>{hint && <small>{hint}</small>}{children}</label>;

function Commission() {
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
    ychTheme: "",
    colorOption: "",
    bgOption: "",
    characters: 1,
    backgroundDetails: "",
    additionalDetails: "",
    confirm1: false,
    confirm2: false,
    confirm3: false,
    selectedDiscountId: "",
  });
  const [references, setReferences] = useState<string[]>([]);
  const discounts = loadStored<DiscountItem[]>("inkyuu_discounts", []);

  const setValue = (key: keyof typeof form, value: any) => {
    if (key === "artStyle" && value === "Semi-Realistic") {
      const requests = loadStored<CommissionRequest[]>("inkyuu_requests", []);
      const activeSemiCount = requests.filter(r => r.type.startsWith("Semi-Realistic")).length;
      
      if (activeSemiCount >= 5) {
        alert("Semi-Realistic commissions are currently unavailable as all active and reservation slots are fully occupied.");
        return;
      } else if (activeSemiCount >= 3) {
        alert("All active Semi-Realistic slots are currently taken. Your order will be placed in a reserved slot.");
      }
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Pricing calculations
  const basePrice = form.artStyle === "Chibi" 
    ? (form.baseOption === "Headshot" ? 170 
      : form.baseOption === "Fullbody" ? 200 : 0) 
    : form.artStyle === "Semi-Realistic" 
    ? (form.baseOption === "Headshot" ? 250 
      : form.baseOption === "Bust-up" ? 380 
      : form.baseOption === "Waist-up" ? 520 
      : form.baseOption === "Thigh-up" ? 680 : 0)
    : 0;

  const chibiServicePrice = form.artStyle === "Chibi" ? (
    form.chibiService === "Sticker set" ? (form.stickerCount - 4) * 30
    : form.chibiService === "Acrylic Merch" ? 50
    : form.chibiService === "Badges/Pins/Pfp Design" ? 40
    : form.chibiService === "Character Reference sheet" ? 150
    : form.chibiService === "2D Model character sheet" ? 300
    : form.chibiService === "YCH" ? 80
    : form.chibiService === "Alternate outfits/expressions" ? 60
    : 0
  ) : 0;

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
  
  const scopeAndOptionsTotal = basePrice + chibiServicePrice + colorPrice + bgPrice;

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
  const grossTotal = subtotal + commercialFee + priorityFee;

  const selectedDiscount = discounts.find((d) => String(d.id) === String(form.selectedDiscountId));
  let discountAmount = 0;
  if (selectedDiscount) {
    let isValid = true;
    const req = selectedDiscount.requirementType;
    if (req === "Chibi Only" && form.artStyle !== "Chibi") isValid = false;
    if (req === "Semi-Realistic Only" && form.artStyle !== "Semi-Realistic") isValid = false;
    if (req === "Commercial Use" && form.usageType !== "Commercial Use") isValid = false;
    if (req === "Personal Use" && form.usageType !== "Personal Use") isValid = false;

    if (isValid) {
      discountAmount = Math.round(grossTotal * (selectedDiscount.percentage / 100));
    }
  }

  const total = Math.max(0, grossTotal - discountAmount);

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
    if (step === 2 && (!form.name || !form.email || !form.artStyle || !form.usageType)) {
      alert("Please fill in your name, email, art style, and usage type.");
      return;
    }
    if (step === 3) {
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

  const handleFinalSubmit = () => {
    const requests = loadStored<CommissionRequest[]>("inkyuu_requests", []);
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
      notes: `Usage: ${form.usageType}\nService: ${form.chibiService || "N/A"}${form.ychTheme ? `\nYCH Theme: ${form.ychTheme}` : ""}\nBg Details: ${form.backgroundDetails}\nNotes: ${form.additionalDetails}\nDiscount Applied: ${selectedDiscount ? selectedDiscount.title : "None"}\nConfirmed all terms: Yes`,
      references,
      totalPhp: total,
      submittedAt: new Date().toISOString(),
      stage: 0,
      discountCode: selectedDiscount?.code,
      discountName: selectedDiscount?.title,
      discountAmount,
    };
    localStorage.setItem("inkyuu_requests", JSON.stringify([request, ...requests]));
    alert("Your commission request was successfully submitted!");
    go("home");
  };

  const maxChars = form.artStyle === "Chibi" ? 4 : form.artStyle === "Semi-Realistic" ? 2 : 4;

  return (
    <main className="page-main commission-page">
      <section className="page-hero wrap">
        <p className="kicker">Commission Request Form</p>
        <h1>Let's make something <em>yours.</em></h1>
        <p>Step-by-step studio commission intake modeled after live Google Forms.</p>
      </section>

      <div className="wrap commission-layout">
        <div className="commission-form">
          
          {/* Progress Indicator */}
          <div style={{ background: "white", border: "1px solid var(--line)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--orange)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Section {step} of 5</span>
              <h3 style={{ margin: "2px 0 0", fontFamily: "DM Serif Display", fontSize: "20px" }}>
                {step === 1 && "Terms of Service Agreement & Confirmation"}
                {step === 2 && "General Information"}
                {step === 3 && `${form.artStyle || "Art"} Scope & Options`}
                {step === 4 && "Project References & Final Notes"}
                {step === 5 && "Review & Checkout"}
              </h3>
            </div>
            <div style={{ width: "100px", height: "6px", background: "var(--cream)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ width: `${(step / 5) * 100}%`, height: "100%", background: "var(--orange)", transition: "width 0.3s ease" }} />
            </div>
          </div>

          {/* PAGE 1: Terms of Service Agreement & Confirmation */}
          {step === 1 && (
            <div className="form-section" style={{ borderTop: "6px solid var(--orange)" }}>
              <div className="form-number">01</div>
              <div>
                <h2>Terms of Service Agreement & Confirmation <span style={{ color: "red" }}>*</span></h2>
                <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: "1.6", marginTop: "6px" }}>
                  Please review and check each box below to proceed with your application. By checking these requirements, you acknowledge that you have read the official Commission Guide and explicitly agree to follow these operational boundaries throughout our project.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
                <label className="check-row" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.confirm1} onChange={(e) => setValue("confirm1", e.target.checked)} />
                  <span><strong>Guide Review <span style={{ color: "red" }}>*</span></strong><small>I confirm that I have accessed, read, and fully understood the rules and regulations provided in the official Commission Guide.</small></span>
                </label>
                <label className="check-row" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.confirm2} onChange={(e) => setValue("confirm2", e.target.checked)} />
                  <span><strong>Payment Terms <span style={{ color: "red" }}>*</span></strong><small>I explicitly accept the payment terms, including the 20% mid-project downpayment and the mandatory 3-day final payment window upon artwork completion.</small></span>
                </label>
                <label className="check-row" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.confirm3} onChange={(e) => setValue("confirm3", e.target.checked)} />
                  <span><strong>Operational Boundaries <span style={{ color: "red" }}>*</span></strong><small>I explicitly agree to follow all rules, regulations, and operational terms outlined within the guide for the duration of this project.</small></span>
                </label>
              </div>
            </div>
          )}

          {/* PAGE 2: General Information */}
          {step === 2 && (
            <div className="form-section" style={{ borderTop: "6px solid var(--orange)" }}>
              <div className="form-number">02</div>
              <div><h2>General Information</h2><p>Provide your contact details and select your overall project parameters.</p></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Field label={<>Name / Nickname <span style={{ color: "red" }}>*</span></>}>
                  <input value={form.name} onChange={(e) => setValue("name", e.target.value)} placeholder="Your name" />
                </Field>
                <Field label={<>Email address <span style={{ color: "red" }}>*</span></>}>
                  <input type="email" value={form.email} onChange={(e) => setValue("email", e.target.value)} placeholder="you@example.com" />
                </Field>
                <Field label="Social media handle"><input value={form.social} onChange={(e) => setValue("social", e.target.value)} placeholder="@username" /></Field>
                
                <Field label="Planned due date (Optional)" hint="NOTE: Expected commissioned pieces will be labeled as PRIORITY. In PRIORITY, it will be prioritized over non-prioritized pieces, and will be charged an extra 18% of total price (or 10% if the due date is more than 14 days away).">
                  <input type="date" value={form.dueDate} onChange={(e) => setValue("dueDate", e.target.value)} />
                </Field>
                
                <Field label={<>Art Style <span style={{ color: "red" }}>*</span></>}>
                  <select 
                    value={form.artStyle} 
                    onChange={(e) => setValue("artStyle", e.target.value)}
                  >
                    <option value="" disabled>-- Select Art Style --</option>
                    <option value="Chibi">Chibi</option>
                    <option value="Semi-Realistic">Semi-Realistic</option>
                  </select>
                </Field>

                <Field label={<>Usage Type <span style={{ color: "red" }}>*</span></>}>
                  <select value={form.usageType} onChange={(e) => setValue("usageType", e.target.value)}>
                    <option value="" disabled>-- Select Usage Type --</option>
                    <option value="Personal Use">Personal Use</option>
                    <option value="Commercial Use">Commercial Use</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* PAGE 3: Chibi & Semi-Realism options */}
          {step === 3 && (
            <div className="form-section" style={{ borderTop: "6px solid var(--orange)" }}>
              <div className="form-number">03</div>
              <div><h2>{form.artStyle || "Art"} Scope & Options</h2><p>Select your composition layout, service deals, and character limits.</p></div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="field" style={{ marginBottom: "8px" }}><span>Base Scope <span style={{ color: "red" }}>*</span></span></label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {form.artStyle === "Chibi" ? (
                      [
                        ["Headshot", 170], 
                        ["Fullbody", 200]
                      ].map(([name, price]) => (
                        <button type="button" className={`choice-card ${form.baseOption === name ? "selected" : ""}`} onClick={() => setValue("baseOption", name)} key={name} style={{ width: "100%" }}>
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
                        <button type="button" className={`choice-card ${form.baseOption === name ? "selected" : ""}`} onClick={() => setValue("baseOption", name)} key={name} style={{ width: "100%" }}>
                          <span className="radio" /><strong>{name}</strong><b>{money(Number(price))}</b><small>Semi-realism tier</small>
                        </button>
                      ))
                    ) : (
                      <p style={{ color: "var(--muted)", fontSize: "14px" }}>Please go back and select an Art Style first.</p>
                    )}
                  </div>
                </div>

                {/* CHIBI SPECIFIC SERVICE SELECTION */}
                {form.artStyle === "Chibi" ? (
                  <>
                    <Field label={<>Chibi Solo Deal / Service <span style={{ color: "red" }}>*</span></>}>
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

                    {/* STICKER SET QUANTITY SELECTOR */}
                    {form.chibiService === "Sticker set" && (
                      <Field label={<>Sticker Count (4 to 9 stickers) <span style={{ color: "red" }}>*</span></>}>
                        <div className="stepper" style={{ maxWidth: "160px" }}>
                          <button type="button" onClick={() => setValue("stickerCount", Math.max(4, form.stickerCount - 1))}>−</button>
                          <strong>{form.stickerCount}</strong>
                          <button type="button" onClick={() => setValue("stickerCount", Math.min(9, form.stickerCount + 1))}>+</button>
                        </div>
                      </Field>
                    )}

                    {/* YCH THEME RADIO SELECTION */}
                    {form.chibiService === "YCH" && (
                      <div>
                        <label className="field" style={{ marginBottom: "8px" }}><span>Select YCH Theme <span style={{ color: "red" }}>*</span></span></label>
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
                  /* SEMI-REALISTIC COLOR FINISH */
                  <Field label={<>Color Finish <span style={{ color: "red" }}>*</span></>}>
                    <select value={form.colorOption} onChange={(e) => setValue("colorOption", e.target.value)}>
                      <option value="" disabled>-- Select Color Finish --</option>
                      <option value="Rendered">Rendered</option>
                      <option value="Plain">Plain Color</option>
                      <option value="Monochrome">Monochrome</option>
                    </select>
                  </Field>
                )}

                <Field label={<>Background Style <span style={{ color: "red" }}>*</span></>}>
                  <select value={form.bgOption} onChange={(e) => setValue("bgOption", e.target.value)}>
                    <option value="" disabled>-- Select Background Style --</option>
                    <option value="None/Transparent">None / Transparent</option>
                    <option value="Plain">Plain Solid Color</option>
                    <option value="Complex">Complex Background</option>
                  </select>
                </Field>

                <Field label={<>Number of Characters (Max {maxChars}) <span style={{ color: "red" }}>*</span></>}>
                  <div className="stepper">
                    <button type="button" onClick={() => setValue("characters", Math.max(1, form.characters - 1))}>−</button>
                    <strong>{form.characters}</strong>
                    <button type="button" onClick={() => setValue("characters", Math.min(maxChars, form.characters + 1))}>+</button>
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* PAGE 4: Project references and final notes */}
          {step === 4 && (
            <div className="form-section" style={{ borderTop: "6px solid var(--orange)" }}>
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

          {/* PAGE 5: Review & Checkout (Discounts & Big Live Estimate) */}
          {step === 5 && (
            <div className="form-section" style={{ borderTop: "6px solid var(--orange)" }}>
              <div className="form-number">05</div>
              <div>
                <h2>Review & Checkout</h2>
                <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: "1.6", marginTop: "6px" }}>
                  Review your total, select applicable active discounts, and submit your request.
                </p>
              </div>
              
              <div style={{ margin: "20px 0", padding: "24px", background: "var(--cream)", border: "1px solid var(--gold)" }}>
                <span className="kicker">Final Calculated Total</span>
                <div style={{ fontSize: "42px", fontFamily: "DM Serif Display", color: "var(--ink)", margin: "8px 0" }}>{money(total)}</div>
                {discountAmount > 0 && (
                  <p style={{ fontSize: "14px", color: "var(--orange)", fontWeight: "bold" }}>
                    Discount applied: -{money(discountAmount)} ({selectedDiscount?.title})
                  </p>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                <Field label="Select Available Discount">
                  <select value={form.selectedDiscountId} onChange={(e) => setValue("selectedDiscountId", e.target.value)}>
                    <option value="">-- No Discount Selected --</option>
                    {discounts.map((d) => {
                      let isValid = true;
                      if (d.requirementType === "Chibi Only" && form.artStyle !== "Chibi") isValid = false;
                      if (d.requirementType === "Semi-Realistic Only" && form.artStyle !== "Semi-Realistic") isValid = false;
                      if (d.requirementType === "Commercial Use" && form.usageType !== "Commercial Use") isValid = false;
                      if (d.requirementType === "Personal Use" && form.usageType !== "Personal Use") isValid = false;
                      return (
                        <option key={d.id} value={d.id} disabled={!isValid}>
                          {d.title} ({d.percentage}% off) {isValid ? "" : `[Requirement unmet: ${d.requirementType}]`}
                        </option>
                      );
                    })}
                  </select>
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                  <Btn type="button" kind="outline" onClick={() => setStep(2)}>Edit General Info</Btn>
                  <Btn type="button" kind="outline" onClick={() => setStep(3)}>Edit Scope & Options</Btn>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
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

        {/* Live Estimate Sidebar */}
        <aside className="estimate-card">
          <div className="estimate-top"><span>Live Estimate · PHP</span><Icon name="spark" /></div>
          <h2>{money(total)}</h2>
          <div className="estimate-lines">
            <p><span>{form.artStyle ? `${form.artStyle} (${form.baseOption || "Select base"})` : "Base scope"}</span><b>{money(basePrice)}</b></p>
            {form.artStyle === "Chibi" ? (
              <p><span>Chibi finish</span><b>Rendered (Free)</b></p>
            ) : (
              <p><span>{form.colorOption || "Color finish"}</span><b>+{money(colorPrice)}</b></p>
            )}
            {form.chibiService && (
              <p><span>Service: {form.chibiService}{form.chibiService === "Sticker set" ? ` (${form.stickerCount})` : ""}</span><b>+{money(chibiServicePrice)}</b></p>
            )}
            <p><span>{form.bgOption || "Background"} background</span><b>+{money(bgPrice)}</b></p>
            {form.characters > 0 && <p><span>{form.characters} character{form.characters > 1 ? "s" : ""}</span><b>+{money(charMultiplier)}</b></p>}
            
            {(form.usageType === "Commercial Use" || form.dueDate) && (
              <>
                <p style={{ marginTop: "10px", color: "var(--gold)", fontWeight: "bold", borderTop: "1px dashed #595959", paddingTop: "8px" }}><span>Additional Fees</span></p>
                {form.usageType === "Commercial Use" && (
                  <p><span>Commercial license</span><b>+{money(commercialFee)}</b></p>
                )}
                {form.dueDate && (
                  <p><span>Priority due date fee ({dueDateRate === 0.1 ? "10%" : "18%"})</span><b>+{money(priorityFee)}</b></p>
                )}
              </>
            )}
            {discountAmount > 0 && (
              <p style={{ color: "var(--gold)", marginTop: "8px", borderTop: "1px dashed #595959", paddingTop: "8px" }}>
                <span>Discount ({selectedDiscount?.title})</span><b>-{money(discountAmount)}</b>
              </p>
            )}
          </div>
          <div className="estimate-total"><span>Estimated total</span><strong>{money(total)}</strong></div>
          <p className="fine-print">GCASH is the accepted payment platform. Final confirmation is sent after admin review.</p>
        </aside>
      </div>
    </main>
  );
}

function Shop({ go }: { go: (page: Page) => void }) {
  const products = loadStored<PublishedItem[]>("inkyuu_products", []);
  return <main className="page-main">
    <section className="page-hero wrap"><p className="kicker">The tiny shop</p><h1>Art made to <em>hold.</em></h1><p>Stickers, prints, and little pieces of joy from the Inkyuu studio.</p></section>{products.length > 0 ? <section className="wrap product-grid">{products.map((product) => <article key={product.id}><img src={product.image || placeholder} alt={product.title} /><div><span>{product.category}</span><h2>{product.title}</h2><p>{product.description}</p><strong>{money(product.price || 0)}</strong><small>Published {product.publishedAt}</small></div></article>)}</section> : <section className="empty-shop wrap"><div className="shop-art"><span className="shop-sun" /><img src={placeholder} alt="Artwork placeholder" /></div><div className="shop-copy"><span className="status-pill"><i /> Restocking in progress</span><h2>Shop is still unavailable</h2><p>I'm putting the finishing touches on a cheerful collection of stickers, posters, photocards, portraits, and sticker sets.</p><button className="text-link" onClick={() => go("gallery")}>Browse the gallery while you wait <Icon name="arrow" /></button></div></section>}</main>;
}

function Guide({ go }: { go: (page: Page) => void }) {
  const requests = loadStored<CommissionRequest[]>("inkyuu_requests", []);
  const history = loadStored<CommissionRequestWithHistory[]>("inkyuu_history", []);

  // Filter only Semi-Realistic requests that are active (not finished/cancelled or within 24h grace period)
  const isSemiRealistic = (type: string) => type.startsWith("Semi-Realistic");
  
  const activeSemiRequests = requests.filter(r => isSemiRealistic(r.type));
  const activeCount = Math.min(3, activeSemiRequests.length);
  const reservedCount = Math.max(0, Math.min(2, activeSemiRequests.length - 3));

  const sections = [
    { number: "01", title: "Rules & regulations", intro: "Clear boundaries keep every project safe, respectful, and enjoyable.", items: [["Content", "No NSFW, nudity, suggestive content, heavy gore, controversial content, or depictions of bodily fluids."], ["Will draw", "Angst, fluff, original characters, fan art, stickers, and memes."], ["Won’t draw", "Canon ships, furries or animals, mecha, cars, or major changes to canon character designs."], ["Copyright", "The artist retains copyright. Public use requires clear credit; alteration, AI training, blockchain, and NFTs are prohibited."]] },
    { number: "02", title: "Workflow & payment", intro: "A milestone-based process with no upfront cost before the initial drafting phase.", items: [["Sketch first", "Work begins and develops through the approved sketch without upfront payment."], ["20% midpoint payment", "A mandatory 20% downpayment is requested once the final sketch is approved."], ["Final settlement", "The remaining balance is due within three calendar days after completion. Unwatermarked files are released after payment clears."], ["Priority projects", "A required deadline can be fast-tracked for an additional 10% of the total project price."]] },
    { number: "03", title: "Communication & delivery", intro: "Timely feedback protects your slot and keeps the production calendar moving.", items: [["Response window", "Please respond to updates and approval requests within three calendar days."], ["Inactivity", "Fourteen days without communication may be treated as abandonment and the slot may reopen."], ["File storage", "Final high-resolution files remain available through cloud storage for six months."], ["Availability", "Only three active and two reserved semi-realistic commissions are open at a time. Reservations are contacted first when a slot opens."]] },
    { number: "04", title: "Cancellation", intro: "Refund eligibility changes as time and labor are invested.", items: [["Grace period", "Cancellation within seven days of booking is eligible for a full refund."], ["Mid-production", "After the grace period, cancellation ends production; 12% of the downpayment is refunded with the latest work-in-progress export."], ["Non-payment", "Missing the midpoint or final payment deadlines may terminate the project and forfeit the slot."], ["Force majeure", "For emergencies or technical delays, a revised timeline or cancellation option will be discussed."]] },
  ];
  return (
    <main className="page-main guide-page">
      <section className="guide-hero">
        <div className="wrap">
          <p className="kicker">Kyuu commission guide</p>
          <h1>Good art starts with <em>clear expectations.</em></h1>
          <p>Everything you need to know before booking a commission with Inkyuu.</p>
          <div>
            <Btn onClick={() => go("commission")}>Start a request <Icon name="arrow" /></Btn>
            <a className="btn btn-outline" href={guidePdf} target="_blank" rel="noreferrer">Open original PDF</a>
          </div>
        </div>
      </section>
      <section className="wrap guide-status">
        <div><span>Status</span><strong><i /> {activeCount >= 3 && reservedCount >= 2 ? "Fully Booked" : "Open"}</strong></div>
        <div><span>Active slots</span><strong>{activeCount} / 3</strong></div>
        <div><span>Reserved</span><strong>{reservedCount} / 2</strong></div>
        <div><span>Contact hours</span><strong>10 AM–9 PM UTC+8</strong></div>
      </section>
      <section className="wrap guide-sections">
        {sections.map((section) => (
          <article key={section.number}>
            <div className="guide-title">
              <span>{section.number}</span>
              <div>
                <p className="kicker">Commission policy</p>
                <h2>{section.title}</h2>
                <p>{section.intro}</p>
              </div>
            </div>
            <div className="guide-items">
              {section.items.map(([title, text]) => (
                <div key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
      <section className="guide-contact">
        <div className="wrap">
          <div>
            <p className="kicker">Questions?</p>
            <h2>Let’s clear things up before we start.</h2>
            <p>Reach the studio at kyuukyuuji@gmail.com or review the complete attached guide.</p>
          </div>
          <Btn onClick={() => go("commission")}>Commission now <Icon name="arrow" /></Btn>
        </div>
      </section>
    </main>
  );
}

function About({ go }: { go: (page: Page) => void }) {
  return (
    <main className="page-main about-page">
      <section className="about-hero wrap"><div><p className="kicker">The person behind the pixels</p><h1>Making art feel <em>personal.</em></h1><p>I'm Kyuu, an independent digital artist exploring softness, character, and playful visual storytelling.</p><Btn onClick={() => go("commission")}>Work with me <Icon name="arrow" /></Btn></div><div className="about-portrait"><ArtVisual art="artist" label="Artist portrait" /><div className="portrait-note">Based in the Philippines<br />Creating worldwide</div></div></section>
      <section className="wrap story-grid"><div><p className="kicker">My story</p><h2>From notebook margins to a studio of my own.</h2></div><div><p>What started as doodles between classes became a way to connect with people around the world. My work lives somewhere between gentle realism and joyful exaggeration.</p><p>I believe good art feels like recognition: a character that finally looks the way you imagined, or a gift that says what words could not.</p></div></section>
      <section className="expertise-section"><div className="wrap"><p className="kicker">Core expertise</p><h2>What I bring to the canvas</h2><div className="expertise-grid">{["Character illustration", "Chibi design", "Portrait commissions", "Merchandise artwork", "Visual storytelling", "Color direction"].map((item, i) => <div key={item}><span>0{i + 1}</span><Icon name={i % 2 ? "spark" : "pen"} /><h3>{item}</h3></div>)}</div></div></section>
      <section className="wrap timeline-section"><div><p className="kicker">Along the way</p><h2>Milestones & art events</h2><p>A few memorable stops in an always-growing creative practice.</p></div><div className="timeline">{[["2021", "First 100 commissions", "Reached a joyful little milestone with clients across eight countries."], ["2022", "Komiket Manila", "Debuted an original sticker and mini-print collection."], ["2023", "Graphika Art Fair", "Joined a community showcase celebrating independent illustrators."], ["2025", "Inkyuu studio", "Opened a dedicated online home for art, commissions, and shop drops."]].map(([year, title, desc]) => <div key={year}><span>{year}</span><article><h3>{title}</h3><p>{desc}</p></article></div>)}</div></section>
      <section className="wrap collaborators"><p className="kicker">Featured collaborators</p><h2>Good things made together</h2><div>{["Cloud Nine Café", "Daydream Press", "Mori Studio", "Sunday Club"].map((name) => <span key={name}>{name}</span>)}</div></section>
      <section className="contact-band"><div className="wrap"><div><p className="kicker">Say hello</p><h2>Have an idea? My inbox is open.</h2></div><div className="contact-links"><a href="mailto:kyuukyuuji@gmail.com"><Icon name="mail" /> kyuukyuuji@gmail.com</a><a href="https://instagram.com" target="_blank" rel="noreferrer"><Icon name="instagram" /> @inkyuu.art</a></div></div></section>
    </main>
  );
}

function PublishManager({ mode }: { mode: "gallery" | "products" }) {
  const storageKey = mode === "gallery" ? "inkyuu_gallery" : "inkyuu_products";
  const [items, setItems] = useState<PublishedItem[]>(() => loadStored(storageKey, []));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", category: mode === "gallery" ? "Chibi" : "Sticker", price: "", image: "" });
  const persist = (next: PublishedItem[]) => { setItems(next); localStorage.setItem(storageKey, JSON.stringify(next)); };
  const upload = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setDraft({ ...draft, image: String(reader.result) }); reader.readAsDataURL(file); };
  const publish = (e: React.FormEvent) => {
    e.preventDefault();
    persist([{ id: Date.now(), title: draft.title, description: draft.description, category: draft.category, price: Number(draft.price || 0), image: draft.image || placeholder, publishedAt: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) }, ...items]);
    setDraft({ title: "", description: "", category: mode === "gallery" ? "Chibi" : "Sticker", price: "", image: "" }); setOpen(false);
  };
  return <div className="admin-panel media-manager"><div className="panel-head"><div><p>PUBLISHED LIBRARY</p><h2>{mode === "gallery" ? "Gallery images" : "Shop merchandise"}</h2></div><button className="admin-plus" onClick={() => setOpen(true)}><Icon name="plus" /> Add {mode === "gallery" ? "artwork" : "product"}</button></div><div className="media-list">{items.map((item) => <article key={item.id}><img src={item.image || placeholder} alt={item.title} /><div><span>{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><small>Published {item.publishedAt}</small></div><button aria-label={`Delete ${item.title}`} onClick={() => persist(items.filter((x) => x.id !== item.id))}><Icon name="trash" /></button></article>)}{items.length === 0 && <div className="empty-row">Nothing published yet. Use the plus button to add the first item.</div>}</div>{open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><form className="publish-modal" onSubmit={publish} onMouseDown={(e) => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setOpen(false)}><Icon name="close" /></button><div className="publish-preview"><img src={draft.image || placeholder} alt="Upload preview" /><label><Icon name="plus" /> Choose image<input required={!draft.image} type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} /></label></div><div className="publish-fields"><p className="kicker">{mode === "gallery" ? "New gallery artwork" : "New shop merchandise"}</p><h2>Publish something new</h2><Field label={mode === "gallery" ? "Artwork title" : "Product title"}><input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field><Field label="Description"><textarea required rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field><Field label="Category"><select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{(mode === "gallery" ? ["Chibi", "Semi-Realistic"] : ["Sticker", "Print", "Photocard", "Portrait", "Sticker set"]).map((x) => <option key={x}>{x}</option>)}</select></Field>{mode === "products" && <Field label="Price in PHP"><input required type="number" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></Field>}<Btn type="submit">Publish <Icon name="arrow" /></Btn></div></form></div>}</div>;
}

function DiscountManager() {
  const storageKey = "inkyuu_discounts";
  const [discounts, setDiscounts] = useState<DiscountItem[]>(() => loadStored(storageKey, []));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", percentage: "", requirementType: "Any", description: "", startDate: "", endDate: "", code: "", bannerImage: "" });
  const persist = (next: DiscountItem[]) => { setDiscounts(next); localStorage.setItem(storageKey, JSON.stringify(next)); };
  const upload = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setDraft({ ...draft, bannerImage: String(reader.result) }); reader.readAsDataURL(file); };
  const publish = (e: React.FormEvent) => {
    e.preventDefault();
    persist([{ id: Date.now(), title: draft.title, percentage: Number(draft.percentage), requirementType: draft.requirementType, description: draft.description, startDate: draft.startDate, endDate: draft.endDate, code: draft.code || "PROMO", bannerImage: draft.bannerImage }, ...discounts]);
    setDraft({ title: "", percentage: "", requirementType: "Any", description: "", startDate: "", endDate: "", code: "", bannerImage: "" }); setOpen(false);
  };
  return (
    <div className="admin-panel media-manager">
      <div className="panel-head">
        <div><p>DISCOUNTS & PROMOS</p><h2>Discount Management</h2></div>
        <button className="admin-plus" onClick={() => setOpen(true)}><Icon name="plus" /> Add Discount</button>
      </div>
      <div className="media-list">
        {discounts.map((item) => (
          <article key={item.id}>
            <img src={item.bannerImage || placeholder} alt={item.title} />
            <div>
              <span>{item.percentage}% OFF · {item.requirementType}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <small>{item.startDate} to {item.endDate} | Code: <strong>{item.code}</strong></small>
            </div>
            <button aria-label={`Delete ${item.title}`} onClick={() => persist(discounts.filter((x) => x.id !== item.id))}><Icon name="trash" /></button>
          </article>
        ))}
        {discounts.length === 0 && <div className="empty-row">No discounts created yet. Use the plus button to add a discount.</div>}
      </div>
      {open && (
        <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
          <form className="publish-modal" onSubmit={publish} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setOpen(false)}><Icon name="close" /></button>
            <div className="publish-preview">
              <img src={draft.bannerImage || placeholder} alt="Banner preview" />
              <label><Icon name="plus" /> Banner Placeholder<input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} /></label>
            </div>
            <div className="publish-fields">
              <p className="kicker">New Discount Offer</p>
              <h2>Create a Discount</h2>
              <Field label="Title"><input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Summer Promo" /></Field>
              <Field label="Discount Percentage (%)"><input required type="number" min="1" max="100" value={draft.percentage} onChange={(e) => setDraft({ ...draft, percentage: e.target.value })} placeholder="15" /></Field>
              <Field label="Discount Code"><input required value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="SUMMER15" /></Field>
              <Field label="Requirements (Type Validation)"><select value={draft.requirementType} onChange={(e) => setDraft({ ...draft, requirementType: e.target.value })}><option value="Any">Any Commission</option><option value="Chibi Only">Chibi Only</option><option value="Semi-Realistic Only">Semi-Realistic Only</option><option value="Commercial Use">Commercial Use Only</option><option value="Personal Use">Personal Use Only</option></select></Field>
              <Field label="Description"><textarea required rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Enjoy 15% off..." /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="Start Date"><input required type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></Field>
                <Field label="End Date"><input required type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></Field>
              </div>
              <Btn type="submit">Save Discount <Icon name="arrow" /></Btn>
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
  const storageKey = "inkyuu_history";
  const requestsStorageKey = "inkyuu_requests";
  const [historyItems, setHistoryItems] = useState<CommissionRequestWithHistory[]>(() => loadStored(storageKey, []));
  const [itemToDelete, setItemToDelete] = useState<CommissionRequestWithHistory | null>(null);

  const handleUndo = (id: number) => {
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

    const activeRequests = loadStored<CommissionRequest[]>(requestsStorageKey, []);
    if (activeRequests.some((request) => request.id === id)) return;

    const nextHistory = historyItems.filter(item => item.id !== id);
    const { historyType: _historyType, submittedToHistoryAt: _archivedAt, ...requestData } = itemToRestore;
    const restoredItem: CommissionRequest = {
      ...requestData,
      stage: itemToRestore.historyType === "Finished" ? 4 : itemToRestore.stage,
    };
    const nextRequests = [restoredItem, ...activeRequests];

    localStorage.setItem(storageKey, JSON.stringify(nextHistory));
    localStorage.setItem(requestsStorageKey, JSON.stringify(nextRequests));
    setHistoryItems(nextHistory);
    onRestore(restoredItem);
  };

  const confirmPermanentDelete = () => {
    if (!itemToDelete) return;
    const nextHistory = historyItems.filter(item => item.id !== itemToDelete.id);
    setHistoryItems(nextHistory);
    localStorage.setItem(storageKey, JSON.stringify(nextHistory));
    setItemToDelete(null);
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
        {historyItems.length === 0 && <div className="empty-row">No history records yet. Finished or cancelled requests will appear here.</div>}
      </div>

      {itemToDelete && (
        <div className="modal-backdrop" onMouseDown={() => setItemToDelete(null)}>
          <div className="promo-modal" style={{ maxWidth: "420px", padding: "30px", textAlign: "center" }} onMouseDown={(e) => e.stopPropagation()}>
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
            ["Discount Applied", request.discountName ? `${request.discountName} (-₱${request.discountAmount?.toLocaleString()})` : "None"], 
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
            {/* Top Bar with Controls and X Close Button */}
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

            {/* Largened Image Container */}
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

function Admin({ go }: { go: (page: Page) => void }) {
  const [tab, setTab] = useState("overview");
  const [requests, setRequests] = useState<CommissionRequest[]>(() => loadStored("inkyuu_requests", []));
  const [selected, setSelected] = useState<CommissionRequest | null>(null);

  // Filter states for submission tracker
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all"); // "all" | "priority" | "normal"
  const [filterStyle, setFilterStyle] = useState<string>("all"); // "all" | "Chibi" | "Semi-Realistic"
  const [filterSlotStatus, setFilterSlotStatus] = useState<string>("all"); // "all" | "active" | "reserved" | "unoccupied"
  
  const stages = ["Review", "Sketch", "Lineart", "Color", "Render", "Approved"];
  
  const adminLinks = [
    ["overview", "grid", "Overview"], 
    ["submissions", "user", "Submissions"], 
    ["schedule", "calendar", "Schedule"], 
    ["requests", "mail", "Client requests"], 
    ["artworks", "brush", "Gallery images"], 
    ["products", "spark", "Shop merchandise"], 
    ["discounts", "spark", "Discounts"],
    ["history", "clock", "History"]
  ];

  const updateStage = (id: number, stageIndex: number) => {
    const next = requests.map((request) => Number(request.id) === Number(id) ? { ...request, stage: stageIndex } : request);
    setRequests(next);
    localStorage.setItem("inkyuu_requests", JSON.stringify(next));
  };

  const moveToHistoryAsFinished = (id: number) => {
    const activeRequests = loadStored<CommissionRequest[]>("inkyuu_requests", []);
    const targetRequest = activeRequests.find((request) => Number(request.id) === Number(id));
    if (!targetRequest) {
      setRequests(activeRequests);
      return;
    }

    const historyKey = "inkyuu_history";
    const historyItems = loadStored<CommissionRequestWithHistory[]>(historyKey, []);
    const archivedItem: CommissionRequestWithHistory = {
      ...targetRequest,
      stage: 5,
      historyType: "Finished",
      submittedToHistoryAt: new Date().toISOString(),
    };

    localStorage.setItem(historyKey, JSON.stringify([archivedItem, ...historyItems]));

    const nextRequests = activeRequests.filter((request) => Number(request.id) !== Number(id));
    localStorage.setItem("inkyuu_requests", JSON.stringify(nextRequests));
    setRequests(nextRequests);
    setTab("history");
  };

  const removeRequest = (id: number) => {
    const targetRequest = requests.find(r => Number(r.id) === Number(id));
    if (targetRequest) {
      const historyKey = "inkyuu_history";
      const historyItems = loadStored<any[]>(historyKey, []);
      const cancelledItem = { ...targetRequest, historyType: "Cancelled", submittedToHistoryAt: new Date().toISOString() };
      localStorage.setItem(historyKey, JSON.stringify([cancelledItem, ...historyItems]));
    }

    const nextRequests = requests.filter((request) => Number(request.id) !== Number(id));
    setRequests(nextRequests);
    localStorage.setItem("inkyuu_requests", JSON.stringify(nextRequests));
  };

  const upcoming = [...requests].filter((r) => r.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Filter logic for submission tracker
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
      </aside>
      <section className="admin-main">
        <header><div><p>STUDIO DASHBOARD</p><h1>{adminLinks.find(([id]) => id === tab)?.[2]}</h1></div></header>
        
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
            <section className="admin-panel shop-notice">
              <div>
                <span className="status-pill"><i /> Shop status</span>
                <h2>{loadStored<PublishedItem[]>("inkyuu_products", []).length ? "Published and visible" : "Still unavailable"}</h2>
                <p>{loadStored<PublishedItem[]>("inkyuu_products", []).length} products are currently live. Publish merchandise to automatically open the public shop.</p>
              </div>
              <Icon name="spark" size={34} />
            </section>
          </div>
        )}

        {tab === "submissions" && (
          <div className="admin-panel database-panel">
            <div className="panel-head">
              <div><p>PROJECT DATABASE</p><h2>Submission tracker</h2></div>
              <span>Saved automatically · {filteredRequests.length} of {requests.length} records</span>
            </div>
            
            {/* Filter and Search Controls Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "10px", padding: "16px 0", borderBottom: "1px solid var(--line)", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <input 
                  type="text" 
                  placeholder="Search by customer name..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "12px", borderRadius: "4px" }}
                />
              </div>
              <div>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "12px", borderRadius: "4px" }}>
                  <option value="all">All Priorities</option>
                  <option value="priority">Priority Only</option>
                  <option value="normal">Normal Only</option>
                </select>
              </div>
              <div>
                <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "12px", borderRadius: "4px" }}>
                  <option value="all">All Art Styles</option>
                  <option value="Chibi">Chibi</option>
                  <option value="Semi-Realistic">Semi-Realistic</option>
                </select>
              </div>
              <div>
                <select value={filterSlotStatus} onChange={(e) => setFilterSlotStatus(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "12px", borderRadius: "4px" }}>
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
        {tab === "artworks" && <PublishManager mode="gallery" />}
        {tab === "products" && <PublishManager mode="products" />}
        {tab === "discounts" && <DiscountManager />}
        {tab === "history" && <HistoryManager onRestore={(request) => setRequests((current) => [request, ...current.filter((item) => item.id !== request.id)])} />}
      </section>
      {selected && <RequestDetail request={selected} close={() => setSelected(null)} />}
    </main>
  );
}

function Login({ onLogin, go }: { onLogin: () => void; go: (page: Page) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Validating against username "admin" and password "kyuukyuuji@12_36729"
    if (username === "admin" && password === "kyuukyuuji@12_36729") {
      sessionStorage.setItem("inkyuu_admin_auth", "true");
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="login-page">
      <button className="login-back" onClick={() => go("home")}>
        <Icon name="arrow" /> Back to website
      </button>
      <div className="login-card">
        <img src={logo} alt="" />
        <img className="login-wordmark" src={brandName} alt="Inkyuu" />
        <p>Studio Admin Access</p>
        <form onSubmit={handleLogin}>
          <Field label="Username">
            <input 
              type="text" 
              required 
              value={username} 
              onChange={(e) => { setUsername(e.target.value); setError(false); }} 
              placeholder="Enter username..." 
            />
          </Field>
          <Field label="Password">
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => { setPassword(e.target.value); setError(false); }} 
              placeholder="Enter password..." 
            />
          </Field>
          {error && <span className="login-error">Invalid username or password. Please try again.</span>}
          <Btn type="submit">Log in <Icon name="arrow" /></Btn>
        </form>
        <small>Protected studio route</small>
      </div>
    </div>
  );
}

function Footer({ go }: { go: (page: Page) => void }) {
  const requests = loadStored<CommissionRequest[]>("inkyuu_requests", []);
  const activeSemiCount = requests.filter(r => r.type.startsWith("Semi-Realistic")).length;
  const slotDisplayCount = Math.min(3, activeSemiCount);

  return (
    <footer>
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <div>
            <img src={logo} alt="" />
            <img className="footer-wordmark" src={brandName} alt="Inkyuu" />
          </div>
          <p>Warm, character-led digital art<br />made in the Philippines.</p>
        </div>
        <div>
          <h3>Explore</h3>
          {[["Gallery", "gallery"], ["Commission", "commission"], ["Guide", "guide"], ["Shop", "shop"], ["About", "about"]].map(([label, page]) => <button key={label} onClick={() => go(page as Page)}>{label}</button>)}
        </div>
        <div>
          <h3>Say hello</h3>
          <a href="mailto:kyuukyuuji@gmail.com">kyuukyuuji@gmail.com</a>
          <a href="https://www.instagram.com/jeii_ji" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://www.facebook.com/christinejoy.morata02/" target="_blank" rel="noreferrer">Facebook</a>
        </div>
        <div className="footer-note">
          <p>Currently accepting</p>
          <strong><i /> {slotDisplayCount} / 3 commission slots</strong>
          <Btn kind="outline" onClick={() => go("commission")}>Request a slot</Btn>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© 2025 Inkyuu Studio. All art reserved.</span>
        <span>Made with care, color & good music.</span>
      </div>
    </footer>
  );
}

export default function App() {
  const getPage = (): Page => {
    const hash = window.location.hash.replace("#", "") as Page;
    return ["home", "gallery", "shop", "guide", "about", "commission", "admin"].includes(hash) ? hash : "home";
  };
  const [page, setPage] = useState<Page>(getPage);
  const [promo, setPromo] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(() => sessionStorage.getItem("inkyuu_admin_auth") === "true");

  useEffect(() => {
    const discounts = loadStored<DiscountItem[]>("inkyuu_discounts", []);
    const timer = window.setTimeout(() => { 
      if (getPage() === "home" && discounts.length > 0) {
        setPromo(true); 
      }
    }, 900);
    const onHash = () => {
      setPage(getPage());
      if (window.location.hash.replace("#", "") === "admin") {
        setIsAdminAuth(sessionStorage.getItem("inkyuu_admin_auth") === "true");
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", onHash); };
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll("main > section, .featured-card, .medium-card, .gallery-card, .guide-sections article");
    elements.forEach((element) => element.classList.add("scroll-reveal"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("revealed"); observer.unobserve(entry.target); } }), { threshold: .08 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [page]);

  const go = (next: Page) => { window.location.hash = next; setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const content = useMemo(() => ({ home: <Home go={go} openPromo={() => setPromo(true)} />, gallery: <Gallery />, shop: <Shop go={go} />, guide: <Guide go={go} />, about: <About go={go} />, commission: <Commission />, admin: <Admin go={go} /> }), []);
  
  if (page === "admin") {
    if (!isAdminAuth) {
      return <Login onLogin={() => setIsAdminAuth(true)} go={go} />;
    }
    return content.admin;
  }

  return <div className="site-shell"><Navbar page={page} go={go} />{content[page]}<Footer go={go} />{promo && loadStored<DiscountItem[]>("inkyuu_discounts", []).length > 0 && <PromoModal close={() => setPromo(false)} go={go} />}</div>;
}

function go(arg0: string) {
  throw new Error("Function not implemented.");
}
