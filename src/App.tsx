import { useEffect, useMemo, useState } from "react";
import logo from "./assets/inkdrop-logo.png";
import brandName from "./assets/brand-name.png";
import placeholder from "./assets/placeholder.svg";
import guidePdf from "./assets/Kyuu Commission Guide.pdf";

type Page = "home" | "gallery" | "shop" | "guide" | "about" | "commission" | "admin";
type Currency = "PHP" | "USD";
type CommissionRequest = {
  id: number; name: string; email: string; social: string; type: string; finish: string;
  characters: number; background: string; commercial: boolean; priority: boolean;
  dueDate: string; notes: string; references: string[]; totalPhp: number;
  submittedAt: string; stage: number;
};
type PublishedItem = {
  id: number; title: string; description: string; image: string; category: string;
  price?: number; publishedAt: string;
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
  | "user";

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
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const artItems = [
  { id: 1, title: "Golden Hour", type: "Semi-Realistic", desc: "A study in soft light, quiet confidence, and warm summer color.", art: "sunset", size: "tall", tags: ["portrait", "warm light", "digital"] },
  { id: 2, title: "Tea Break", type: "Chibi", desc: "A tiny afternoon ritual with an oversized cup and extra joy.", art: "tea", size: "tall", tags: ["chibi", "character", "cozy"] },
  { id: 3, title: "Koi Dreams", type: "Semi-Realistic", desc: "Dreamlike currents inspired by koi ponds and silk.", art: "koi", size: "medium", tags: ["fantasy", "water", "editorial"] },
  { id: 4, title: "Lucky Scout", type: "Chibi", desc: "A pocket-sized adventurer ready for the next quest.", art: "scout", size: "medium", tags: ["chibi", "game art", "cute"] },
  { id: 5, title: "Flora", type: "Semi-Realistic", desc: "Botanical shapes meet expressive portraiture.", art: "flora", size: "short", tags: ["nature", "portrait", "green"] },
  { id: 6, title: "Orange Club", type: "Chibi", desc: "A playful character set made for stickers.", art: "orange", size: "short", tags: ["sticker", "chibi", "collection"] },
];

const Btn = ({ children, kind = "primary", onClick, type = "button", className = "" }: { children: React.ReactNode; kind?: "primary" | "outline" | "ghost"; onClick?: () => void; type?: "button" | "submit"; className?: string }) => (
  <button type={type} className={`btn btn-${kind} ${className}`} onClick={onClick}>{children}</button>
);

const loadStored = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
};
const money = (php: number, currency: Currency) => currency === "PHP" ? `₱${php.toLocaleString()}` : `$${(php / 58).toFixed(2)}`;

