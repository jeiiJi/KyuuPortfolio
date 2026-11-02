import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import logo from "./assets/inkdrop-logo.png";
import brandName from "./assets/brand-name.png";
import placeholder from "./assets/placeholder.svg";
import chibiReference from "./assets/Untitled201_20261021205439.png";
const API_URL = "";

type Page = "home" | "guide" | "commission" | "admin";
type CommissionRequest = {
  id: number; name: string; email: string; social: string; type: string; finish: string;
  characters: number; background: string; commercial: boolean; priority: boolean;
  dueDate: string; notes: string; references: string[]; totalPhp: number;
  // Currency the client used on the form, the total in that currency, and the PHP-per-unit
  currency?: CurrencyCode; totalAmount?: number; exchangeRate?: number;
  submittedAt: string; stage: number;
  historyType?: "Finished" | "Cancelled"; submittedToHistoryAt?: string;
};
type PublishedItem = {
  id: number; title: string; description: string; image: string; category: string;
  scope?: string; service?: string; colorFinish?: string;
  imageCount?: number; tools?: string; format?: string;
  publishedAt: string;
};
type CarouselSlide = { position: number; data: string; alt: string; version?: number; focusX?: number; focusY?: number; zoom?: number };
// Framing for one hero slide: focal point (0-100 % from the left/top) and zoom (1 = fit to cover).
type SlideFrame = { x: number; y: number; zoom: number };
const DEFAULT_FRAME: SlideFrame = { x: 50, y: 50, zoom: 1 };
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};
const frameFromSlide = (slide: Partial<CarouselSlide>): SlideFrame => ({
  x: clampNumber(slide.focusX, 0, 100, DEFAULT_FRAME.x),
  y: clampNumber(slide.focusY, 0, 100, DEFAULT_FRAME.y),
  zoom: clampNumber(slide.zoom, MIN_ZOOM, MAX_ZOOM, DEFAULT_FRAME.zoom),
});
// Used by BOTH the home hero and the admin preview so the two always frame an image identically.
const frameImageStyle = (frame: SlideFrame): CSSProperties => ({
  objectPosition: `${frame.x}% ${frame.y}%`,
  transformOrigin: `${frame.x}% ${frame.y}%`,
  transform: frame.zoom > 1 ? `scale(${frame.zoom})` : undefined,
});
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
  | "eye-off"
  | "pause"
  | "play";

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
    pause: <><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" /></>,
    play: <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />,
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
// ---------------------------------------------------------------------------
// Multi-currency + independent pricing
//
// PHP and USD are two SEPARATE price lists (see PRICE_TABLES below):
//   - PHP is tailored for local clients / meet-ups.
//   - USD is set on its own for international clients. It is NOT PHP / rate.
// EUR has no price list of its own: it is the USD price translated into euro
// with EUR_PER_USD.
//
// To re-quote, edit PRICE_TABLES.USD (or PRICE_TABLES.PHP) and/or the rates
// below. Records that were already submitted keep what they were saved with.
// ---------------------------------------------------------------------------
type CurrencyCode = "PHP" | "USD" | "EUR";

// Standard conversion used to derive EUR from the USD price (1 USD = X EUR).
const EUR_PER_USD = 0.8937;
// Reference only: lets the admin see a rough peso equivalent of USD / EUR
// requests. It is never used to price anything shown to a client.
const PHP_PER_USD_REFERENCE = 63.70;

const CURRENCIES: Record<CurrencyCode, { symbol: string; label: string; phpPerUnit: number; decimals: number }> = {
  PHP: { symbol: "₱", label: "Philippine peso", phpPerUnit: 1, decimals: 0 },
  USD: { symbol: "$", label: "US dollar", phpPerUnit: PHP_PER_USD_REFERENCE, decimals: 2 },
  EUR: { symbol: "€", label: "Euro", phpPerUnit: roundToDecimals(PHP_PER_USD_REFERENCE / EUR_PER_USD, 2), decimals: 2 },
};
const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
const CURRENCY_STORAGE_KEY = "inkyuu:currency";

function roundToDecimals(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

// Every number that makes up a quote. PHP and USD each get their own copy.
type PriceTable = {
  chibiBase: Record<string, number>;
  semiBase: Record<string, number>;
  semiColor: Record<string, number>;
  chibiBackground: Record<string, number>;
  semiBackground: Record<string, number>;
  stickerDiscountBase: number;   // discount for a 4-sticker set ...
  stickerDiscountStep: number;   // ... plus this much for every extra sticker
  acrylicExtra: number;
  badgesExtra: number;
  referenceSheetExtra: number;
  modelSheetExtra: number;
  ychDiscount: number;
  alternatesExtra: number;
  extraCharacterFlatChibi: number;  // each extra character costs 80% of the scope total + this
  extraCharacterFlatSemi: number;
};

// Commercial use adds 50% of the base estimated total (no fixed price).
const COMMERCIAL_SURCHARGE_RATE = 0.5;

const PRICE_TABLES: Record<"PHP" | "USD", PriceTable> = {
  // Local clients / meet-ups (pesos).
  PHP: {
    chibiBase: { Headshot: 170, Fullbody: 200 },
    semiBase: { Headshot: 250, "Bust-up": 380, "Waist-up": 520, "Thigh-up": 680 },
    semiColor: { Rendered: 475, Plain: 280 },
    chibiBackground: { Complex: 50, Plain: 0, "None/Transparent": 0 },
    semiBackground: { Complex: 220, Plain: 150, "None/Transparent": 680 },
    stickerDiscountBase: 20,
    stickerDiscountStep: 10,
    acrylicExtra: 50,
    badgesExtra: 30,
    referenceSheetExtra: 30,
    modelSheetExtra: 300,
    ychDiscount: 10,
    alternatesExtra: 30,
    extraCharacterFlatChibi: 35,
    extraCharacterFlatSemi: 50,
  },
  // International clients (US dollars). Set these on their own, independent of
  // the peso list. The values below are starting figures: change them freely.
  USD: {
    chibiBase: { Headshot: 8, Fullbody: 10 },
    semiBase: { Headshot: 15, "Bust-up": 23, "Waist-up": 35, "Thigh-up": 40 },
    semiColor: { Rendered: 15, Plain: 9 },
    chibiBackground: { Complex: 2, Plain: 0, "None/Transparent": 0 },
    semiBackground: { Complex: 7, Plain: 5, "None/Transparent": 21 },
    stickerDiscountBase: 1,
    stickerDiscountStep: 0.5,
    acrylicExtra: 2,
    badgesExtra: 1,
    referenceSheetExtra: 1,
    modelSheetExtra: 8,
    ychDiscount: 0.5,
    alternatesExtra: 3,
    extraCharacterFlatChibi: 3,
    extraCharacterFlatSemi: 2,
  },
};

type PricingInput = {
  artStyle: string; baseOption: string; chibiService: string; stickerCount: number;
  alternativesCount: number; colorOption: string; bgOption: string; characters: number;
  usageType: string; dueDate: string;
};

// Works out the quote from one price list. All amounts come back in that list's
// own currency (PHP list -> pesos, USD list -> dollars).
const calculatePricing = (form: PricingInput, table: PriceTable, decimals: number) => {
  const round = (value: number) => roundToDecimals(value, decimals);
  const isChibi = form.artStyle === "Chibi";
  const isSemi = form.artStyle === "Semi-Realistic";

  const basePrice = isChibi ? (table.chibiBase[form.baseOption] ?? 0)
    : isSemi ? (table.semiBase[form.baseOption] ?? 0)
    : 0;

  const chibiServicePrice = (() => {
    if (!isChibi || !form.chibiService) return 0;
    switch (form.chibiService) {
      case "Solo Deals": return basePrice;
      case "Sticker set": {
        const discount = table.stickerDiscountBase + (form.stickerCount - 4) * table.stickerDiscountStep;
        return round(basePrice * form.stickerCount - discount);
      }
      case "Acrylic Merch": return round(basePrice + table.acrylicExtra);
      case "Badges/Pins/Pfp Design": return round(basePrice + table.badgesExtra);
      case "Character Reference sheet": return round(basePrice * 4 + table.referenceSheetExtra);
      case "2D Model character sheet": return round(basePrice * 5 + table.modelSheetExtra);
      case "YCH": return Math.max(0, round(basePrice - table.ychDiscount));
      case "Alternate outfits/expressions": return round(basePrice * form.alternativesCount + table.alternatesExtra);
      default: return 0;
    }
  })();

  const colorPrice = isSemi ? (table.semiColor[form.colorOption] ?? 0) : 0;
  const bgPrice = isChibi ? (table.chibiBackground[form.bgOption] ?? 0)
    : isSemi ? (table.semiBackground[form.bgOption] ?? 0)
    : 0;

  const scopeAndOptionsTotal = isChibi ? chibiServicePrice + bgPrice : basePrice + colorPrice + bgPrice;

  const charMultiplier = form.characters > 1
    ? (form.characters - 1) * (
        isSemi ? round(scopeAndOptionsTotal * 0.80 + table.extraCharacterFlatSemi)
        : isChibi ? round(scopeAndOptionsTotal * 0.80 + table.extraCharacterFlatChibi)
        : 0
      )
    : 0;

  const subtotal = round(scopeAndOptionsTotal + charMultiplier);
  // Base estimated total x 1.5 when commercial: the fee is 50% of the subtotal.
  const commercialFee = form.usageType === "Commercial Use" ? round(subtotal * COMMERCIAL_SURCHARGE_RATE) : 0;

  let dueDateRate = 0;
  if (form.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((new Date(form.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    dueDateRate = diffDays > 14 ? 0.10 : 0.18;
  }
  const priorityFee = form.dueDate ? round(subtotal * dueDateRate) : 0;
  const total = round(subtotal + commercialFee + priorityFee);

  return { basePrice, chibiServicePrice, colorPrice, bgPrice, charMultiplier, subtotal, commercialFee, dueDateRate, priorityFee, total };
};

// USD -> EUR. EUR is always derived from the independent USD price.
const usdToEur = (usd: number) => roundToDecimals(usd * EUR_PER_USD, 2);

const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(CURRENCIES, value);

const readStoredCurrency = (): CurrencyCode => {
  try {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return isCurrencyCode(stored) ? stored : "PHP";
  } catch {
    return "PHP"; // storage blocked (private mode, etc.)
  }
};

const formatAmount = (amount: number, code: CurrencyCode) => {
  const { symbol, decimals } = CURRENCIES[code];
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(readStoredCurrency);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {
      /* the choice still applies for this visit */
    }
  };

  // Keep other open tabs in step with the choice.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CURRENCY_STORAGE_KEY) setCurrencyState(readStoredCurrency());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<CurrencyContextValue>(() => ({ currency, setCurrency }), [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside <CurrencyProvider>.");
  return context;
};

// Email check used by the commission form (the worker applies the same rules).
// Returns "" when the address is fine, otherwise a message for the client.
const EMAIL_LOCAL_PATTERN = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const EMAIL_LABEL_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const getEmailError = (value: string): string => {
  const email = value.trim();
  if (!email) return "Please enter your email address.";
  if (/\s/.test(email)) return "Email addresses can't contain spaces.";
  const at = email.indexOf("@");
  if (at === -1) return "Your email needs an \"@\" (for example you@example.com).";
  if (at !== email.lastIndexOf("@")) return "Your email can only contain one \"@\".";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local) return "Add the part before the \"@\" (for example you@example.com).";
  if (!domain) return "Add your email domain after the \"@\" (for example you@example.com).";
  if (email.length > 254 || local.length > 64) return "That email address is too long.";
  if (!EMAIL_LOCAL_PATTERN.test(local)) return "The part before the \"@\" has characters or dots that aren't allowed.";
  const labels = domain.split(".");
  if (labels.length < 2 || !labels.every((label) => EMAIL_LABEL_PATTERN.test(label))) {
    return "The domain after the \"@\" doesn't look right (for example example.com).";
  }
  if (!/^[A-Za-z]{2,63}$/.test(labels[labels.length - 1])) return "The domain ending (like .com) doesn't look right.";
  return "";
};

// Admin side: read the price exactly as the client saw it when they submitted.
// Records saved before multi-currency existed have no currency fields and are PHP.
const getRequestPrice = (request: CommissionRequest) => {
  const currency: CurrencyCode = isCurrencyCode(request.currency) ? request.currency : "PHP";
  const amount = request.totalAmount != null && Number.isFinite(Number(request.totalAmount))
    ? Number(request.totalAmount)
    : request.totalPhp;
  const rate = Number(request.exchangeRate) > 0 ? Number(request.exchangeRate) : 1;
  return {
    currency,
    rate,
    original: formatAmount(amount, currency),
    php: formatAmount(request.totalPhp, "PHP"),
    isForeign: currency !== "PHP",
  };
};

// "$25.00 USD ≈ ₱1,450 PHP" (just "₱1,450 PHP" for peso clients)
function RequestPrice({ request }: { request: CommissionRequest }) {
  const price = getRequestPrice(request);
  return (
    <span className="price-pair">
      <strong>{price.original} {price.currency}</strong>
      {price.isForeign && <span className="price-php"> ≈ {price.php} PHP</span>}
    </span>
  );
}

function Navbar({ page, go }: { page: Page; go: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();

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

  const scrollToSection = (sectionId: string) => {
    setOpen(false);
    if (page !== "home") {
      go("home");
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

          <div className="drawer-footer-panel">
            <div className="drawer-currency">
              <span className="drawer-social-label">Currency |</span>
              <label className="currency-picker">
                <span className="sr-only">Currency</span>
                <select
                  className="currency-select"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
                  aria-label="Choose currency"
                >
                  {CURRENCY_CODES.map((code) => (
                    <option key={code} value={code}>{CURRENCIES[code].symbol} {code}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="drawer-footer-socials">
              <span className="drawer-social-label">Contacts |</span>
              <a href="mailto:kyuukyuuji@gmail.com" aria-label="Email">
                <Icon name="mail" size={19} />
              </a>
              <a href="https://www.instagram.com/jeii_ji" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Icon name="instagram" size={19} />
              </a>
              <a href="https://www.facebook.com/christinejoy.morata02/" target="_blank" rel="noreferrer" aria-label="Facebook">
                <Icon name="facebook" size={19} />
              </a>
            </div>
          </div>
        </nav>

        <div className="nav-actions">
          <label className="currency-picker">
            <span className="sr-only">Currency</span>
            <select
              className="currency-select"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              aria-label="Choose currency"
            >
              {CURRENCY_CODES.map((code) => (
                <option key={code} value={code}>{CURRENCIES[code].symbol} {code}</option>
              ))}
            </select>
          </label>
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

function HeroCarousel() {
  const { items: slides } = useApiData<CarouselSlide>("/api/carousel");
  const carouselSlides = useMemo(() => slides.slice(0, 5), [slides]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStart = useRef<number | null>(null);

  const count = carouselSlides.length;

  useEffect(() => {
    setCurrentIndex((prev) => (count === 0 ? 0 : prev % count));
  }, [count]);

  useEffect(() => {
    if (!isPlaying || count <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, count]);

  if (count === 0) {
    return null;
  }

  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + count) % count);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % count);

  return (
    <section className="hero-carousel-section" aria-label="Featured Artworks Carousel">
      <div 
        className="hero-carousel-container"
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStart.current === null || count <= 1) return;
          const dist = e.changedTouches[0].clientX - touchStart.current;
          touchStart.current = null;
          if (Math.abs(dist) > 40) {
            if (dist < 0) nextSlide();
            else prevSlide();
          }
        }}
      >
        {carouselSlides.map((item, idx) => (
          <div
            key={`${item.position}-${item.version ?? 0}`}
            className={`hero-carousel-slide ${idx === currentIndex ? "active" : ""}`}
            aria-hidden={idx !== currentIndex}
          >
            <img src={item.data} alt={item.alt || `Featured artwork ${idx + 1}`} style={frameImageStyle(frameFromSlide(item))} />
          </div>
        ))}

        {count > 1 && (
          <div className="hero-carousel-dots" role="group" aria-label="Slide Selection">
            {carouselSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`hero-carousel-dot ${idx === currentIndex ? "active" : ""}`}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === currentIndex}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="hero-carousel-controls">
          <button 
            type="button" 
            className="hero-control-btn" 
            aria-label="Previous artwork"
            onClick={prevSlide}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button 
            type="button" 
            className="hero-control-btn" 
            aria-label={isPlaying ? "Pause carousel" : "Play carousel"}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <Icon name={isPlaying ? "pause" : "play"} size={16} />
          </button>

          <button 
            type="button" 
            className="hero-control-btn" 
            aria-label="Next artwork"
            onClick={nextSlide}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}

function Home({ go }: { go: (page: Page, selection?: GallerySelection) => void }) {
  const { items: published } = useApiData<PublishedItem>("/api/gallery");
  
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
        <HeroCarousel />

        <section id="about-section" className="about-strip">
          <div className="wrap intro-grid">
            <div className="portrait-card"><ArtVisual art="artist" label="Illustrated portrait of the artist" /><span className="seal">ID<br />Artist</span></div>
            <div className="intro-copy">
              <p className="kicker">About Me</p><h2>Hi, I'm Kyuu. I draw feelings you can keep.</h2>
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

        <section id="home-gallery-section" className="section wrap">
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

const AdminField = ({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) => (
  <label className="field"><span>{label}</span>{hint && <small>{hint}</small>}<span className="input-wrap">{children}</span></label>
);

const Field = ({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) => <label className="field"><span>{label}</span>{hint && <small>{hint}</small>}{children}</label>;

function Commission({ go }: { go: (page: Page) => void }) {
  const { currency } = useCurrency();
  const [step, setStep] = useState(1);
  const [emailTouched, setEmailTouched] = useState(false);

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

  // PHP and USD are priced from their own lists. EUR is the USD price converted.
  const priceTable = currency === "PHP" ? PRICE_TABLES.PHP : PRICE_TABLES.USD;
  const pricing = calculatePricing(form, priceTable, currency === "PHP" ? 0 : 2);
  const { basePrice, chibiServicePrice, colorPrice, bgPrice, charMultiplier, commercialFee, dueDateRate, priorityFee, total } = pricing;
  // Amounts above are in the list's own currency; show them in the chosen one.
  const money = (amount: number) => formatAmount(currency === "EUR" ? usdToEur(amount) : amount, currency);
  const chibiBaseOptions = Object.entries(priceTable.chibiBase);
  const semiBaseOptions = Object.entries(priceTable.semiBase);
  const emailError = getEmailError(form.email);
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
          {form.usageType === "Commercial Use" && <p><span>Commercial license ({Math.round(COMMERCIAL_SURCHARGE_RATE * 100)}%)</span><b>+{money(commercialFee)}</b></p>}
          {form.dueDate && <p><span>Priority due date fee ({dueDateRate === 0.1 ? "10%" : "18%"})</span><b>+{money(priorityFee)}</b></p>}
        </>
      )}
    </>
  );

  const currencyNote = currency === "USD" ? (
    <p className="fine-print currency-note">
      International pricing is set in US dollars. Your total is saved as {money(total)} USD.
    </p>
  ) : currency === "EUR" ? (
    <p className="fine-print currency-note">
      International pricing is set in US dollars ({formatAmount(total, "USD")} USD for this request) and converted to euro at {CURRENCIES.EUR.symbol}1 = ${roundToDecimals(1 / EUR_PER_USD, 4)}. Your total is saved as {money(total)} EUR.
    </p>
  ) : null;

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
      setEmailTouched(true);
      alert("Please fill in your name, email, and usage type.");
      return;
    }
    if (step === 2 && emailError) {
      setEmailTouched(true);
      alert(emailError);
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
    if (emailError) {
      setEmailTouched(true);
      setStep(2);
      alert(emailError);
      return;
    }
    // Foreign requests keep a peso equivalent (reference rate) so the admin list stays comparable.
    const usdTotal = currency === "EUR" ? calculatePricing(form, PRICE_TABLES.USD, 2).total : total;
    const request: CommissionRequest = {
      id: Date.now(),
      name: form.name,
      email: form.email.trim(),
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
      // Lock in exactly what the client saw so the record never shifts later.
      currency,
      totalAmount: currency === "EUR" ? usdToEur(usdTotal) : total,
      exchangeRate: CURRENCIES[currency].phpPerUnit,
      totalPhp: currency === "PHP" ? total : Math.round(usdTotal * PHP_PER_USD_REFERENCE),
      submittedAt: new Date().toISOString(),
      stage: 0,
    };

    try {
      await apiRequest<{ success: boolean }>("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });

      alert("Your commission request is successfully submitted!");
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
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setValue("email", e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="you@example.com"
                    aria-invalid={emailTouched && Boolean(emailError)}
                    aria-describedby={emailTouched && emailError ? "email-error" : undefined}
                  />
                  {emailTouched && emailError && <small id="email-error" className="field-error" role="alert">{emailError}</small>}
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
                      chibiBaseOptions.map(([name, price]) => (
                        <button type="button" className={`choice-card ${form.baseOption === name ? "selected" : ""}`} aria-pressed={form.baseOption === name} onClick={() => setValue("baseOption", name)} key={name} style={{ width: "100%" }}>
                          <span className="radio" /><strong>{name}</strong><b>{money(price)}</b><small>Chibi tier (Rendered by default)</small>
                        </button>
                      ))
                    ) : form.artStyle === "Semi-Realistic" ? (
                      semiBaseOptions.map(([name, price]) => (
                        <button type="button" className={`choice-card ${form.baseOption === name ? "selected" : ""}`} aria-pressed={form.baseOption === name} onClick={() => setValue("baseOption", name)} key={name} style={{ width: "100%" }}>
                          <span className="radio" /><strong>{name}</strong><b>{money(price)}</b><small>Semi-realism tier</small>
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
                <div className="estimate-top"><span>Order Summary · {currency}</span><Icon name="spark" /></div>
                <h2>{money(total)}</h2>
                <div className="estimate-lines">{estimateBreakdown}</div>
                <div className="estimate-total"><span>Estimated total</span><strong>{money(total)}</strong></div>
              {currencyNote}
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
              <div className="estimate-top"><span>Live Estimate · {currency}</span><Icon name="spark" /></div>
              <h2>{money(total)}</h2>
              <div className="estimate-lines">{estimateBreakdown}</div>
              <div className="estimate-total"><span>Estimated total</span><strong>{money(total)}</strong></div>
              {currencyNote}
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
          <div className="estimate-top"><span>Live Estimate · {currency}</span><Icon name="spark" /></div>
          <h2>{money(total)}</h2>
          <div className="estimate-lines">{estimateBreakdown}</div>
          <div className="estimate-total"><span>Estimated total</span><strong>{money(total)}</strong></div>
              {currencyNote}
          <p className="fine-print">GCASH is the accepted payment platform. Final confirmation is sent after admin review.</p>
        </aside>}
      </div>
    </main>
  );
}

const POLICY_SECTIONS = [
  { id: "policy-rules", numeral: "I", title: "Rules & Regulations" },
  { id: "policy-copyrights", numeral: "II", title: "Copyrights" },
  { id: "policy-contract", numeral: "III", title: "Contract & Workflow Terms" },
  { id: "policy-communication", numeral: "IV", title: "Communication & Client Responsiveness" },
  { id: "policy-files", numeral: "V", title: "File Storage & Delivery Maintenance" },
];

function Guide({ go }: { go: (page: Page) => void }) {
  const [activeSection, setActiveSection] = useState(POLICY_SECTIONS[0].id);
  const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const update = () => {
      let current = POLICY_SECTIONS[0].id;
      for (const section of POLICY_SECTIONS) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= 160) current = section.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = POLICY_SECTIONS[POLICY_SECTIONS.length - 1].id;
      setActiveSection(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" });
    setActiveSection(id);
  };

  return (
    <main id="main-content" tabIndex={-1} className="page-main guide-page">
      <header className="policy-hero">
        <div className="wrap policy-hero-inner">
          <nav className="policy-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => go("home")}>Home</button>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Terms & Conditions</span>
          </nav>
          <p className="kicker">Kyuu commission guide</p>
          <h1>Commission Terms & Guidelines</h1>
          <p className="policy-lede">Please review the complete terms below before securing a commission slot.</p>
        </div>
      </header>

      <div className="wrap policy-layout">
        <aside className="policy-toc">
          <nav aria-label="On this page">
            <p className="policy-toc-title">On this page</p>
            <ol>
              {POLICY_SECTIONS.map((section) => (
                <li key={section.id}>
                  <button type="button" aria-current={activeSection === section.id ? "true" : undefined} onClick={() => jumpTo(section.id)}>
                    <span>{section.numeral}.</span><span>{section.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="policy-content">
          <article id="policy-rules" className="policy-section" aria-labelledby="policy-rules-heading">
            <header className="policy-section-head"><span className="policy-index" aria-hidden="true">I</span><h2 id="policy-rules-heading">Rules & Regulations</h2></header>
            <div className="policy-section-body">
              <section className="policy-clause">
                <h3>A. NSFW Contents</h3>
                <div className="policy-clause-body">
                  <p><strong>Not Safe For Work content is NOT allowed,</strong> may the project be in PUBLIC or in PRIVATE. Any commission request that is judged to be NSFW or suggestive will not be accepted and will be rejected immediately.</p>
                  <p>The following will automatically be tagged as NSFW: <em>pornography, nudity, heavy gore, depiction of bodily fluids (e.g., semen), violence, suggestive content, controversial content.</em></p>
                </div>
              </section>
              <section className="policy-clause">
                <h3>B. Themes</h3>
                <div className="policy-clause-body">
                  <table className="policy-table policy-theme-table">
                    <thead><tr><th scope="col">Will Draw:</th><th scope="col">Won't Draw:</th></tr></thead>
                    <tbody><tr>
                      <td data-label="Will Draw:"><ul className="policy-theme-list"><li>OC</li><li>Fictional Characters</li><li>Character Ships</li><li>Nonsexual Nudity</li></ul></td>
                      <td data-label="Won't Draw:"><ul className="policy-theme-list"><li>NSFW</li><li>Real People without their consent</li><li>Changing a canon character's design (e.g., race, major features)</li><li>Mecha, Cars, etc.</li></ul></td>
                    </tr></tbody>
                  </table>
                </div>
              </section>
            </div>
          </article>

          <article id="policy-copyrights" className="policy-section" aria-labelledby="policy-copyrights-heading">
            <header className="policy-section-head"><span className="policy-index" aria-hidden="true">II</span><h2 id="policy-copyrights-heading">Copyrights</h2></header>
            <div className="policy-section-body">
              <section className="policy-clause">
                <h3>A. Artist Rights</h3>
                <div className="policy-clause-body">
                  <p><strong>Pursuant to Republic Act No. 8293 (The Intellectual Property Code of the Philippines), the copyright of the artwork inherently and permanently belongs to the artist.</strong> The artist retains all rights regarding the reproduction, distribution, and public display of the artwork for promotional, portfolio, and social media purposes.</p>
                </div>
              </section>
              <section className="policy-clause">
                <h3>B. Client Rights</h3>
                <div className="policy-clause-body">
                  <p>Upon final payment, the client is granted a license to use the artwork for expected purposes. The artist must be clearly and visibly credited whenever the artwork is used or displayed publicly. The client may not alter, edit, or claim the artwork as their own creation.</p>
                </div>
              </section>
              <section className="policy-clause">
                <h3>C. AI & Blockchain Prohibitions</h3>
                <div className="policy-clause-body">
                  <p>Under no circumstances is the artwork permitted for use in Artificial Intelligence (AI) training databases, machine learning datasets, or any blockchain/NFT platforms. Any such utilization constitutes a direct violation of these terms and copyright law.</p>
                </div>
              </section>
              <section className="policy-clause">
                <h3>D. Transfer of Ownership</h3>
                <div className="policy-clause-body">
                  <p>Full copyright ownership remains with the artist unless a separate, formal agreement is signed/explicitly said by both parties to assign the copyright to the client or an organization. Copyright buyout fees will apply for such transfers.</p>
                </div>
              </section>
            </div>
          </article>

          <article id="policy-contract" className="policy-section" aria-labelledby="policy-contract-heading">
            <header className="policy-section-head"><span className="policy-index" aria-hidden="true">III</span><h2 id="policy-contract-heading">Contract & Workflow Terms</h2></header>
            <div className="policy-section-body">
              <p className="policy-intro">By securing a commission slot, both the artist and the client agree to the following parameters regarding the execution, payment, and legal boundaries of the commission.</p>
              <section className="policy-clause">
                <h3>A. Revisions</h3>
                <div className="policy-clause-body">
                  <p>Once the final artwork is finished and presented for final approval, any requests for major modifications or revisions will incur mandatory additional charges depending on the weight of the adjustment. Work on these final alterations will only commence after the client has paid the required revision fee.</p>
                </div>
              </section>
              <section className="policy-clause">
                <h3>B. Deadlines</h3>
                <div className="policy-clause-body">
                  <p>Clients requiring an expected delivery can opt to designate their commission as a PRIORITY. Priority pieces are fast-tracked ahead of the standard production queue to ensure significantly quicker completion, which will incur an additional charge equivalent to 10% of the project's total price.</p>
                </div>
              </section>
              <section className="policy-clause">
                <h3>C. Payment Terms</h3>
                <div className="policy-clause-body">
                  <p>To ensure a secure and collaborative workflow, payments are broken down into milestone installations. No upfront cost is required to begin the initial drafting phase, but progress is strictly tied to the following payment schedule:</p>
                <table className="policy-table">
                  <thead><tr><th scope="col">Milestone</th><th scope="col">Payment schedule</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Initial Phase</th><td data-label="Payment schedule">The project will be initiated and developed up to the midpoint milestone without an upfront cost.</td></tr>
                    <tr><th scope="row">Mid-Project Downpayment</th><td data-label="Payment schedule">Upon reaching the midpoint milestone (the finalization of the approved sketch), a mandatory 20% downpayment of the total project fee will be requested.</td></tr>
                    <tr><th scope="row">Final Settlement</th><td data-label="Payment schedule">The remaining balance must be paid in full within three (3) calendar days after the artwork is finished and presented. High-resolution—without any obstructive watermark—final deliverables will only be released once the full payment has cleared.</td></tr>
                  </tbody>
                </table>
                </div>
              </section>
              <section className="policy-clause">
                <h3>D. Cancellation & Refund Policy</h3>
                <div className="policy-clause-body">
                  <p>Clients may change their minds or cancel the project within a specific window. However, because time and labor are invested into the project as it progresses, the refund policy changes depending on when the cancellation is requested:</p>
                <ul>
                  <li>Standard Grace Period: The client is entitled to a 100% full cancellation and refund within one (1) week (7 days) of the initial project booking.</li>
                  <li>Mid-Project & Mid-Production: If no cancellation is requested within the first week, production automatically proceeds. If the client persists in canceling the project after the 1-week grace period has passed, the project will enter immediate termination. In this event, the client will only be refunded 12% of their total downpayment amount, and they will be given the latest work-in-progress export of the drawing as-is.</li>
                </ul>
                </div>
              </section>
              <section className="policy-clause">
                <h3>E. Termination Policy</h3>
                <div className="policy-clause-body">
                  <p>The artist reserves the right to suspend work or permanently terminate the contract if the client breaches communication or payment deadlines. Forfeiting a slot due to non-payment will result in the cancellation of the project.</p>
                <ul>
                  <li>Failure to Provide Downpayment: If the client refuses or fails to settle the 20% mid-project downpayment within one (1) week (7 days) of the initial payment request, production will be immediately halted, the commission will be terminated, and the slot will be forfeited.</li>
                  <li>Failure to Settle Final Balance: Failure to pay the remaining balance within the designated 3-day post-completion window will result in the immediate withholding of the final artwork, termination of future services, and potential blacklisting from subsequent commission openings.</li>
                </ul>
                </div>
              </section>
            </div>
          </article>

          <article id="policy-communication" className="policy-section" aria-labelledby="policy-communication-heading">
            <header className="policy-section-head"><span className="policy-index" aria-hidden="true">IV</span><h2 id="policy-communication-heading">Communication & Client Responsiveness</h2></header>
            <div className="policy-section-body">
              <section className="policy-clause">
                <h3>A. Response Window</h3>
                <div className="policy-clause-body">
                  <p>Clients are expected to respond to milestone updates, feedback requests, or approvals within three (3) calendar days.</p>
                </div>
              </section>
              <section className="policy-clause">
                <h3>B. Inactivity Closure</h3>
                <div className="policy-clause-body">
                  <p>If a client fails to communicate or respond for more than fourteen (14) consecutive days without prior notice, the project will be considered abandoned. The contract will be terminated, the 20% downpayment (if paid) will be forfeited as a cancellation fee, and the slot will be reopened to the public.</p>
                </div>
              </section>
              <section className="policy-clause">
                <h3>C. Force Majeure</h3>
                <div className="policy-clause-body">
                  <p>The artist is not held liable for delays caused by emergency situations, illness, power outages, natural disasters, or technical failures. In the event of such a delay, the client will be notified immediately, and a revised timeline will be established.</p>
                <p>If an operational delay occurs and the artist fails to respond to client inquiries or provide milestone updates for more than fourteen (14) consecutive days without prior notice, the client is granted the right to choose one of the following options:</p>
                <ul>
                  <li><strong>Immediate Project Cancellation:</strong> The client may cancel the contract and receive a 12% refund of the settled downpayment, along with the latest work-in-progress export of the artwork as-is.</li>
                  <li><strong>Timeline Extension:</strong> The client may choose to maintain the commission slot under a newly negotiated, mutually agreed-upon delivery deadline.</li>
                </ul>
                </div>
              </section>
            </div>
          </article>

          <article id="policy-files" className="policy-section" aria-labelledby="policy-files-heading">
            <header className="policy-section-head"><span className="policy-index" aria-hidden="true">V</span><h2 id="policy-files-heading">File Storage & Delivery Maintenance</h2></header>
            <div className="policy-section-body">
              <section className="policy-clause policy-clause-plain">
                <div className="policy-clause-body">
                  <p>Final high-resolution files will be hosted on a cloud drive (e.g., Google Drive) and guaranteed to be accessible for six (6) months following final delivery. Clients are strongly advised to download and back up their files immediately upon receipt.</p>
                  <p>If a client loses their files or requires a new download link after the 6-month hosting period has expired, they may reach out to the artist directly. While the artist will make every effort to retrieve the artwork from their personal archives, recovery is not guaranteed if the data has been permanently cleared or archived.</p>
                </div>
              </section>
            </div>
          </article>

          <section className="policy-cta" aria-labelledby="policy-cta-heading">
            <div>
              <h2 id="policy-cta-heading">Ready to book a slot?</h2>
              <p>By submitting a commission request you confirm that you have read and agree to these terms.</p>
            </div>
            <div className="policy-cta-actions">
              <Btn onClick={() => go("commission")}>Request a commission</Btn>
              <Btn kind="outline" onClick={() => window.scrollTo({ top: 0, behavior: calm() ? "auto" : "smooth" })}>Back to top</Btn>
            </div>
          </section>
        </div>
      </div>
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
const MAX_SET_IMAGES = 5;

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
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    data = canvas.toDataURL("image/jpeg", quality);
  }
  return data;
};

const makeThumb = (dataUrl: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(encodeImage(img, 640, 0.62) || dataUrl);
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

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
    <button key={`${kind}:${value}`} type="button" className={`filter-pill ${isOn(kind, value) ? "on" : ""}`} aria-pressed={isOn(kind, value)} onClick={() => onToggleTag({ kind, value })}>
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
        <button type="button" className={`filter-pill-btn ${drawer === "scope" ? "open" : ""}`} aria-expanded={drawer === "scope"} aria-controls="filter-drawer" onClick={() => toggleDrawer("scope")}>
          Scope <span aria-hidden="true">{drawer === "scope" ? "▴" : "▾"}</span>
        </button>
        <button type="button" className={`filter-pill-btn ${drawer === "service" ? "open" : ""}`} aria-expanded={drawer === "service"} aria-controls="filter-drawer" onClick={() => toggleDrawer("service")}>
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
          <span className="filter-tag" key={`${tag.kind}:${tag.value}`}>
            <small>{KIND_LABEL[tag.kind]}</small> {tag.value}
            <button type="button" aria-label={`Remove ${tag.value} filter`} onClick={() => onToggleTag(tag)}><Icon name="close" size={12} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ImageSetBoard({
  images,
  previewIndex,
  onPreview,
  onAdd,
  onReplace,
  onRemove,
  onMove,
  onReorder,
  processing,
  loadingSet,
  progress,
  overBudget,
  setSize,
  coverLabel = "Cover",
  addLabel,
  variant = "gallery",
  frames,
  onFrameChange,
  devicePreview = "pc",
  onDevicePreviewChange,
}: {
  images: string[];
  previewIndex: number;
  onPreview: (index: number) => void;
  onAdd: (files: File[]) => void;
  onReplace: (file: File) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, delta: number) => void;
  onReorder: (from: number, to: number) => void;
  processing: boolean;
  loadingSet: boolean;
  progress: string;
  overBudget: boolean;
  setSize: number;
  coverLabel?: string;
  addLabel: string;
  variant?: "gallery" | "carousel";
  frames?: SlideFrame[];
  onFrameChange?: (index: number, frame: SlideFrame) => void;
  devicePreview?: "pc" | "mobile";
  onDevicePreviewChange?: (mode: "pc" | "mobile") => void;
}) {
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const atMax = images.length >= MAX_SET_IMAGES;
  const atMin = images.length <= 1;
  const previewSrc = images[previewIndex];
  const busy = processing || loadingSet;
  const isCarousel = variant === "carousel";
  const framed = isCarousel && Boolean(frames) && Boolean(onFrameChange);
  const activeFrame = frames?.[previewIndex] ?? DEFAULT_FRAME;
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Click or drag on the preview to place the focal point.
  const placeFocus = (event: ReactPointerEvent<HTMLDivElement>) => {
    const box = stageRef.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height || !onFrameChange) return;
    onFrameChange(previewIndex, {
      ...activeFrame,
      x: Math.round(clampNumber(((event.clientX - box.left) / box.width) * 100, 0, 100, 50)),
      y: Math.round(clampNumber(((event.clientY - box.top) / box.height) * 100, 0, 100, 50)),
    });
  };

  return (
    <div className={`publish-preview${isCarousel ? " set-board-carousel" : ""}`}>
      {isCarousel && (
        <div className="carousel-device-toolbar">
          <div className="carousel-device-indicators">
            <button
              type="button"
              className={`device-tab ${devicePreview === "pc" ? "active" : ""}`}
              onClick={() => onDevicePreviewChange?.("pc")}
            >
              <Icon name="grid" size={14} /> PC View (16:7)
            </button>
            <button
              type="button"
              className={`device-tab ${devicePreview === "mobile" ? "active" : ""}`}
              onClick={() => onDevicePreviewChange?.("mobile")}
            >
              <Icon name="user" size={14} /> Mobile View (Portrait)
            </button>
          </div>
          <span className="device-badge">
            {devicePreview === "pc" ? "Desktop View Active" : "Mobile View Indicator Active"}
          </span>
        </div>
      )}

      {framed && previewSrc ? (
        <div
          ref={stageRef}
          className={`set-frame-stage ${isCarousel && devicePreview === "mobile" ? "mobile-preview-stage" : ""}`}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); placeFocus(event); }}
          onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) placeFocus(event); }}
          onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
        >
          <img src={previewSrc} alt="Upload preview" draggable={false} style={frameImageStyle(activeFrame)} />
          <span className="set-focus-marker" style={{ left: `${activeFrame.x}%`, top: `${activeFrame.y}%` }} aria-hidden="true" />
        </div>
      ) : (
        <img src={previewSrc || placeholder} alt="Upload preview" />
      )}
      {isCarousel && previewSrc && (
        <p className="set-preview-caption">
          Slide {previewIndex + 1} of {images.length}. Framed like the home hero ({devicePreview === "pc" ? "Desktop 16:7" : "Mobile 9:16 Portrait"}).
        </p>
      )}

      {images.length > 0 && (
        <>
          <ul className="set-thumbs" aria-label="Images in this set">
            {images.map((src, index) => (
              <li
                key={`${index}-${src.slice(-24)}`}
                draggable={!busy}
                className={`${dragOver === index ? "drag-over" : ""} ${dragFrom.current === index ? "dragging" : ""}`}
                onDragStart={(event) => {
                  dragFrom.current = index;
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index));
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOver(index);
                }}
                onDragLeave={() => setDragOver((current) => (current === index ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  const from = dragFrom.current;
                  dragFrom.current = null;
                  setDragOver(null);
                  if (from == null || from === index) return;
                  onReorder(from, index);
                }}
                onDragEnd={() => {
                  dragFrom.current = null;
                  setDragOver(null);
                }}
              >
                <button
                  type="button"
                  className={`set-thumb ${index === previewIndex ? "on" : ""}`}
                  aria-pressed={index === previewIndex}
                  aria-label={`Show image ${index + 1}${index === 0 ? ` (${coverLabel})` : ""}`}
                  onClick={() => onPreview(index)}
                >
                  <img src={src} alt="" style={framed ? frameImageStyle(frames?.[index] ?? DEFAULT_FRAME) : undefined} />
                  {isCarousel ? <b>{index === 0 ? `1 · ${coverLabel}` : index + 1}</b> : index === 0 && <b>{coverLabel}</b>}
                </button>
              </li>
            ))}
            {isCarousel && Array.from({ length: Math.max(0, MAX_SET_IMAGES - images.length) }, (_, slot) => (
              <li key={`empty-${slot}`} className="set-slot-empty" aria-hidden="true">
                <span className="set-thumb empty">{images.length + slot + 1}</span>
              </li>
            ))}
          </ul>
          <div className="set-actions">
            <button type="button" aria-label="Move image earlier" disabled={busy || previewIndex === 0} onClick={() => onMove(previewIndex, -1)}>←</button>
            <button type="button" aria-label="Move image later" disabled={busy || previewIndex >= images.length - 1} onClick={() => onMove(previewIndex, 1)}>→</button>
            <label className={`set-file-btn ${busy ? "busy" : ""}`}>
              Replace
              <input
                type="file"
                accept="image/*"
                disabled={busy || !images.length}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) onReplace(file);
                }}
              />
            </label>
            <button type="button" className="danger" disabled={busy || atMin} onClick={() => onRemove(previewIndex)}>
              <Icon name="trash" size={14} /> Remove
            </button>
          </div>
          <div className="set-meter" aria-hidden="true"><i className={overBudget ? "over" : ""} style={{ width: `${Math.min(100, Math.round((setSize / MAX_ENTRY_BYTES) * 100))}%` }} /></div>
          <small className={`set-size ${overBudget ? "over" : ""}`}>
            {images.length} of {MAX_SET_IMAGES} {images.length === 1 ? "photo" : "photos"} · {formatMB(setSize)} of {ENTRY_LIMIT_LABEL}
          </small>
        </>
      )}

      <label className={`publish-replace ${busy || atMax ? "busy" : ""}`}>
        <Icon name="plus" /> {addLabel}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy || atMax}
          onChange={(e) => {
            const input = e.target;
            const picked = Array.from(input.files || []);
            input.value = "";
            onAdd(picked);
          }}
        />
      </label>
    </div>
  );
}

function CarouselManager() {
  const [slides, setSlides] = useState<string[]>([]);
  const [alts, setAlts] = useState<string[]>([]);
  const [frames, setFrames] = useState<SlideFrame[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [devicePreview, setDevicePreview] = useState<"pc" | "mobile">("pc");

  const loadSlides = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<CarouselSlide[]>("/api/carousel");
      if (!Array.isArray(data)) throw new Error("The server returned invalid carousel data.");
      const next = data.slice(0, MAX_SET_IMAGES);
      setSlides(next.map((slide) => slide.data).filter(Boolean));
      setAlts(next.map((slide) => slide.alt || ""));
      setFrames(next.map((slide) => frameFromSlide(slide)));
      setPreviewIndex(0);
      setDirty(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSlides();
  }, []);

  const setOrder = (next: string[], nextAlts: string[], focus: number, nextFrames: SlideFrame[] = frames) => {
    setSlides(next);
    setAlts(nextAlts);
    setFrames(next.map((_, position) => nextFrames[position] ?? DEFAULT_FRAME));
    setPreviewIndex(Math.max(0, Math.min(focus, next.length - 1)));
    setDirty(true);
  };

  const processFiles = async (files: File[], mode: "add" | "replace") => {
    const picked = files.filter((file) => file.type.startsWith("image/"));
    if (!picked.length) {
      setError("Please choose image files.");
      return;
    }
    setError("");
    setProcessing(true);
    try {
      if (mode === "replace") {
        setProgress("Processing replacement…");
        const data = await compressImage(picked[0]);
        const next = [...slides];
        next[previewIndex] = data;
        const nextFrames = [...frames];
        nextFrames[previewIndex] = DEFAULT_FRAME;
        setOrder(next, alts, previewIndex, nextFrames);
        return;
      }
      const room = MAX_SET_IMAGES - slides.length;
      if (room <= 0) {
        setError(`The featured carousel can have at most ${MAX_SET_IMAGES} photos.`);
        return;
      }
      const added: string[] = [];
      for (let index = 0; index < Math.min(picked.length, room); index++) {
        setProgress(`Processing ${index + 1} of ${Math.min(picked.length, room)}…`);
        added.push(await compressImage(picked[index]));
      }
      if (picked.length > room) {
        setError(`Kept the first ${room} photo${room === 1 ? "" : "s"}. A carousel set can have at most ${MAX_SET_IMAGES}.`);
      }
      setOrder([...slides, ...added], [...alts, ...added.map(() => "")], slides.length, [...frames, ...added.map(() => DEFAULT_FRAME)]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : String(uploadError));
    } finally {
      setProgress("");
      setProcessing(false);
    }
  };

  const removeAt = (index: number) => {
    if (slides.length <= 1) {
      setError("Keep at least one photo in the carousel.");
      return;
    }
    setOrder(slides.filter((_, position) => position !== index), alts.filter((_, position) => position !== index), index, frames.filter((_, position) => position !== index));
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    const nextAlts = [...alts];
    [next[index], next[target]] = [next[target], next[index]];
    [nextAlts[index], nextAlts[target]] = [nextAlts[target], nextAlts[index]];
    const nextFrames = [...frames];
    [nextFrames[index], nextFrames[target]] = [nextFrames[target], nextFrames[index]];
    setOrder(next, nextAlts, target, nextFrames);
  };

  const reorder = (from: number, to: number) => {
    const next = [...slides];
    const nextAlts = [...alts];
    const [moved] = next.splice(from, 1);
    const [movedAlt] = nextAlts.splice(from, 1);
    const nextFrames = [...frames];
    const [movedFrame] = nextFrames.splice(from, 1);
    next.splice(to, 0, moved);
    nextAlts.splice(to, 0, movedAlt);
    nextFrames.splice(to, 0, movedFrame);
    setOrder(next, nextAlts, to, nextFrames);
  };

  const updateFrame = (index: number, frame: SlideFrame) => {
    setFrames((current) => {
      const next = slides.map((_, position) => current[position] ?? DEFAULT_FRAME);
      next[index] = {
        x: clampNumber(frame.x, 0, 100, DEFAULT_FRAME.x),
        y: clampNumber(frame.y, 0, 100, DEFAULT_FRAME.y),
        zoom: clampNumber(frame.zoom, MIN_ZOOM, MAX_ZOOM, DEFAULT_FRAME.zoom),
      };
      return next;
    });
    setDirty(true);
  };

  const setSize = slides.reduce((total, src) => total + dataUrlBytes(src), 0);
  const overBudget = setSize > MAX_ENTRY_BYTES;

  const save = async () => {
    if (slides.length < 1 || slides.length > MAX_SET_IMAGES) {
      setError(`The featured carousel needs between 1 and ${MAX_SET_IMAGES} photos.`);
      return;
    }
    if (overBudget) {
      setError(`These images total ${formatMB(setSize)}, over the ${ENTRY_LIMIT_LABEL} limit.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiRequest<{ success: boolean }>("/api/carousel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: slides.map((data, index) => {
            const frame = frames[index] ?? DEFAULT_FRAME;
            return { data, alt: alts[index] || `Featured artwork ${index + 1}`, focusX: frame.x, focusY: frame.y, zoom: frame.zoom };
          }),
        }),
      });
      setDirty(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  };

  const addLabel = processing
    ? progress || "Processing…"
    : loading
      ? "Loading slides…"
      : slides.length >= MAX_SET_IMAGES
        ? "Maximum of 5 photos"
        : slides.length ? "Add carousel photo" : "Choose carousel photos";

  return (
    <div className="carousel-manager">
      <div className="panel-head">
        <div>
          <p>FEATURED HERO</p>
          <h2>Carousel images</h2>
        </div>
        <button type="button" className="admin-plus" disabled={saving || processing || loading || !dirty} onClick={() => void save()}>
          {saving ? "Saving…" : "Save carousel"}
        </button>
      </div>
      <p className="carousel-manager-copy">These photos appear on the home hero. They are managed separately from the gallery feed (1 to 5 photos). Drag a thumbnail to reorder.</p>
      {loading && <p className="empty-row">Loading carousel from D1…</p>}
      {error && <p className="empty-row" role="alert">{error}</p>}
      {!loading && (
        <>
          <ImageSetBoard
            images={slides}
            previewIndex={previewIndex}
            onPreview={setPreviewIndex}
            onAdd={(files) => void processFiles(files, "add")}
            onReplace={(file) => void processFiles([file], "replace")}
            onRemove={removeAt}
            onMove={move}
            onReorder={reorder}
            processing={processing}
            loadingSet={loading}
            progress={progress}
            overBudget={overBudget}
            setSize={setSize}
            coverLabel="First"
            addLabel={addLabel}
            variant="carousel"
            frames={frames}
            onFrameChange={updateFrame}
            devicePreview={devicePreview}
            onDevicePreviewChange={setDevicePreview}
          />
          {slides.length > 0 && (
            <fieldset className="carousel-frame-controls">
              <legend>Framing for slide {previewIndex + 1}</legend>
              <p>Click or drag on the preview to choose the focus point, or fine-tune below. The home hero uses exactly this framing.</p>
              <label>
                <span>Horizontal focus <b>{Math.round((frames[previewIndex] ?? DEFAULT_FRAME).x)}%</b></span>
                <input type="range" min={0} max={100} step={1} value={(frames[previewIndex] ?? DEFAULT_FRAME).x}
                  onChange={(event) => updateFrame(previewIndex, { ...(frames[previewIndex] ?? DEFAULT_FRAME), x: Number(event.target.value) })} />
              </label>
              <label>
                <span>Vertical focus <b>{Math.round((frames[previewIndex] ?? DEFAULT_FRAME).y)}%</b></span>
                <input type="range" min={0} max={100} step={1} value={(frames[previewIndex] ?? DEFAULT_FRAME).y}
                  onChange={(event) => updateFrame(previewIndex, { ...(frames[previewIndex] ?? DEFAULT_FRAME), y: Number(event.target.value) })} />
              </label>
              <label>
                <span>Zoom <b>{(frames[previewIndex] ?? DEFAULT_FRAME).zoom.toFixed(2)}×</b></span>
                <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.05} value={(frames[previewIndex] ?? DEFAULT_FRAME).zoom}
                  onChange={(event) => updateFrame(previewIndex, { ...(frames[previewIndex] ?? DEFAULT_FRAME), zoom: Number(event.target.value) })} />
              </label>
              <button type="button" className="carousel-frame-reset" onClick={() => updateFrame(previewIndex, DEFAULT_FRAME)}>Reset framing</button>
            </fieldset>
          )}
          {slides.length > 0 && (
            <label className="carousel-alt-field">
              Alt text for this slide
              <input
                value={alts[previewIndex] || ""}
                onChange={(event) => {
                  const next = [...alts];
                  next[previewIndex] = event.target.value;
                  setAlts(next);
                  setDirty(true);
                }}
                placeholder={`Featured artwork ${previewIndex + 1}`}
              />
            </label>
          )}
        </>
      )}
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
  const [loadingSet, setLoadingSet] = useState(false);
  const [lockSave, setLockSave] = useState(false);
  const editRequest = useRef(0);

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

  const changeArtStyleFilter = (value: string) => { setArtStyleFilter(value); setTags([]); };
  const toggleTag = (tag: ActiveTag) => setTags((current) =>
    current.some((existing) => existing.kind === tag.kind && existing.value === tag.value)
      ? current.filter((existing) => !(existing.kind === tag.kind && existing.value === tag.value))
      : [...current, tag]
  );

  const addImages = async (picked: File[]) => {
    const files = picked.filter((file) => file.type.startsWith("image/"));
    if (!files.length) {
      setFormError("Please choose image files.");
      return;
    }
    const room = MAX_SET_IMAGES - draft.images.length;
    if (room <= 0) {
      setFormError(`Each artwork set can have at most ${MAX_SET_IMAGES} photos.`);
      return;
    }
    setFormError("");
    setProcessing(true);
    let running = draft.images.reduce((total, src) => total + dataUrlBytes(src), 0);
    const added: string[] = [];
    const problems: string[] = [];
    let leftOut = 0;
    const usable = files.slice(0, room);
    try {
      for (let index = 0; index < usable.length; index++) {
        setProgress(`Processing ${index + 1} of ${usable.length}…`);
        let data: string;
        try {
          data = await compressImage(usable[index]);
        } catch (uploadError) {
          problems.push(uploadError instanceof Error ? uploadError.message : String(uploadError));
          continue;
        }
        const bytes = dataUrlBytes(data);
        if (running + bytes > MAX_ENTRY_BYTES) {
          leftOut = usable.length - index;
          break;
        }
        running += bytes;
        added.push(data);
      }
      if (files.length > room) problems.push(`Each set can have at most ${MAX_SET_IMAGES} photos. Extra files were skipped.`);
      if (added.length) setDraft((prev) => ({ ...prev, images: [...prev.images, ...added] }));
      if (leftOut) problems.push(`Added ${added.length} of ${usable.length} images. The other ${leftOut} would go over the ${ENTRY_LIMIT_LABEL} limit for one entry.`);
      if (problems.length) setFormError(problems.join(" "));
    } finally {
      setProgress("");
      setProcessing(false);
    }
  };

  const replaceImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError("Please choose an image file.");
      return;
    }
    setFormError("");
    setProcessing(true);
    setProgress("Processing replacement…");
    try {
      const data = await compressImage(file);
      setDraft((prev) => {
        const next = [...prev.images];
        next[previewIndex] = data;
        return { ...prev, images: next };
      });
    } catch (uploadError) {
      setFormError(uploadError instanceof Error ? uploadError.message : String(uploadError));
    } finally {
      setProgress("");
      setProcessing(false);
    }
  };

  const removeImage = (index: number) => {
    if (draft.images.length <= 1) {
      setFormError("Keep at least one photo in the set.");
      return;
    }
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

  const reorderImages = (from: number, to: number) => {
    setDraft((prev) => {
      const next = [...prev.images];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...prev, images: next };
    });
    setPreviewIndex(to);
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
      images: [],
      tools: item.tools || "", format: item.format || "",
      publishedDate: toInputDate(item.publishedAt)
    });
    setPreviewIndex(0);
    setFormError("");
    setEditingId(item.id);
    setOpen(true);

    const token = ++editRequest.current;
    setLockSave(true);
    setLoadingSet(true);
    apiRequest<{ images: string[] }>(`/api/gallery/${item.id}/images`)
      .then((data) => {
        if (token !== editRequest.current) return;
        if (!Array.isArray(data.images) || !data.images.length) throw new Error("the server returned no images");
        setDraft((prev) => ({ ...prev, images: data.images.filter((image) => image && image !== placeholder).slice(0, MAX_SET_IMAGES) }));
        setLockSave(false);
      })
      .catch((loadError) => {
        if (token !== editRequest.current) return;
        setLockSave(true);
        setFormError(`Couldn’t load this set’s images (${loadError instanceof Error ? loadError.message : String(loadError)}). Close the editor and try again so nothing gets lost.`);
      })
      .finally(() => {
        if (token === editRequest.current) setLoadingSet(false);
      });
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

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingSet || lockSave) return;
    setFormError("");

    if (!draft.images.length) { setFormError("Add at least one photo to publish."); return; }
    if (draft.images.length > MAX_SET_IMAGES) {
      setFormError(`Each artwork set can have at most ${MAX_SET_IMAGES} photos.`);
      return;
    }
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
      category: style === "Chibi" ? `Chibi (${service})` : style,
      image: draft.images[0],
      images: draft.images,
      tools: draft.tools, format: draft.format,
      publishedAt
    };

    try {
      const thumb = await makeThumb(draft.images[0]);
      await apiRequest<{ success: boolean }>(editingId !== null ? `/api/gallery/${editingId}` : "/api/gallery", {
        method: editingId !== null ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, thumb, imageCount: draft.images.length })
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

  const replaceLabel = processing
    ? progress || "Processing…"
    : loadingSet
      ? "Loading images…"
      : draft.images.length >= MAX_SET_IMAGES
        ? "Maximum of 5 photos"
        : draft.images.length ? "Add more photos" : "Choose photos";

  return (
    <div className="admin-panel media-manager">
      <CarouselManager />
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

            <ImageSetBoard
              images={draft.images}
              previewIndex={previewIndex}
              onPreview={setPreviewIndex}
              onAdd={(files) => void addImages(files)}
              onReplace={(file) => void replaceImage(file)}
              onRemove={removeImage}
              onMove={moveImage}
              onReorder={reorderImages}
              processing={processing}
              loadingSet={loadingSet}
              progress={progress}
              overBudget={overBudget}
              setSize={setSize}
              addLabel={replaceLabel}
            />

            <div className="publish-fields">
              <p className="kicker">{editingId !== null ? "Editing" : "New"} gallery artwork</p>
              <h2>{editingId !== null ? "Edit details" : "Publish something new"}</h2>

              <AdminField label="Title">
                <input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Item title" />
              </AdminField>

              <AdminField label="Description">
                <textarea required rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Write a brief description..." />
              </AdminField>

              <AdminField label="Art Style">
                <select value={draft.artStyle} onChange={(e) => changeDraftStyle(e.target.value)}>
                  {ART_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
                </select>
              </AdminField>

              {draft.artStyle && (
                <AdminField label="Scope">
                  <select value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })}>
                    {SCOPES_BY_STYLE[draft.artStyle].map((scope) => <option key={scope} value={scope}>{scope}</option>)}
                  </select>
                </AdminField>
              )}

              {draft.artStyle === "Chibi" && (
                <AdminField label="Service">
                  <select value={draft.subCategory} onChange={(e) => setDraft({ ...draft, subCategory: e.target.value })}>
                    {CHIBI_SERVICES.map((service) => <option key={service} value={service}>{service === "YCH" ? "YCH (Your Character Here)" : service}</option>)}
                  </select>
                </AdminField>
              )}

              {draft.artStyle === "Semi-Realistic" && (
                <AdminField label="Color Finish">
                  <select value={draft.colorFinish} onChange={(e) => setDraft({ ...draft, colorFinish: e.target.value })}>
                    {COLOR_FINISHES.map((finish) => <option key={finish} value={finish}>{finish === "Plain" ? "Plain Color" : finish}</option>)}
                  </select>
                </AdminField>
              )}

              <AdminField label="Tools" hint="Type your own or pick a preset">
                <input list="gallery-tools-list" autoComplete="off" value={draft.tools} onChange={(e) => setDraft({ ...draft, tools: e.target.value })} placeholder="e.g. Clip Studio Paint" />
                <datalist id="gallery-tools-list">{TOOL_PRESETS.map((value) => <option key={value} value={value} />)}</datalist>
              </AdminField>
              <AdminField label="Format" hint="Type your own or pick a preset">
                <input list="gallery-format-list" autoComplete="off" value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} placeholder="e.g. Digital illustration" />
                <datalist id="gallery-format-list">{FORMAT_PRESETS.map((value) => <option key={value} value={value} />)}</datalist>
              </AdminField>
              <AdminField label="Date Published" hint="Defaults to today. Pick another date if you need to.">
                <input type="date" required value={draft.publishedDate} onChange={(e) => setDraft({ ...draft, publishedDate: e.target.value })} />
              </AdminField>

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
                  <span>· {item.type} · <RequestPrice request={item} /></span>
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
            ["Estimate", (() => { const price = getRequestPrice(request); return price.isForeign ? `${price.original} ${price.currency} ≈ ${price.php} PHP` : `${price.php} PHP`; })()],
            ...(getRequestPrice(request).isForeign
              ? [["Rate at submission", `1 ${getRequestPrice(request).currency} ≈ ₱${getRequestPrice(request).rate} PHP (reference rate; the client was quoted in ${getRequestPrice(request).currency})`]]
              : []),
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
        {tab === "requests" && <div className="admin-panel"><div className="panel-head"><div><p>AUTOMATIC INBOX</p><h2>Client requests</h2></div><span>{requests.length} total</span></div><div className="request-list">{requests.map((request) => <button key={request.id} onClick={() => setSelected(request)}><span className="request-avatar">{request.name.slice(0, 2).toUpperCase()}</span><div><strong>{request.name}</strong><small>{request.type} · {request.finish} · submitted {new Date(request.submittedAt).toLocaleDateString()}</small><small className="request-price"><RequestPrice request={request} /></small></div><span>{request.dueDate}</span><Icon name="arrow" /></button>)}{requests.length === 0 && <p className="empty-row">Completed commission forms will be added here automatically.</p>}</div></div>}
        
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
        <div className="footer-bottom-group">
          <span>© 2026 Inkyuu. All rights reserved.</span>
          <span className="dot-sep">•</span>
          <button type="button" className="footer-link-btn" onClick={() => go("guide")}>Terms and Conditions</button>
        </div>

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
    const elements = document.querySelectorAll("main > section, .featured-card, .medium-card, .gallery-card, .policy-section, .policy-cta, .form-section");
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
  const content = { home: <Home go={go} />, guide: <Guide go={go} />, commission: <Commission go={go} />, admin: <Admin go={go} onLogout={logout} /> };
  
  if (page === "admin") {
    if (!authChecked) {
      return <main className="login-page" aria-busy="true"><p role="status">Checking access…</p></main>;
    }
    if (!isAdminAuth) {
      return <Login onLogin={() => setIsAdminAuth(true)} go={go} />;
    }
    return (
      <div className="app-theme">
        {content.admin}
      </div>
    );
  }

  return (
    <CurrencyProvider>
      <div className="site-shell app-theme">
        <Navbar page={page} go={go} />
        {content[page]}
        <Footer go={go} />
      </div>
    </CurrencyProvider>
  );
}