function Navbar({ page, go, currency, setCurrency }: { page: Page; go: (page: Page) => void; currency: Currency; setCurrency: (currency: Currency) => void }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
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
          <button className="settings-button" aria-label="Open settings" aria-expanded={settings} onClick={() => setSettings(!settings)}><Icon name="menu" /></button>
          {settings && <div className="settings-popover"><p>Display currency</p><div>{(["PHP", "USD"] as Currency[]).map((item) => <button className={currency === item ? "active" : ""} key={item} onClick={() => { setCurrency(item); setSettings(false); }}><span>{item === "PHP" ? "₱" : "$"}</span>{item === "PHP" ? "Peso" : "USD"}{currency === item && <Icon name="check" />}</button>)}</div><button className="admin-entry" onClick={() => { setSettings(false); go("admin"); }}><Icon name="user" /> Admin log in <Icon name="arrow" /></button></div>}
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
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <div className="promo-modal" role="dialog" aria-modal="true" aria-labelledby="promo-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="Close"><Icon name="close" /></button>
        <div className="promo-layout">
          <div className="promo-art"><img src={logo} alt="Inkyuu bottle logo" /><span>15%</span></div>
          <div className="promo-content">
            <div className="eyebrow"><Icon name="spark" size={15} /> A little treat</div>
            <h2 id="promo-title">Your idea deserves to be drawn.</h2>
            <p>Book a commission this month and enjoy 15% off your first character illustration.</p>
            <div className="promo-code"><span>Use code</span><strong>FIRSTDROP15</strong></div>
            <Btn onClick={() => { close(); go("commission"); }}>Start a commission <Icon name="arrow" /></Btn>
            <button className="text-link" onClick={close}>Maybe later</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home({ go, openPromo }: { go: (page: Page) => void; openPromo: () => void }) {
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
          <div className="promo-banner"><div><span>FIRST TIME HERE?</span><h2>A warm welcome, with 15% off.</h2><p>Let's make your first Inkyuu piece extra special.</p></div><Btn kind="outline" onClick={openPromo}>Reveal my offer <Icon name="spark" /></Btn></div>
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
  const allItems: GalleryItem[] = [
    ...artItems.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      desc: item.desc,
      art: item.art,
      size: item.size,
      tags: item.tags,
    })),
    ...published.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.category || "Chibi",
      desc: item.description,
      image: item.image,
      size: "medium",
      tags: ["published", item.category || "Chibi"],
      publishedAt: item.publishedAt,
    })),
  ];
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const visible = allItems.filter((item) => item.type === filter);
  const visual = (item: GalleryItem) => {
    if ("image" in item && item.image) {
      return <img className="gallery-real-image" src={item.image} alt={item.title} />;
    }

    if ("art" in item) {
      return <ArtVisual art={item.art} label={item.title} />;
    }

    return <ArtVisual art="placeholder" label={item.title} />;
  };
  return (
    <main className="page-main">
      <section className="page-hero wrap"><p className="kicker">Selected works · 2023—2025</p><h1>Gallery of <em>little worlds.</em></h1><p>A collection of character-led illustrations, warm studies, and playful experiments.</p></section>
      <div className="filter-bar"><div className="filter-toggle" aria-label="Filter artwork">{(["Chibi", "Semi-Realistic"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}<span>{allItems.filter((art) => art.type === item).length}</span></button>)}</div></div>
      <section key={filter} className="wrap gallery-grid">
        {visible.map((item) => <button className={`gallery-card gallery-image-only ${item.size}`} key={item.id} onClick={() => setSelected(item)} aria-label={`View ${item.title} details`}>{visual(item)}<span className="gallery-hover">View artwork <Icon name="arrow" /></span></button>)}
      </section>
      {selected && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><div className="project-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}><Icon name="close" /></button><div className="project-image">{visual(selected)}</div><div className="project-copy"><p className="kicker">{selected.type} · Featured project</p><h2>{selected.title}</h2><p>{selected.desc}</p><div className="tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="project-meta"><span>Published<strong>{"publishedAt" in selected ? selected.publishedAt : "2025"}</strong></span><span>Tools<strong>Procreate</strong></span><span>Format<strong>Digital art</strong></span></div></div></div></div>}
    </main>
  );
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => <label className="field"><span>{label}</span>{hint && <small>{hint}</small>}{children}</label>;

function Commission({ currency }: { currency: Currency }) {
  const [form, setForm] = useState({ name: "", email: "", social: "", dueDate: "", notes: "" });
  const [type, setType] = useState("Bust-up");
  const [finish, setFinish] = useState("Fully Rendered");
  const [characters, setCharacters] = useState(1);
  const [background, setBackground] = useState("Simple");
  const [commercial, setCommercial] = useState(false);
  const [priority, setPriority] = useState(false);
  const [references, setReferences] = useState<string[]>([]);
  const base = type === "Bust-up" ? 150 : type === "Half-body" ? 250 : 400;
  const finishPrice = finish === "Sketch" ? 0 : finish === "Lineart" ? 100 : finish === "Flat Color" ? 200 : 300;
  const charactersPrice = base + finishPrice + (characters - 1) * Math.round((base + finishPrice) * .75);
  const subtotal = charactersPrice + (background === "Detailed" ? 350 : background === "Simple" ? 100 : 0) + (commercial ? 500 : 0);
  const total = Math.round(subtotal * (priority ? 1.1 : 1));
  const setValue = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });
  const uploadReferences = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 3).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setReferences((current) => [...current, String(reader.result)].slice(0, 3));
      reader.readAsDataURL(file);
    });
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const requests = loadStored<CommissionRequest[]>("inkyuu_requests", []);
    const request: CommissionRequest = { id: Date.now(), ...form, type, finish, characters, background, commercial, priority, references, totalPhp: total, submittedAt: new Date().toISOString(), stage: 0 };
    localStorage.setItem("inkyuu_requests", JSON.stringify([request, ...requests]));
    alert("Your commission request was saved. Inkyuu will be in touch soon.");
    setForm({ name: "", email: "", social: "", dueDate: "", notes: "" });
    setReferences([]);
  };
  return (
    <main className="page-main commission-page">
      <section className="page-hero wrap"><p className="kicker">Commission request</p><h1>Let's make something <em>yours.</em></h1><p>Build your request using Inkyuu’s modular pricing. Your submission will be saved directly to the studio tracker.</p></section>
      <div className="wrap commission-layout">
        <form className="commission-form" onSubmit={submit}>
          <div className="form-section"><div className="form-number">01</div><div><h2>Your details</h2><p>Where can I reach you, and when do you need it?</p></div>
            <div className="two-col"><Field label="Facebook display name / nickname"><input required value={form.name} onChange={(e) => setValue("name", e.target.value)} placeholder="Name or nickname" /></Field><Field label="Email address"><input required type="email" value={form.email} onChange={(e) => setValue("email", e.target.value)} placeholder="you@example.com" /></Field><Field label="Social media handle"><input value={form.social} onChange={(e) => setValue("social", e.target.value)} placeholder="@username" /></Field><Field label="Planned due date"><input required type="date" value={form.dueDate} onChange={(e) => setValue("dueDate", e.target.value)} /></Field></div>
          </div>
          <div className="form-section"><div className="form-number">02</div><div><h2>Choose the scope</h2><p>Start with the base character crop described in the commission guide.</p></div>
            <div className="option-grid three">{[["Bust-up", 150], ["Half-body", 250], ["Full-body", 400]].map(([name, price]) => <button type="button" className={`choice-card ${type === name ? "selected" : ""}`} onClick={() => setType(String(name))} key={name}><span className="radio" /><strong>{name}</strong><b>{money(Number(price), currency)}</b><small>Base character scope</small></button>)}</div>
          </div>
          <div className="form-section"><div className="form-number">03</div><div><h2>Build your piece</h2><p>Add finish, characters, background, and usage.</p></div>
            <div className="two-col"><Field label="Finish level"><select value={finish} onChange={(e) => setFinish(e.target.value)}><option>Sketch</option><option>Lineart</option><option>Flat Color</option><option>Fully Rendered</option></select></Field><Field label="Number of characters"><div className="stepper"><button type="button" onClick={() => setCharacters(Math.max(1, characters - 1))}>−</button><strong>{characters}</strong><button type="button" onClick={() => setCharacters(Math.min(5, characters + 1))}>+</button></div></Field><Field label="Background detail"><select value={background} onChange={(e) => setBackground(e.target.value)}><option>None</option><option>Simple</option><option>Detailed</option></select></Field></div>
            <label className="check-row"><input type="checkbox" checked={commercial} onChange={(e) => setCommercial(e.target.checked)} /><span><strong>Commercial usage</strong><small>For products, marketing, streaming, or business use.</small></span><b>+{money(500, currency)}</b></label>
            <label className="check-row"><input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} /><span><strong>Priority delivery</strong><small>Fast-tracked ahead of the standard production queue.</small></span><b>+10%</b></label>
          </div>
          <div className="form-section"><div className="form-number">04</div><div><h2>Tell me your vision</h2><p>Poses, expressions, mood, and clear visual references are helpful.</p></div><Field label="Project notes" hint="NSFW, suggestive content, heavy gore, mecha, and canon ships are not accepted."><textarea required rows={6} value={form.notes} onChange={(e) => setValue("notes", e.target.value)} placeholder="Describe the character and scene..." /></Field><Field label="Reference images" hint="Up to three image files."><input type="file" accept="image/*" multiple onChange={(e) => uploadReferences(e.target.files)} /></Field>{references.length > 0 && <div className="reference-previews">{references.map((image, index) => <img src={image} alt={`Reference ${index + 1}`} key={`${image.slice(-12)}-${index}`} />)}</div>}</div>
          <label className="terms-check"><input required type="checkbox" /> I agree to the commission guide, copyright, payment, communication, and cancellation terms.</label>
          <Btn type="submit" className="submit-btn">Send commission request <Icon name="arrow" /></Btn>
        </form>
        <aside className="estimate-card"><div className="estimate-top"><span>Live estimate · {currency}</span><Icon name="spark" /></div><h2>{money(total, currency)}</h2><div className="estimate-lines"><p><span>{type} base</span><b>{money(base, currency)}</b></p><p><span>{finish}</span><b>+{money(finishPrice, currency)}</b></p><p><span>{characters} character{characters > 1 ? "s" : ""}</span><b>{money(charactersPrice, currency)}</b></p><p><span>{background} background</span><b>+{money(background === "Detailed" ? 350 : background === "Simple" ? 100 : 0, currency)}</b></p>{commercial && <p><span>Commercial license</span><b>+{money(500, currency)}</b></p>}{priority && <p><span>Priority fee</span><b>+10%</b></p>}</div><div className="estimate-total"><span>Estimated total</span><strong>{money(total, currency)}</strong></div><p className="fine-print">Final price may vary after review. GCASH is the accepted payment platform.</p><div className="process-list">{["Request review", "Sketch", "20% midpoint payment", "Final settlement"].map((item, i) => <p key={item}><span>{i + 1}</span>{item}</p>)}</div></aside>
      </div>
    </main>
  );
}

function Shop({ go, currency }: { go: (page: Page) => void; currency: Currency }) {
  const products = loadStored<PublishedItem[]>("inkyuu_products", []);
  return <main className="page-main"><section className="page-hero wrap"><p className="kicker">The tiny shop</p><h1>Art made to <em>hold.</em></h1><p>Stickers, prints, and little pieces of joy from the Inkyuu studio.</p></section>{products.length > 0 ? <section className="wrap product-grid">{products.map((product) => <article key={product.id}><img src={product.image || placeholder} alt={product.title} /><div><span>{product.category}</span><h2>{product.title}</h2><p>{product.description}</p><strong>{money(product.price || 0, currency)}</strong><small>Published {product.publishedAt}</small></div></article>)}</section> : <section className="empty-shop wrap"><div className="shop-art"><span className="shop-sun" /><img src={placeholder} alt="Artwork placeholder" /></div><div className="shop-copy"><span className="status-pill"><i /> Restocking in progress</span><h2>Shop is still unavailable</h2><p>I'm putting the finishing touches on a cheerful collection of stickers, posters, photocards, portraits, and sticker sets.</p><div className="notify-row"><input aria-label="Email for shop updates" placeholder="Email for first dibs" /><Btn>Notify me</Btn></div><button className="text-link" onClick={() => go("gallery")}>Browse the gallery while you wait <Icon name="arrow" /></button></div></section>}</main>;
}

function Guide({ go }: { go: (page: Page) => void }) {
  const sections = [
    { number: "01", title: "Rules & regulations", intro: "Clear boundaries keep every project safe, respectful, and enjoyable.", items: [["Content", "No NSFW, nudity, suggestive content, heavy gore, controversial content, or depictions of bodily fluids."], ["Will draw", "Angst, fluff, original characters, fan art, stickers, and memes."], ["Won’t draw", "Canon ships, furries or animals, mecha, cars, or major changes to canon character designs."], ["Copyright", "The artist retains copyright. Public use requires clear credit; alteration, AI training, blockchain, and NFTs are prohibited."]] },
    { number: "02", title: "Workflow & payment", intro: "A milestone-based process with no upfront cost before the initial drafting phase.", items: [["Sketch first", "Work begins and develops through the approved sketch without upfront payment."], ["20% midpoint payment", "A mandatory 20% downpayment is requested once the final sketch is approved."], ["Final settlement", "The remaining balance is due within three calendar days after completion. Unwatermarked files are released after payment clears."], ["Priority projects", "A required deadline can be fast-tracked for an additional 10% of the total project price."]] },
    { number: "03", title: "Communication & delivery", intro: "Timely feedback protects your slot and keeps the production calendar moving.", items: [["Response window", "Please respond to updates and approval requests within three calendar days."], ["Inactivity", "Fourteen days without communication may be treated as abandonment and the slot may reopen."], ["File storage", "Final high-resolution files remain available through cloud storage for six months."], ["Availability", "Only three commissions are active at a time. Reservations are contacted first when a slot opens."]] },
    { number: "04", title: "Cancellation", intro: "Refund eligibility changes as time and labor are invested.", items: [["Grace period", "Cancellation within seven days of booking is eligible for a full refund."], ["Mid-production", "After the grace period, cancellation ends production; 12% of the downpayment is refunded with the latest work-in-progress export."], ["Non-payment", "Missing the midpoint or final payment deadlines may terminate the project and forfeit the slot."], ["Force majeure", "For emergencies or technical delays, a revised timeline or cancellation option will be discussed."]] },
  ];
  return <main className="page-main guide-page"><section className="guide-hero"><div className="wrap"><p className="kicker">Kyuu commission guide</p><h1>Good art starts with <em>clear expectations.</em></h1><p>Everything you need to know before booking a commission with Inkyuu.</p><div><Btn onClick={() => go("commission")}>Start a request <Icon name="arrow" /></Btn><a className="btn btn-outline" href={guidePdf} target="_blank" rel="noreferrer">Open original PDF</a></div></div></section><section className="wrap guide-status"><div><span>Status</span><strong><i /> Open</strong></div><div><span>Active slots</span><strong>0 / 3</strong></div><div><span>Reserved</span><strong>0 / 2</strong></div><div><span>Contact hours</span><strong>10 AM–9 PM UTC+8</strong></div></section><section className="wrap guide-sections">{sections.map((section) => <article key={section.number}><div className="guide-title"><span>{section.number}</span><div><p className="kicker">Commission policy</p><h2>{section.title}</h2><p>{section.intro}</p></div></div><div className="guide-items">{section.items.map(([title, text]) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}</div></article>)}</section><section className="guide-contact"><div className="wrap"><div><p className="kicker">Questions?</p><h2>Let’s clear things up before we start.</h2><p>Reach the studio at kyuukyuuji@gmail.com or review the complete attached guide.</p></div><Btn onClick={() => go("commission")}>Commission now <Icon name="arrow" /></Btn></div></section></main>;
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

function RequestDetail({ request, close }: { request: CommissionRequest; close: () => void }) {
  return <div className="modal-backdrop" onMouseDown={close}><div className="request-modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={close}><Icon name="close" /></button><p className="kicker">Submitted {new Date(request.submittedAt).toLocaleString()}</p><h2>{request.name}’s request</h2><div className="request-answers">{[["Email", request.email], ["Social handle", request.social || "Not provided"], ["Scope", request.type], ["Finish", request.finish], ["Characters", String(request.characters)], ["Background", request.background], ["Commercial use", request.commercial ? "Yes" : "No"], ["Priority", request.priority ? "Yes" : "No"], ["Due date", request.dueDate], ["Estimate", `₱${request.totalPhp.toLocaleString()}`], ["Project notes", request.notes]].map(([label, answer]) => <div key={label}><span>{label}</span><p>{answer}</p></div>)}</div>{request.references.length > 0 && <div className="request-references"><h3>Reference images</h3>{request.references.map((image, i) => <img src={image} alt={`Client reference ${i + 1}`} key={i} />)}</div>}</div></div>;
}

function Admin({ go }: { go: (page: Page) => void }) {
  const [tab, setTab] = useState("overview");
  const [requests, setRequests] = useState<CommissionRequest[]>(() => loadStored("inkyuu_requests", []));
  const [selected, setSelected] = useState<CommissionRequest | null>(null);
  const stages = ["Review", "Sketch", "Lineart", "Color", "Render"];
  const adminLinks = [["overview", "grid", "Overview"], ["submissions", "user", "Submissions"], ["schedule", "calendar", "Schedule"], ["requests", "mail", "Client requests"], ["artworks", "brush", "Gallery images"], ["products", "spark", "Shop merchandise"]];
  const updateStage = (id: number, stage: number) => { const next = requests.map((request) => request.id === id ? { ...request, stage } : request); setRequests(next); localStorage.setItem("inkyuu_requests", JSON.stringify(next)); };
  const removeRequest = (id: number) => { const next = requests.filter((request) => request.id !== id); setRequests(next); localStorage.setItem("inkyuu_requests", JSON.stringify(next)); };
  const upcoming = [...requests].filter((r) => r.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return <main className="admin-shell"><aside className="admin-nav"><button className="admin-brand" onClick={() => go("home")}><img src={logo} alt="" /><img src={brandName} alt="Inkyuu" /></button><nav>{adminLinks.map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon name={icon as IconName} />{label}</button>)}</nav><button className="back-site" onClick={() => go("home")}><Icon name="arrow" /> Back to website</button></aside><section className="admin-main"><header><div><p>STUDIO DASHBOARD</p><h1>{adminLinks.find(([id]) => id === tab)?.[2]}</h1></div></header>
    {tab === "overview" && <div className="notification-grid"><section className="admin-panel"><div className="panel-head"><div><p>INBOX</p><h2>New requests</h2></div><span>{requests.filter((r) => r.stage === 0).length} new</span></div><div className="notification-list">{requests.filter((r) => r.stage === 0).slice(0, 5).map((request) => <button key={request.id} onClick={() => setSelected(request)}><span><Icon name="mail" /></span><div><strong>{request.name} submitted a commission</strong><small>{request.type} · {new Date(request.submittedAt).toLocaleDateString()}</small></div><Icon name="arrow" /></button>)}{requests.length === 0 && <p className="empty-row">New commission requests will appear here.</p>}</div></section><section className="admin-panel"><div className="panel-head"><div><p>CALENDAR</p><h2>Upcoming deadlines</h2></div></div><div className="deadline-list">{upcoming.slice(0, 5).map((request) => <button key={request.id} onClick={() => setSelected(request)}><time>{new Date(`${request.dueDate}T00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</time><span><strong>{request.name}</strong><small>{request.type} · {stages[request.stage]}</small></span></button>)}{upcoming.length === 0 && <p className="empty-row">No client deadlines scheduled.</p>}</div></section><section className="admin-panel shop-notice"><div><span className="status-pill"><i /> Shop status</span><h2>{loadStored<PublishedItem[]>("inkyuu_products", []).length ? "Published and visible" : "Still unavailable"}</h2><p>{loadStored<PublishedItem[]>("inkyuu_products", []).length} products are currently live. Publish merchandise to automatically open the public shop.</p></div><Icon name="spark" size={34} /></section></div>}
    {tab === "submissions" && <div className="admin-panel database-panel"><div className="panel-head"><div><p>PROJECT DATABASE</p><h2>Submission tracker</h2></div><span>Saved automatically · {requests.length} records</span></div><div className="database-table"><div className="database-row database-head"><span>Client</span><span>Project</span><span>Due</span><span>Finish level</span><span>Progress</span><span /></div>{requests.map((request) => <div className="database-row" key={request.id}><button className="client-cell" onClick={() => setSelected(request)}><strong>{request.name}</strong><small>{request.email}</small></button><span>{request.type} · {request.characters} char.</span><time>{request.dueDate}</time><select value={request.stage} onChange={(e) => updateStage(request.id, Number(e.target.value))}>{stages.map((stage, index) => <option value={index} key={stage}>{stage}</option>)}</select><div className="progress-cell"><span><i style={{ width: `${request.stage * 25}%` }} /></span><b>{request.stage * 25}%</b></div><button onClick={() => removeRequest(request.id)}><Icon name="trash" /></button></div>)}{requests.length === 0 && <p className="empty-row">No submissions yet. Public form responses are retained here.</p>}</div></div>}
    {tab === "schedule" && <div className="admin-panel schedule-panel"><div className="panel-head"><div><p>CLIENT DUE DATES</p><h2>Schedule</h2></div><span>{upcoming.length} planned</span></div><div className="schedule-list">{upcoming.map((request) => <button key={request.id} onClick={() => setSelected(request)}><time><strong>{new Date(`${request.dueDate}T00:00`).toLocaleDateString("en-US", { day: "2-digit" })}</strong><span>{new Date(`${request.dueDate}T00:00`).toLocaleDateString("en-US", { month: "short" })}</span></time><div><h3>{request.name}</h3><p>{request.type} · {request.finish} · {request.characters} character{request.characters > 1 ? "s" : ""}</p></div><span className="admin-status">{stages[request.stage]}</span><Icon name="arrow" /></button>)}{upcoming.length === 0 && <p className="empty-row">Requested client due dates will appear automatically.</p>}</div></div>}
    {tab === "requests" && <div className="admin-panel"><div className="panel-head"><div><p>AUTOMATIC INBOX</p><h2>Client requests</h2></div><span>{requests.length} total</span></div><div className="request-list">{requests.map((request) => <button key={request.id} onClick={() => setSelected(request)}><span className="request-avatar">{request.name.slice(0, 2).toUpperCase()}</span><div><strong>{request.name}</strong><small>{request.type} · {request.finish} · submitted {new Date(request.submittedAt).toLocaleDateString()}</small></div><span>{request.dueDate}</span><Icon name="arrow" /></button>)}{requests.length === 0 && <p className="empty-row">Completed commission forms will be added here automatically.</p>}</div></div>}
    {tab === "artworks" && <PublishManager mode="gallery" />}
    {tab === "products" && <PublishManager mode="products" />}
  </section>{selected && <RequestDetail request={selected} close={() => setSelected(null)} />}</main>;
}

function Footer({ go }: { go: (page: Page) => void }) {
  return <footer><div className="wrap footer-grid"><div className="footer-brand"><div><img src={logo} alt="" /><img className="footer-wordmark" src={brandName} alt="Inkyuu" /></div><p>Warm, character-led digital art<br />made in the Philippines.</p></div><div><h3>Explore</h3>{[["Gallery", "gallery"], ["Commission", "commission"], ["Guide", "guide"], ["Shop", "shop"], ["About", "about"]].map(([label, page]) => <button key={label} onClick={() => go(page as Page)}>{label}</button>)}</div><div><h3>Say hello</h3><a href="mailto:kyuukyuuji@gmail.com">kyuukyuuji@gmail.com</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a></div><div className="footer-note"><p>Currently accepting</p><strong><i /> 3 commission slots</strong><Btn kind="outline" onClick={() => go("commission")}>Request a slot</Btn></div></div><div className="wrap footer-bottom"><span>© 2025 Inkyuu Studio. All art reserved.</span><span>Made with care, color & good music.</span></div></footer>;
}

function AdminLogin({ onLogin, go }: { onLogin: () => void; go: (page: Page) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "kyuukyuuji@12_36729") { sessionStorage.setItem("inkyuu_admin", "true"); onLogin(); }
    else setError("That username or password is incorrect.");
  };
  return <main className="login-page"><button className="login-back" onClick={() => go("home")}><Icon name="arrow" /> Back to website</button><section className="login-card"><img src={logo} alt="" /><img className="login-wordmark" src={brandName} alt="Inkyuu" /><p>Protected studio access</p><form onSubmit={submit}><Field label="Username"><input required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></Field><Field label="Password"><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>{error && <span className="login-error">{error}</span>}<Btn type="submit">Log in <Icon name="arrow" /></Btn></form><small>Demo access: admin / inkyuu</small></section></main>;
}

export default function App() {
  const getPage = (): Page => {
    const hash = window.location.hash.replace("#", "") as Page;
    return ["home", "gallery", "shop", "guide", "about", "commission", "admin"].includes(hash) ? hash : "home";
  };
  const [page, setPage] = useState<Page>(getPage);
  const [promo, setPromo] = useState(false);
  const [currency, setCurrencyState] = useState<Currency>(() => loadStored("inkyuu_currency", "PHP"));
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem("inkyuu_admin") === "true");
  useEffect(() => {
    const timer = window.setTimeout(() => { if (getPage() === "home") setPromo(true); }, 900);
    const onHash = () => setPage(getPage());
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
  const setCurrency = (next: Currency) => { setCurrencyState(next); localStorage.setItem("inkyuu_currency", JSON.stringify(next)); };
  const go = (next: Page) => { window.location.hash = next; setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const content = useMemo(() => ({ home: <Home go={go} openPromo={() => setPromo(true)} />, gallery: <Gallery />, shop: <Shop go={go} currency={currency} />, guide: <Guide go={go} />, about: <About go={go} />, commission: <Commission currency={currency} />, admin: <Admin go={go} /> }), [currency]);
  if (page === "admin") return authenticated ? content.admin : <AdminLogin onLogin={() => setAuthenticated(true)} go={go} />;
  return <div className="site-shell"><Navbar page={page} go={go} currency={currency} setCurrency={setCurrency} />{content[page]}<Footer go={go} />{promo && <PromoModal close={() => setPromo(false)} go={go} />}</div>;
}
