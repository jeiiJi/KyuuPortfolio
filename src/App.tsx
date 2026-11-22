import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import logo from "./assets/kyuu-logo.png";
import titleHero from "./assets/title-hero.png";
import chibiHero from "./assets/chibi-hero.png";
import placeholder from "./assets/placeholder.svg";
const API_URL = "";

type Page = "home" | "about" | "guide" | "commission" | "admin";
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
// Framing for one image: focal point (0-100 % from the left/top) and zoom (1 = fit to cover).
type SlideFrame = { x: number; y: number; zoom: number };
const DEFAULT_FRAME: SlideFrame = { x: 50, y: 50, zoom: 1 };
const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};
const frameImageStyle = (frame: SlideFrame): CSSProperties => ({
  objectPosition: `${frame.x}% ${frame.y}%`,
  transformOrigin: `${frame.x}% ${frame.y}%`,
  transform: frame.zoom > 1 ? `scale(${frame.zoom})` : undefined,
});
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
  if (response.status === 401) window.dispatchEvent(new Event("kyuuji:signed-out"));
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
// Currency + pricing
//
// Everything is priced in USD first. The two base prices are the only "real" numbers:
//   Headshot = $25, Full Body = $30.
// Every add-on / discount below is a share of the selected base price, so changing a base price
// re-quotes the whole menu. Other currencies are conversions of the USD amount:
//   EUR, PHP  -> live fiat rates from the worker (/api/rates), with a fallback if it is unreachable
//   ROBUX     -> fixed rate, $25 = 2,500 R$ and $30 = 3,000 R$ (100 R$ per $1)
// Submitted records keep the currency, total and rate the client was shown.
// ---------------------------------------------------------------------------
type CurrencyCode = "USD" | "EUR" | "PHP" | "ROBUX";
type FiatRates = { EUR: number; PHP: number }; // units of currency per 1 USD

const ROBUX_PER_USD = 100;
// Only used when /api/rates cannot be reached. Approximate on purpose; live rates replace them.
const FALLBACK_RATES: FiatRates = { EUR: 0.92, PHP: 58 };
const RATES_CACHE_KEY = "kyuuji:rates";
const RATES_CACHE_MS = 30 * 60 * 1000;

const CURRENCIES: Record<CurrencyCode, { symbol: string; label: string; short: string; decimals: number }> = {
  USD: { symbol: "$", label: "US dollar", short: "$ USD", decimals: 2 },
  EUR: { symbol: "€", label: "Euro", short: "€ EURO", decimals: 2 },
  PHP: { symbol: "₱", label: "Philippine peso", short: "₱ PHP", decimals: 0 },
  ROBUX: { symbol: "R$", label: "Robux", short: "ROBUX", decimals: 0 },
};
const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
const CURRENCY_STORAGE_KEY = "kyuuji:currency";

function roundToDecimals(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

const BASE_PRICES_USD: Record<string, number> = { Headshot: 25, Fullbody: 30 };
const BASE_LABELS: Record<string, string> = { Headshot: "Headshot", Fullbody: "Full Body" };
const MAX_CHARACTERS = 6;

// Shares of the selected base price.
const ADDON_RATES = {
  stickerDiscountBase: 0.12,  // discount for a 4-sticker set ...
  stickerDiscountStep: 0.06,  // ... plus this much for every extra sticker
  acrylicExtra: 0.30,
  badgesExtra: 0.18,
  referenceSheetExtra: 0.18,
  modelSheetExtra: 1.75,
  ychDiscount: 0.06,
  alternatesExtra: 0.18,
  extraCharacterFlat: 0.20,   // each extra character costs 80% of the scope total + this
  complexBackground: 0.30,
};

const CHIBI_SERVICE_OPTIONS = [
  { value: "Solo Deals", label: "Solo Deals" },
  { value: "Sticker set", label: "Sticker set" },
  { value: "Acrylic Merch", label: "Acrylic Merch" },
  { value: "Badges/Pins/Pfp Design", label: "Badges/Pins/Pfp Design" },
  { value: "Character Reference sheet", label: "Character Reference sheet" },
  { value: "2D Model character sheet", label: "2D Model character sheet" },
  { value: "YCH", label: "YCH (Your Character Here)" },
  { value: "Alternate outfits/expressions", label: "Alternate outfits/expressions" },
];
const BACKGROUND_OPTIONS = [
  { value: "None/Transparent", label: "None / Transparent" },
  { value: "Plain", label: "Plain Solid Color" },
  { value: "Complex", label: "Complex Background" },
];

const usd = (value: number) => roundToDecimals(value, 2);

// Total price of a Chibi service in USD, base price included (same rules as the old PHP/USD lists).
const servicePriceUsd = (service: string, base: number, stickerCount: number, alternativesCount: number) => {
  switch (service) {
    case "Solo Deals": return base;
    case "Sticker set": return usd(base * stickerCount - base * (ADDON_RATES.stickerDiscountBase + (stickerCount - 4) * ADDON_RATES.stickerDiscountStep));
    case "Acrylic Merch": return usd(base + base * ADDON_RATES.acrylicExtra);
    case "Badges/Pins/Pfp Design": return usd(base + base * ADDON_RATES.badgesExtra);
    case "Character Reference sheet": return usd(base * 4 + base * ADDON_RATES.referenceSheetExtra);
    case "2D Model character sheet": return usd(base * 5 + base * ADDON_RATES.modelSheetExtra);
    case "YCH": return Math.max(0, usd(base - base * ADDON_RATES.ychDiscount));
    case "Alternate outfits/expressions": return usd(base * alternativesCount + base * ADDON_RATES.alternatesExtra);
    default: return base;
  }
};
// What the service adds on top of the base scope (this is the number shown in the dropdown).
const serviceFeeUsd = (service: string, baseOption: string, stickerCount: number, alternativesCount: number) => {
  const base = BASE_PRICES_USD[baseOption] ?? BASE_PRICES_USD.Headshot;
  return usd(servicePriceUsd(service, base, stickerCount, alternativesCount) - base);
};
const backgroundFeeUsd = (background: string, baseOption: string) => {
  const base = BASE_PRICES_USD[baseOption] ?? BASE_PRICES_USD.Headshot;
  return background === "Complex" ? usd(base * ADDON_RATES.complexBackground) : 0;
};

type OrderInput = {
  baseOption: string; chibiService: string; stickerCount: number; alternativesCount: number;
  bgOption: string; characters: number; dueDate: string;
};
type OrderLine = { key: string; label: string; usd: number };

const dueDateFeeRate = (dueDate: string) => {
  if (!dueDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00`);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  return diffDays > 14 ? 0.10 : 0.18;
};

const buildOrder = (form: OrderInput) => {
  const base = BASE_PRICES_USD[form.baseOption] ?? 0;
  const serviceFee = form.chibiService && base ? serviceFeeUsd(form.chibiService, form.baseOption, form.stickerCount, form.alternativesCount) : 0;
  const bgFee = base ? backgroundFeeUsd(form.bgOption, form.baseOption) : 0;
  const scopeTotal = usd(base + serviceFee + bgFee);
  const extraCharacterCost = form.characters > 1 ? usd((form.characters - 1) * (scopeTotal * 0.8 + base * ADDON_RATES.extraCharacterFlat)) : 0;
  const subtotal = usd(scopeTotal + extraCharacterCost);
  const priorityRate = dueDateFeeRate(form.dueDate);
  const priorityFee = usd(subtotal * priorityRate);

  const serviceNote = form.chibiService === "Sticker set" ? ` (${form.stickerCount} stickers)`
    : form.chibiService === "Alternate outfits/expressions" ? ` (${form.alternativesCount} options)` : "";
  const lines: OrderLine[] = [];
  if (base) lines.push({ key: "base", label: `Chibi – ${BASE_LABELS[form.baseOption] ?? form.baseOption}`, usd: base });
  if (form.chibiService) lines.push({ key: "service", label: `${form.chibiService}${serviceNote}`, usd: serviceFee });
  if (form.bgOption) lines.push({ key: "bg", label: `${BACKGROUND_OPTIONS.find((o) => o.value === form.bgOption)?.label ?? form.bgOption} background`, usd: bgFee });
  if (form.characters > 1) lines.push({ key: "chars", label: `${form.characters - 1} extra character${form.characters > 2 ? "s" : ""}`, usd: extraCharacterCost });
  const fees: OrderLine[] = [];
  if (priorityFee > 0) fees.push({ key: "priority", label: `Priority due date fee (${Math.round(priorityRate * 100)}%)`, usd: priorityFee });
  return { lines, fees, subtotal, priorityFee, priorityRate, totalUsd: usd(subtotal + priorityFee) };
};

const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(CURRENCIES, value);

const readStoredCurrency = (): CurrencyCode => {
  try {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return isCurrencyCode(stored) ? stored : "USD";
  } catch {
    return "USD"; // storage blocked (private mode, etc.)
  }
};

const formatAmount = (amount: number, code: CurrencyCode) => {
  const { symbol, decimals } = CURRENCIES[code];
  const text = Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${amount < 0 ? "−" : ""}${symbol}${text}`;
};

// Units of `code` per 1 USD.
const unitsPerUsd = (code: CurrencyCode, rates: FiatRates) =>
  code === "USD" ? 1 : code === "ROBUX" ? ROBUX_PER_USD : rates[code];
const convertUsd = (amountUsd: number, code: CurrencyCode, rates: FiatRates) =>
  roundToDecimals(amountUsd * unitsPerUsd(code, rates), CURRENCIES[code].decimals);
// PHP per 1 unit of `code` (how admin records store the exchange rate).
const phpPerUnit = (code: CurrencyCode, rates: FiatRates) => roundToDecimals(rates.PHP / unitsPerUsd(code, rates), 6);

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rates: FiatRates;
  ratesLive: boolean;
  convert: (amountUsd: number) => number;
  money: (amountUsd: number) => string;
};
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const readCachedRates = (): { rates: FiatRates; live: boolean } | null => {
  try {
    const raw = window.sessionStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - Number(parsed.at) > RATES_CACHE_MS) return null;
    if (!(parsed.rates?.EUR > 0) || !(parsed.rates?.PHP > 0)) return null;
    return { rates: { EUR: Number(parsed.rates.EUR), PHP: Number(parsed.rates.PHP) }, live: Boolean(parsed.live) };
  } catch {
    return null;
  }
};

function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(readStoredCurrency);
  const cached = useMemo(readCachedRates, []);
  const [rates, setRates] = useState<FiatRates>(cached?.rates ?? FALLBACK_RATES);
  const [ratesLive, setRatesLive] = useState(cached?.live ?? false);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {
      /* the choice still applies for this visit */
    }
  };

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CURRENCY_STORAGE_KEY) setCurrencyState(readStoredCurrency());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Live fiat rates (cached 30 minutes per tab, and cached again at the edge by the worker).
  useEffect(() => {
    if (cached) return;
    let active = true;
    apiRequest<{ rates: FiatRates; live: boolean }>("/api/rates")
      .then((data) => {
        if (!active || !(data?.rates?.EUR > 0) || !(data?.rates?.PHP > 0)) return;
        setRates({ EUR: data.rates.EUR, PHP: data.rates.PHP });
        setRatesLive(Boolean(data.live));
        try {
          window.sessionStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ at: Date.now(), rates: data.rates, live: data.live }));
        } catch { /* ignore */ }
      })
      .catch((rateError) => console.error("Could not load live exchange rates (using fallback rates):", rateError));
    return () => { active = false; };
  }, [cached]);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency, setCurrency, rates, ratesLive,
    convert: (amountUsd) => convertUsd(amountUsd, currency, rates),
    money: (amountUsd) => formatAmount(convertUsd(amountUsd, currency, rates), currency),
  }), [currency, rates, ratesLive]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside <CurrencyProvider>.");
  return context;
};

function CurrencySelect({ id }: { id?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <label className="currency-picker">
      <span className="sr-only">Currency</span>
      <select id={id} className="currency-select" value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)} aria-label="Choose currency">
        {CURRENCY_CODES.map((code) => <option key={code} value={code}>{CURRENCIES[code].short}</option>)}
      </select>
    </label>
  );
}


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
  const [stuck, setStuck] = useState(false);

  // The navbar casts a soft shadow once the page scrolls.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
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
      setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), 120);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className={`navbar${stuck ? " is-stuck" : ""}`}>
      <div className="nav-inner">
        <div className="nav-left">
          <button type="button" className="menu-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>
            <Icon name={open ? "close" : "menu"} />
          </button>
          <button type="button" className="brand" onClick={() => { go("home"); setOpen(false); }} aria-label="Kyuuji home">
            <img src={logo} alt="Kyuuji" />
          </button>
        </div>

        {open && <div className="nav-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

        <nav id="primary-nav" className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <button type="button" className={page === "home" ? "active" : ""} aria-current={page === "home" ? "page" : undefined}
            onClick={() => { if (page !== "home") go("home"); else window.scrollTo({ top: 0, behavior: "smooth" }); setOpen(false); }}>
            Home
          </button>
          <button type="button" onClick={() => scrollToSection("home-gallery-section")}>Gallery</button>
          <button type="button" className={page === "about" ? "active" : ""} aria-current={page === "about" ? "page" : undefined} onClick={() => { go("about"); setOpen(false); }}>
            About
          </button>

          <div className="drawer-footer-panel">
            <div className="drawer-currency">
              <span className="drawer-social-label">Currency |</span>
              <CurrencySelect />
            </div>
            <div className="drawer-footer-socials">
              <span className="drawer-social-label">Socials |</span>
              <SocialLinks />
            </div>
          </div>
        </nav>

        <div className="nav-actions">
          <CurrencySelect />
          <button type="button" className="btn-pill btn-dark" onClick={() => { go("commission"); setOpen(false); }}>Commission Now</button>
        </div>
      </div>
    </header>
  );
}


function ArtVisual({ art, label }: { art: string; label: string }) {
  return <div className={`art-visual art-${art}`}><img src={placeholder} alt={label} /></div>;
}

// Number of masonry columns: 3 on desktop, 2 on tablets and phones.
function useColumnCount() {
  const read = () => (typeof window !== "undefined" && window.innerWidth >= 900 ? 3 : 2);
  const [count, setCount] = useState(read);
  useEffect(() => {
    const onResize = () => setCount(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return count;
}

const SKELETON_HEIGHTS = [220, 300, 180, 260, 320, 200];

function Home() {
  // The worker returns thumbnails here (not full-size images), which keeps the gallery fast.
  const { items: published, loading, error } = useApiData<PublishedItem>("/api/gallery");
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const cols = useColumnCount();

  const items: GalleryItem[] = useMemo(() => published
    // Semi-Realistic is no longer offered, so any old entries stay out of the public gallery.
    .filter((item) => !item.category?.startsWith("Semi-Realistic"))
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: "Chibi",
      desc: item.description,
      image: item.image,
      imageCount: item.imageCount,
      size: "medium",
      tags: ["published", item.category || "Chibi", item.scope, item.service || item.category?.match(/\(([^)]+)\)/)?.[1]].filter((tag): tag is string => Boolean(tag)),
      publishedAt: item.publishedAt,
      scope: item.scope,
      service: item.service || item.category?.match(/\(([^)]+)\)/)?.[1],
      colorFinish: item.colorFinish,
      tools: item.tools,
      format: item.format,
    })), [published]);

  // Round-robin keeps reading order left to right; the alternating top padding gives the staggered look.
  const columns = useMemo(() => {
    const result: { item: GalleryItem; index: number }[][] = Array.from({ length: cols }, () => []);
    items.forEach((item, index) => result[index % cols].push({ item, index }));
    return result;
  }, [items, cols]);

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

  return (
    <main id="main-content" tabIndex={-1}>
      <section className="home-hero" aria-label="Portfolio">
        <h1 className="home-title">
          <img src={titleHero} alt="Kyuuji Portfolio" decoding="async" />
        </h1>
        <div className="home-hero-row">
          <p className="home-tagline">Let’s squish your favorite characters into cute little beans!</p>
          <img className="home-chibi" src={chibiHero} alt="Two chibi characters" decoding="async" />
        </div>
      </section>

      <section id="home-gallery-section" className="gallery-section" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading" className="gallery-heading">Gallery - {new Date().getFullYear()}</h2>

        <div className="gallery-masonry" style={{ "--cols": cols } as CSSProperties} aria-busy={loading}>
          {loading && Array.from({ length: cols }, (_, columnIndex) => (
            <div className="gallery-masonry-col" key={`skeleton-${columnIndex}`} aria-hidden="true">
              {[0, 1].map((row) => <div className="gallery-skeleton" key={row} style={{ height: SKELETON_HEIGHTS[(columnIndex * 2 + row) % SKELETON_HEIGHTS.length] }} />)}
            </div>
          ))}

          {!loading && columns.map((column, columnIndex) => (
            <div className="gallery-masonry-col" key={columnIndex}>
              {column.map(({ item, index }) => (
                <button
                  type="button"
                  className={`gallery-tile tone-${index % 3}`}
                  style={{ "--i": Math.floor(index / cols) } as CSSProperties}
                  key={item.id}
                  onClick={() => setSelected(item)}
                  aria-label={`View ${item.title} details${item.service ? ` (${item.service})` : ""}`}
                >
                  {"image" in item && item.image
                    ? <img className="gallery-real-image" src={item.image} alt={item.title} loading="lazy" decoding="async" />
                    : <ArtVisual art="placeholder" label={item.title} />}
                  <span className="gallery-overlay">
                    <span className="gallery-overlay-meta">
                      {item.service && <span className="gallery-chip">{item.service}</span>}
                      {item.scope && <span className="gallery-chip">{item.scope}</span>}
                    </span>
                    <span className="gallery-overlay-title">{item.title}</span>
                    <span className="gallery-overlay-cta">View artwork <Icon name="arrow" size={16} /></span>
                  </span>
                </button>
              ))}
            </div>
          ))}

          {!loading && items.length === 0 && (
            <div className="gallery-empty" role={error ? "alert" : undefined}>
              <p>{error ? "The gallery couldn’t be loaded right now. Please try again in a moment." : "No artwork has been published yet."}</p>
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
                <span>Published<strong>{"publishedAt" in selected ? selected.publishedAt : "2026"}</strong></span>
                {"tools" in selected && selected.tools && <span>Tools<strong>{selected.tools}</strong></span>}
                {"format" in selected && selected.format && <span>Format<strong>{selected.format}</strong></span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


// The old home-page "About" strip, now a standalone page reached from the navbar.
function About({ go }: { go: (page: Page) => void }) {
  const openGallery = () => {
    go("home");
    window.setTimeout(() => document.getElementById("home-gallery-section")?.scrollIntoView({ behavior: "smooth" }), 120);
  };

  return (
    <main id="main-content" tabIndex={-1} className="page-main about-page">
      <section className="wrap about-hero">
        <div>
          <p className="kicker">About Me</p>
          <h1>Hi, I'm Kyuu. I draw feelings you can keep.</h1>
          <p>I'm a digital illustrator who loves expressive faces, cozy color stories, and the magic of turning your favorite idea into something unmistakably yours.</p>
          <div className="hero-actions">
            <button type="button" className="btn-pill btn-dark" onClick={() => go("commission")}>Commission Now</button>
            <Btn kind="outline" onClick={openGallery}>View the gallery</Btn>
          </div>
        </div>
        <div className="about-portrait portrait-card">
          <ArtVisual art="artist" label="Illustrated portrait of the artist" />
          <span className="seal">ID<br />Artist</span>
        </div>
      </section>

      <section className="wrap about-terms">
        <p className="kicker">Working together</p>
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
      </section>
    </main>
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


// ---------------------------------------------------------------------------
// Form building blocks for the commission flow
// ---------------------------------------------------------------------------

// Red validation message (#e20808, 20px). The wrapper animates open so the layout flexes instead of jumping.
function FieldError({ id, message }: { id: string; message?: string }) {
  const last = useRef("");
  if (message) last.current = message;
  return (
    <div className={`fe${message ? " show" : ""}`} id={id} role="alert" aria-live="polite">
      <span>{last.current}</span>
    </div>
  );
}

// Text input with a floating placeholder: it sits on the line, then lifts above it (inside the same box)
// while the line moves down to make room.
function FloatInput({ id, label, value, onChange, onBlur, error, required, type = "text", prefix, aside, alwaysFloat, inputMode, autoComplete, maxLength, min, dataField }: {
  id: string; label: string; value: string; onChange: (value: string) => void; onBlur?: () => void;
  error?: string; required?: boolean; type?: string; prefix?: string; aside?: React.ReactNode; alwaysFloat?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string; maxLength?: number; min?: string; dataField?: string;
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value !== "" || Boolean(alwaysFloat);
  return (
    <div className="cf-group" data-field={dataField ?? id}>
      <div className={`ff${floated ? " is-floated" : ""}${error ? " is-invalid" : ""}${aside ? " has-aside" : ""}${prefix ? " has-prefix" : ""}`}>
        <label className="ff-label" htmlFor={id}>{label}</label>
        <div className="ff-row">
          {prefix && <span className="ff-prefix" aria-hidden="true">{prefix}</span>}
          <input
            id={id} className="ff-input" type={type} value={value} inputMode={inputMode} autoComplete={autoComplete} maxLength={maxLength} min={min}
            aria-invalid={Boolean(error)} aria-describedby={`${id}-error`} aria-required={required}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); onBlur?.(); }}
          />
        </div>
        {aside}
        {required && <span className="cf-star" aria-hidden="true">*</span>}
      </div>
      {!aside && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}

type CustomSelectOption = { value: string; label: string; hint?: string };
function CustomSelect({ value, onChange, options, placeholder, ariaLabel, invalid, onClose, id }: {
  value: string; onChange: (value: string) => void; options: CustomSelectOption[]; placeholder: string; ariaLabel: string;
  invalid?: boolean; onClose?: () => void; id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const wasOpen = useRef(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  // Tell the parent when the list closes so it can validate ("touched").
  useEffect(() => {
    if (wasOpen.current && !open) onClose?.();
    wasOpen.current = open;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("touchstart", onDown); };
  }, [open]);

  useEffect(() => {
    if (!open || active < 0) return;
    (listRef.current?.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openList = () => { setActive(selectedIndex >= 0 ? selectedIndex : 0); setOpen(true); };
  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); openList(); }
      return;
    }
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (event.key === "Home") { event.preventDefault(); setActive(0); }
    else if (event.key === "End") { event.preventDefault(); setActive(options.length - 1); }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(active); }
    else if (event.key === "Escape" || event.key === "Tab") { setOpen(false); }
    else if (event.key.length === 1) {
      const next = options.findIndex((option) => option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (next >= 0) setActive(next);
    }
  };

  return (
    <div ref={rootRef} className={`cs${open ? " is-open" : ""}${invalid ? " is-invalid" : ""}`}>
      <button
        id={id}
        type="button"
        className={`cs-trigger${selected ? "" : " is-placeholder"}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid}
        onClick={(event) => { event.preventDefault(); if (open) setOpen(false); else openList(); }}
        onKeyDown={onKeyDown}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className="cs-chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul ref={listRef} className="cs-list" role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={`cs-option${index === active ? " is-active" : ""}`}
              onMouseEnter={() => setActive(index)}
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); choose(index); }}
            >
              <span>{option.label}</span>
              {option.hint && <span className="cs-fee">{option.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


// Due date and due time are both optional (the priority fee only applies when a date is given).
const DUE_DATE_REQUIRED = false;
const MAX_REFERENCES = 10;
const MAX_REFERENCES_BYTES = 1_900_000; // the worker rejects reference sets larger than this
const SOCIAL_APPS = ["Instagram", "Facebook", "TikTok", "Discord", "X (Twitter)"];
const YCH_THEMES: [string, string][] = [["Cozy Tea Time", "tea"], ["Pocket Mascot", "scout"], ["Cheerful Orange", "orange"]];
const STEP_TITLES = ["Terms of Service Agreement & Confirmation", "General Information", "Commission Order Details", "Review & Checkout"];
const TOTAL_STEPS = 4;

type CommissionForm = {
  confirm1: boolean; confirm2: boolean; confirm3: boolean;
  name: string; email: string; socialApp: string; socialHandle: string;
  dueDate: string; dueTime: string; license: string;
  baseOption: string; chibiService: string; stickerCount: number; alternativesCount: number; ychTheme: string;
  bgOption: string; characters: number; notes: string;
};
const EMPTY_FORM: CommissionForm = {
  confirm1: false, confirm2: false, confirm3: false,
  name: "", email: "", socialApp: "", socialHandle: "", dueDate: "", dueTime: "", license: "",
  baseOption: "", chibiService: "", stickerCount: 4, alternativesCount: 2, ychTheme: "",
  bgOption: "", characters: 1, notes: "",
};
const STEP_FIELDS: Record<number, string[]> = {
  1: ["confirm1", "confirm2", "confirm3"],
  2: ["name", "email", "socialHandle", "socialApp", "dueDate", "dueTime", "license"],
  3: ["baseOption", "chibiService", "ychTheme", "bgOption", "characters", "references", "notes"],
  4: [],
};

const formatTime12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  return `${pad2(h % 12 === 0 ? 12 : h % 12)}:${pad2(m)} ${h >= 12 ? "PM" : "AM"}`;
};

// Every input has a rule. Returns { fieldKey: message } for the fields that are currently invalid.
const validateCommission = (form: CommissionForm, referenceError: string): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!form.confirm1) errors.confirm1 = "Please confirm you have read the Commission Guide.";
  if (!form.confirm2) errors.confirm2 = "Please accept the payment terms to continue.";
  if (!form.confirm3) errors.confirm3 = "Please agree to follow the guide’s rules.";

  const name = form.name.trim();
  if (!name) errors.name = "Please enter your name.";
  else if (name.length < 2) errors.name = "Your name needs at least 2 characters.";
  else if (name.length > 120) errors.name = "Please keep your name under 120 characters.";

  const emailError = getEmailError(form.email);
  if (emailError) errors.email = emailError;

  const handle = form.socialHandle.trim().replace(/^@+/, "");
  if (!handle) errors.socialHandle = "Please enter your social media username.";
  else if (!/^[A-Za-z0-9._-]{2,60}$/.test(handle)) errors.socialHandle = "Use 2–60 letters, numbers, dots, dashes or underscores.";
  if (!form.socialApp) errors.socialApp = "Please select a social app.";

  const today = todayInput();
  if (!form.dueDate) {
    if (DUE_DATE_REQUIRED) errors.dueDate = "Please choose a due date.";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dueDate) || Number.isNaN(new Date(`${form.dueDate}T00:00`).getTime())) {
    errors.dueDate = "That date doesn’t look right.";
  } else if (form.dueDate < today) {
    errors.dueDate = "The due date can’t be in the past.";
  }
  if (form.dueTime && form.dueDate === today) {
    const now = new Date();
    if (form.dueTime < `${pad2(now.getHours())}:${pad2(now.getMinutes())}`) errors.dueTime = "That time has already passed today.";
  }
  if (!form.license) errors.license = "Please select a license type.";

  if (!form.baseOption) errors.baseOption = "Please choose Headshot or Full Body.";
  if (!form.chibiService) errors.chibiService = "Please select a Chibi service.";
  if (form.chibiService === "YCH" && !form.ychTheme) errors.ychTheme = "Please pick a YCH theme.";
  if (!form.bgOption) errors.bgOption = "Please select a background style.";
  if (!Number.isInteger(form.characters) || form.characters < 1 || form.characters > MAX_CHARACTERS) errors.characters = `Choose between 1 and ${MAX_CHARACTERS} characters.`;
  if (referenceError) errors.references = referenceError;
  if (form.notes.length > 1000) errors.notes = "Please keep your notes under 1,000 characters.";
  return errors;
};

// Smaller than the admin gallery compressor: reference photos only need to be readable, and the whole
// set has to fit in one request.
const compressReference = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const data = encodeImage(img, 900, 0.6);
      if (data) resolve(data);
      else reject(new Error("This browser can’t resize images."));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} couldn’t be read as an image.`));
    };
    img.src = url;
  });

function Commission({ go }: { go: (page: Page) => void }) {
  const { currency, rates, money, convert } = useCurrency();
  const [step, setStep] = useState(1);
  const [fill, setFill] = useState(0);
  const [form, setForm] = useState<CommissionForm>(EMPTY_FORM);
  const [references, setReferences] = useState<string[]>([]);
  const [referenceError, setReferenceError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const setValue = <K extends keyof CommissionForm>(key: K, value: CommissionForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Switching service resets the sub-options that belong to the old one.
      if (key === "chibiService") next.ychTheme = value === "YCH" ? prev.ychTheme : "";
      return next;
    });
  };
  const touch = (...keys: string[]) => setTouched((prev) => {
    if (keys.every((key) => prev[key])) return prev;
    const next = { ...prev };
    keys.forEach((key) => { next[key] = true; });
    return next;
  });

  const errors = useMemo(() => validateCommission(form, referenceError), [form, referenceError]);
  const shown = (key: string) => (touched[key] ? errors[key] : undefined);

  // The progress bar follows the page: 25% → 50% → 75% → 100%, animated by CSS.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setFill((step / TOTAL_STEPS) * 100));
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [step]);

  // Pricing (all in USD, converted for display)
  const order = useMemo(() => buildOrder(form), [form]);
  const rowAmount = (amountUsd: number) => money(amountUsd);
  const displayedTotal = useMemo(
    () => roundToDecimals([...order.lines, ...order.fees].reduce((sum, line) => sum + convert(line.usd), 0), CURRENCIES[currency].decimals),
    [order, convert, currency]
  );
  const feeHint = (amountUsd: number) => (amountUsd === 0 ? "Included" : `${amountUsd > 0 ? "+" : "−"}${money(Math.abs(amountUsd))}`);
  const referenceScope = form.baseOption || "Headshot";
  const serviceOptions: CustomSelectOption[] = CHIBI_SERVICE_OPTIONS.map((option) => ({
    ...option, hint: feeHint(serviceFeeUsd(option.value, referenceScope, form.stickerCount, form.alternativesCount)),
  }));
  const backgroundOptions: CustomSelectOption[] = BACKGROUND_OPTIONS.map((option) => ({
    ...option, hint: feeHint(backgroundFeeUsd(option.value, referenceScope)),
  }));

  const uploadReferences = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const picked = Array.from(files).filter((file) => file.type.startsWith("image/"));
    touch("references");
    if (!picked.length) { setReferenceError("Please choose image files (PNG, JPG, WEBP…)."); return; }
    const room = MAX_REFERENCES - references.length;
    if (room <= 0) { setReferenceError(`You can upload up to ${MAX_REFERENCES} images.`); return; }
    setUploading(true);
    setReferenceError("");
    try {
      const added: string[] = [];
      for (const file of picked.slice(0, room)) added.push(await compressReference(file));
      const next = [...references, ...added];
      const size = next.reduce((sum, image) => sum + image.length, 0);
      if (size > MAX_REFERENCES_BYTES) {
        setReferenceError("Those images are too large to send together. Remove a few or use smaller files.");
        return;
      }
      setReferences(next);
      if (picked.length > room) setReferenceError(`Only ${MAX_REFERENCES} images are allowed, so the extra files were skipped.`);
    } catch (uploadError) {
      setReferenceError(uploadError instanceof Error ? uploadError.message : String(uploadError));
    } finally {
      setUploading(false);
    }
  };
  const removeReference = (index: number) => {
    setReferences((current) => current.filter((_, i) => i !== index));
    setReferenceError("");
  };

  const focusFirstInvalid = (keys: string[]) => {
    const first = keys.find((key) => errors[key]);
    if (!first) return;
    window.requestAnimationFrame(() => {
      const holder = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
      holder?.scrollIntoView({ behavior: "smooth", block: "center" });
      holder?.querySelector<HTMLElement>("input, button, textarea")?.focus({ preventScroll: true });
    });
  };

  const goNext = () => {
    const keys = STEP_FIELDS[step];
    touch(...keys);
    if (keys.some((key) => errors[key])) { focusFirstInvalid(keys); return; }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const clearForm = () => {
    const dirty = JSON.stringify(form) !== JSON.stringify(EMPTY_FORM) || references.length > 0;
    if (dirty && !window.confirm("Clear everything you’ve entered?")) return;
    setForm(EMPTY_FORM);
    setReferences([]);
    setReferenceError("");
    setTouched({});
    setSubmitError("");
    setStep(1);
  };

  const handleSubmit = async () => {
    // Re-check every page; if something is wrong, jump to the page that has it.
    for (let page = 1; page <= 3; page++) {
      const keys = STEP_FIELDS[page];
      if (keys.some((key) => errors[key])) {
        touch(...keys);
        setStep(page);
        focusFirstInvalid(keys);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError("");
    const handle = form.socialHandle.trim().replace(/^@+/, "");
    const usdTotal = order.totalUsd;
    const request: CommissionRequest = {
      id: Date.now(),
      name: form.name.trim(),
      email: form.email.trim(),
      social: `${form.socialApp}: @${handle}`,
      type: `Chibi - ${form.baseOption}${form.chibiService ? ` (${form.chibiService})` : ""}`,
      finish: "Rendered (Default)",
      characters: form.characters,
      background: form.bgOption,
      commercial: form.license === "Commercial",
      priority: Boolean(form.dueDate),
      dueDate: form.dueDate,
      notes: [
        `License: ${form.license}`,
        `Service: ${form.chibiService || "N/A"}${form.chibiService === "Alternate outfits/expressions" ? ` (${form.alternativesCount} alternatives)` : ""}${form.chibiService === "Sticker set" ? ` (${form.stickerCount} stickers)` : ""}`,
        form.ychTheme ? `YCH Theme: ${form.ychTheme}` : "",
        form.dueDate && form.dueTime ? `Due time: ${formatTime12(form.dueTime)}` : "",
        `Notes: ${form.notes.trim() || "None"}`,
        "Confirmed all terms: Yes",
      ].filter(Boolean).join("\n"),
      references,
      // Lock in exactly what the client saw so the record never shifts later.
      currency,
      totalAmount: displayedTotal,
      exchangeRate: phpPerUnit(currency, rates),
      totalPhp: currency === "PHP" ? displayedTotal : Math.round(usdTotal * rates.PHP),
      submittedAt: new Date().toISOString(),
      stage: 0,
    };
    try {
      await apiRequest<{ success: boolean }>("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Submission Error Details:", error);
      setSubmitError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const baseChoices = Object.keys(BASE_PRICES_USD);
  const checks: { key: "confirm1" | "confirm2" | "confirm3"; text: string }[] = [
    { key: "confirm1", text: "I confirm that I have accessed, read, and fully understood the rules and regulations provided in the official Commission Guide." },
    { key: "confirm2", text: "I explicitly accept the payment terms, including the 20% mid-project downpayment and the mandatory 3-day final payment window upon artwork completion." },
    { key: "confirm3", text: "I explicitly agree to follow all rules, regulations, and operational terms outlined within the guide for the duration of this project." },
  ];

  if (done) {
    return (
      <main id="main-content" tabIndex={-1} className="page-main cf-page">
        <div className="cf-wrap">
          <img className="cf-logo" src={titleHero} alt="Kyuuji Portfolio" />
          <div className="cf-card cf-done">
            <h2>Request sent!</h2>
            <p>Thank you, {form.name.trim() || "friend"}! Your commission request was submitted. You’ll receive a personalized quote after it’s reviewed.</p>
            <button type="button" className="btn-pill btn-dark" onClick={() => go("home")}>Back to Home</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="page-main cf-page">
      <div className="cf-wrap">
        <img className="cf-logo" src={titleHero} alt="Kyuuji Portfolio" />

        <header className="cf-header"><h1>{STEP_TITLES[step - 1]}</h1></header>

        <form noValidate onSubmit={(event) => { event.preventDefault(); if (step < TOTAL_STEPS) goNext(); else void handleSubmit(); }}>
          <div className="cf-card" key={step}>
            {step === 1 && (
              <div className="cf-step">
                <p className="cf-lede">
                  Please review and check each box below to proceed with your application. By checking these requirements, you acknowledge that you have read the official{" "}
                  <a href="#guide" target="_blank" rel="noreferrer">Commission Guide</a> and explicitly agree to follow these operational boundaries throughout our project.
                </p>
                <div className="cf-checks">
                  {checks.map(({ key, text }) => (
                    <div className="cf-group" data-field={key} key={key}>
                      <label className={`cf-check${shown(key) ? " is-invalid" : ""}`}>
                        <input type="checkbox" checked={form[key]} onChange={(event) => { setValue(key, event.target.checked); touch(key); }} aria-describedby={`${key}-error`} aria-required />
                        <span className="cf-checkbox" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
                        <span>{text}</span>
                        <span className="cf-star" aria-hidden="true">*</span>
                      </label>
                      <FieldError id={`${key}-error`} message={shown(key)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="cf-step">
                <div className="cf-group">
                  <h2 className="cf-section-title">Personal Information</h2>
                  <p className="cf-section-note">Please provide and fill up all necessary contact details and preferences.</p>
                  <div className="cf-fields">
                    <FloatInput id="name" label="Name" required value={form.name} autoComplete="name" maxLength={120}
                      onChange={(v) => setValue("name", v)} onBlur={() => touch("name")} error={shown("name")} />
                    <FloatInput id="email" label="Email" required type="email" inputMode="email" autoComplete="email" value={form.email}
                      onChange={(v) => setValue("email", v)} onBlur={() => touch("email")} error={shown("email")} />
                    <div className="cf-group" data-field="socialHandle">
                      <FloatInput id="socialHandle" label="Social Media" required prefix="@" value={form.socialHandle} maxLength={61} autoComplete="off"
                        onChange={(v) => setValue("socialHandle", v)} onBlur={() => touch("socialHandle")} error={shown("socialHandle")}
                        aside={
                          <div data-field="socialApp">
                            <CustomSelect id="socialApp" ariaLabel="Social app" placeholder="Select Social App" value={form.socialApp}
                              onChange={(v) => { setValue("socialApp", v); touch("socialApp"); }} onClose={() => touch("socialApp")} invalid={Boolean(shown("socialApp"))}
                              options={SOCIAL_APPS.map((app) => ({ value: app, label: app }))} />
                          </div>
                        } />
                      <FieldError id="socialHandle-error" message={shown("socialHandle")} />
                      <FieldError id="socialApp-error" message={shown("socialApp")} />
                    </div>
                  </div>
                </div>

                <div className="cf-group">
                  <h2 className="cf-section-title">Project Due Date</h2>
                  <p className="cf-section-note">Expected commissioned pieces will be labeled as PRIORITY. In PRIORITY, it will be prioritized over non-prioritized pieces, and will be charged an extra 18% of total price (or 10% if the due date is more than 14 days away).</p>
                  <div className="ff-datetime">
                    <FloatInput id="dueDate" label={DUE_DATE_REQUIRED ? "MM-DD-YYYY" : "MM-DD-YYYY (optional)"} type="date" alwaysFloat required={DUE_DATE_REQUIRED} min={todayInput()} value={form.dueDate}
                      onChange={(v) => setValue("dueDate", v)} onBlur={() => touch("dueDate")} error={shown("dueDate")} />
                    <FloatInput id="dueTime" label="00 : 00 AM (optional)" type="time" alwaysFloat value={form.dueTime}
                      onChange={(v) => setValue("dueTime", v)} onBlur={() => touch("dueTime")} error={shown("dueTime")} />
                  </div>
                </div>

                <div className="cf-group" data-field="license">
                  <h2 className="cf-section-title">License Type</h2>
                  <p className="cf-section-note">Commissioned pieces intended for business, branding, or profit-generating purposes will be labeled as <b>Commercial</b>, which grants commercial usage rights and will incur additional fees (to be discussed), while pieces intended strictly for private, non-profit use will be labeled as <b>Personal</b>.</p>
                  <div className="cf-rel">
                    <CustomSelect id="license" ariaLabel="License type" placeholder="Select License Type" value={form.license}
                      onChange={(v) => { setValue("license", v); touch("license"); }} onClose={() => touch("license")} invalid={Boolean(shown("license"))}
                      options={[{ value: "Personal", label: "Personal" }, { value: "Commercial", label: "Commercial" }]} />
                    <span className="cf-star" aria-hidden="true">*</span>
                  </div>
                  <FieldError id="license-error" message={shown("license")} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="cf-step">
                <div className="cf-group" data-field="baseOption">
                  <span className="cf-label" id="base-scope-label">Base Scope<span className="cf-req" aria-hidden="true">*</span></span>
                  <div className={`cf-radio-cards${shown("baseOption") ? " is-invalid" : ""}`} role="radiogroup" aria-labelledby="base-scope-label">
                    {baseChoices.map((name) => (
                      <button type="button" role="radio" aria-checked={form.baseOption === name} className="cf-radio" key={name}
                        onClick={() => { setValue("baseOption", name); touch("baseOption"); }}>
                        <span className="cf-radio-dot" aria-hidden="true" />
                        <span className="cf-radio-img"><img src={placeholder} alt="" /></span>
                        <span className="cf-radio-caption">{BASE_LABELS[name]} ({money(BASE_PRICES_USD[name])})</span>
                      </button>
                    ))}
                  </div>
                  <FieldError id="baseOption-error" message={shown("baseOption")} />
                </div>

                <div className="cf-group" data-field="chibiService">
                  <span className="cf-label">Chibi Service<span className="cf-req" aria-hidden="true">*</span></span>
                  <CustomSelect id="chibiService" ariaLabel="Chibi service" placeholder="--Select Chibi Service --" value={form.chibiService}
                    onChange={(v) => { setValue("chibiService", v); touch("chibiService"); }} onClose={() => touch("chibiService")}
                    invalid={Boolean(shown("chibiService"))} options={serviceOptions} />
                  <p className="cf-hint">Fees shown are added to the {BASE_LABELS[referenceScope]} price.</p>
                  <FieldError id="chibiService-error" message={shown("chibiService")} />
                </div>

                {form.chibiService === "Sticker set" && (
                  <div className="cf-group">
                    <span className="cf-label">Sticker Count (4 to 9 stickers)</span>
                    <div className="cf-stepper small">
                      <button type="button" aria-label="Fewer stickers" disabled={form.stickerCount <= 4} onClick={() => setValue("stickerCount", Math.max(4, form.stickerCount - 1))}>−</button>
                      <output aria-live="polite">{form.stickerCount}</output>
                      <button type="button" aria-label="More stickers" disabled={form.stickerCount >= 9} onClick={() => setValue("stickerCount", Math.min(9, form.stickerCount + 1))}>+</button>
                    </div>
                  </div>
                )}
                {form.chibiService === "Alternate outfits/expressions" && (
                  <div className="cf-group">
                    <span className="cf-label">Number of Alternatives (2 to 6 options)</span>
                    <div className="cf-stepper small">
                      <button type="button" aria-label="Fewer alternatives" disabled={form.alternativesCount <= 2} onClick={() => setValue("alternativesCount", Math.max(2, form.alternativesCount - 1))}>−</button>
                      <output aria-live="polite">{form.alternativesCount}</output>
                      <button type="button" aria-label="More alternatives" disabled={form.alternativesCount >= 6} onClick={() => setValue("alternativesCount", Math.min(6, form.alternativesCount + 1))}>+</button>
                    </div>
                  </div>
                )}
                {form.chibiService === "YCH" && (
                  <div className="cf-group" data-field="ychTheme">
                    <span className="cf-label" id="ych-label">Select YCH Theme<span className="cf-req" aria-hidden="true">*</span></span>
                    <div className={`cf-radio-cards${shown("ychTheme") ? " is-invalid" : ""}`} role="radiogroup" aria-labelledby="ych-label" style={{ paddingLeft: 0 }}>
                      {YCH_THEMES.map(([themeName, artKey]) => (
                        <button type="button" role="radio" aria-checked={form.ychTheme === themeName} className="cf-radio" key={themeName}
                          onClick={() => { setValue("ychTheme", themeName); touch("ychTheme"); }}>
                          <span className="cf-radio-dot" aria-hidden="true" />
                          <span className="cf-radio-img"><ArtVisual art={artKey} label={themeName} /></span>
                          <span className="cf-radio-caption">{themeName}</span>
                        </button>
                      ))}
                    </div>
                    <FieldError id="ychTheme-error" message={shown("ychTheme")} />
                  </div>
                )}

                <div className="cf-group" data-field="bgOption">
                  <span className="cf-label">Background Style<span className="cf-req" aria-hidden="true">*</span></span>
                  <CustomSelect id="bgOption" ariaLabel="Background style" placeholder="--Select Background Style --" value={form.bgOption}
                    onChange={(v) => { setValue("bgOption", v); touch("bgOption"); }} onClose={() => touch("bgOption")}
                    invalid={Boolean(shown("bgOption"))} options={backgroundOptions} />
                  <FieldError id="bgOption-error" message={shown("bgOption")} />
                </div>

                <div className="cf-group" data-field="characters">
                  <span className="cf-label">Number of Characters in Canvas (Max: {MAX_CHARACTERS})<span className="cf-req" aria-hidden="true">*</span></span>
                  <div className="cf-stepper">
                    <button type="button" aria-label="Fewer characters" disabled={form.characters <= 1} onClick={() => setValue("characters", Math.max(1, form.characters - 1))}>−</button>
                    <output aria-live="polite">{form.characters}</output>
                    <button type="button" aria-label="More characters" disabled={form.characters >= MAX_CHARACTERS} onClick={() => setValue("characters", Math.min(MAX_CHARACTERS, form.characters + 1))}>+</button>
                  </div>
                  <FieldError id="characters-error" message={shown("characters")} />
                </div>

                <div className="cf-group" data-field="references">
                  <span className="cf-label">Reference Images (Max: {MAX_REFERENCES} Files)</span>
                  <p className="cf-file-count">Uploaded: {references.length} / {MAX_REFERENCES}{uploading ? " · processing…" : ""}</p>
                  <div className={`cf-file${shown("references") ? " is-invalid" : ""}`}>
                    <label htmlFor="references">Choose Files</label>
                    <input id="references" type="file" accept="image/*" multiple disabled={uploading || references.length >= MAX_REFERENCES}
                      onChange={(event) => { const input = event.target; const files = input.files; void uploadReferences(files).then(() => { input.value = ""; }); }} />
                    <span>{references.length ? `${references.length} file${references.length > 1 ? "s" : ""} chosen` : "No File(s) Chosen"}</span>
                  </div>
                  {references.length > 0 && (
                    <div className="cf-refs">
                      {references.map((image, index) => (
                        <div className="cf-ref" key={`${index}-${image.slice(-16)}`}>
                          <img src={image} alt={`Reference ${index + 1}`} />
                          <button type="button" aria-label={`Remove reference ${index + 1}`} onClick={() => removeReference(index)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <FieldError id="references-error" message={shown("references")} />
                </div>

                <div className="cf-group" data-field="notes">
                  <label className="cf-label" htmlFor="notes">Additional Notes (optional)</label>
                  <textarea id="notes" className="cf-textarea" rows={3} maxLength={1100} value={form.notes} placeholder="Pose, outfit, mood, background details…"
                    aria-invalid={Boolean(shown("notes"))} aria-describedby="notes-error"
                    onChange={(event) => setValue("notes", event.target.value)} onBlur={() => touch("notes")} />
                  <FieldError id="notes-error" message={shown("notes")} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="cf-summary">
                <h2>ORDER SUMMARY</h2>
                <div className="cf-list-block">
                  <div className="cf-list-head"><span>Order List</span><span>Price List</span></div>
                  {order.lines.map((line) => (
                    <div className="cf-list-row" key={line.key}>
                      <span>{line.label}</span>
                      <span>{line.key !== "base" && line.usd === 0 ? "Included" : line.usd < 0 ? `−${rowAmount(Math.abs(line.usd))}` : line.key === "base" ? rowAmount(line.usd) : `+${rowAmount(line.usd)}`}</span>
                    </div>
                  ))}
                </div>
                <div className="cf-list-block">
                  <div className="cf-list-head"><span>Additional Fee(s)</span></div>
                  {order.fees.map((fee) => (
                    <div className="cf-list-row" key={fee.key}><span>{fee.label}</span><span>+{rowAmount(fee.usd)}</span></div>
                  ))}
                  {form.license === "Commercial" && (
                    <div className="cf-list-row"><span>Commercial license</span><span>To be discussed</span></div>
                  )}
                  {order.fees.length === 0 && form.license !== "Commercial" && <div className="cf-list-row"><span>None</span><span>{rowAmount(0)}</span></div>}
                </div>
                <div className="cf-total"><span>ESTIMATED TOTAL</span><strong>{formatAmount(displayedTotal, currency)}</strong></div>
                {form.license === "Commercial" && <p className="cf-note">* Commercial Type price is not included in the estimated total.</p>}
                {submitError && <p className="cf-banner" role="alert">{submitError}</p>}
              </div>
            )}
          </div>

          <div className="cf-controls">
            <button type="button" className="cf-clear" onClick={clearForm}>Clear Form</button>
            <div className="cf-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((step / TOTAL_STEPS) * 100)} aria-label="Form progress">
              <div className="cf-fill" style={{ width: `${fill}%` }} />
            </div>
            <span className="cf-page-label">Page {step} of {TOTAL_STEPS}</span>
            <div className="cf-buttons">
              {step > 1 && <button type="button" className="btn-pill btn-main" onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</button>}
              <button type="submit" className="btn-pill btn-main" disabled={submitting || uploading}>
                {step < TOTAL_STEPS ? "Next" : submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </form>
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

type FilterKind = "scope" | "service";
type ActiveTag = { kind: FilterKind; value: string };

const CHIBI_SCOPES = ["Headshot", "Fullbody"];
const CHIBI_SERVICES = ["Solo Deals", "Sticker set", "Acrylic Merch", "Badges/Pins/Pfp Design", "Character Reference sheet", "2D Model character sheet", "YCH", "Alternate outfits/expressions"];
const TOOL_PRESETS = ["Clip Studio Paint", "Procreate", "Adobe Photoshop", "Krita", "Paint Tool SAI", "MediBang Paint", "Ibis Paint X", "Adobe Illustrator"];
const FORMAT_PRESETS = ["Digital illustration", "Digital print", "Sticker sheet", "Acrylic merch", "Pin / Badge", "Photocard", "Reference sheet", "2D model sheet"];
const KIND_LABEL: Record<FilterKind, string> = { scope: "Scope", service: "Service" };

const itemService = (item: AdminLibraryItem) => item.service || item.category?.match(/\(([^)]+)\)/)?.[1] || "";

const matchesFilters = (item: AdminLibraryItem, tags: ActiveTag[]) => {
  for (const kind of ["scope", "service"] as FilterKind[]) {
    const picked = tags.filter((tag) => tag.kind === kind).map((tag) => tag.value);
    if (!picked.length) continue;
    const value = kind === "scope" ? item.scope : itemService(item);
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

function LibraryFilterBar({ tags, onToggleTag, onClear }: {
  tags: ActiveTag[]; onToggleTag: (tag: ActiveTag) => void; onClear: () => void;
}) {
  const [drawer, setDrawer] = useState<"scope" | "service" | null>(null);
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
        <button type="button" className={`filter-pill-btn ${drawer === "scope" ? "open" : ""}`} aria-expanded={drawer === "scope"} aria-controls="filter-drawer" onClick={() => toggleDrawer("scope")}>
          Scope <span aria-hidden="true">{drawer === "scope" ? "▴" : "▾"}</span>
        </button>
        <button type="button" className={`filter-pill-btn ${drawer === "service" ? "open" : ""}`} aria-expanded={drawer === "service"} aria-controls="filter-drawer" onClick={() => toggleDrawer("service")}>
          Service <span aria-hidden="true">{drawer === "service" ? "▴" : "▾"}</span>
        </button>
        {tags.length > 0 && <button type="button" className="sub-filter-clear" onClick={onClear}>Clear filters</button>}
      </div>

      {drawer && (
        <div className="library-filter-drawer" id="filter-drawer">
          {drawer === "scope" && CHIBI_SCOPES.map((value) => pill("scope", value))}
          {drawer === "service" && CHIBI_SERVICES.map((value) => pill("service", value))}
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
      {framed && previewSrc ? (
        <div
          ref={stageRef}
          className="set-frame-stage"
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
          Slide {previewIndex + 1} of {images.length}. Framed exactly like the home hero.
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
            <label className={`set-file-btn ${busy || atMax ? "busy" : ""}`}>
              <Icon name="plus" size={14} /> {addLabel}
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

      {images.length === 0 && (
        <div className="set-actions">
          <label className={`set-file-btn ${busy || atMax ? "busy" : ""}`}>
            <Icon name="plus" size={14} /> {addLabel}
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

  const visible = useMemo(() => items.filter((item) => matchesFilters(item, tags)), [items, tags]);

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
    const style = "Chibi";
    setDraft({
      ...emptyDraft(),
      title: item.title,
      description: item.description || "",
      artStyle: style,
      subCategory: itemService(item) || "Sticker set",
      scope: item.scope || CHIBI_SCOPES[0],
      colorFinish: "",
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

    const style = "Chibi";
    const service = style === "Chibi" ? draft.subCategory : "";
    const colorFinish = "";
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
      <div className="panel-head">
        <div>
          <p>PUBLISHED LIBRARY</p>
          <h2>Gallery images</h2>
        </div>
        <button className="admin-plus" onClick={openAdd}>
          <Icon name="plus" /> Add artwork
        </button>
      </div>

      <LibraryFilterBar tags={tags} onToggleTag={toggleTag} onClear={() => setTags([])} />

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

              <AdminField label="Scope">
                <select value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })}>
                  {CHIBI_SCOPES.map((scope) => <option key={scope} value={scope}>{scope}</option>)}
                </select>
              </AdminField>

              <AdminField label="Service">
                <select value={draft.subCategory} onChange={(e) => setDraft({ ...draft, subCategory: e.target.value })}>
                  {CHIBI_SERVICES.map((service) => <option key={service} value={service}>{service === "YCH" ? "YCH (Your Character Here)" : service}</option>)}
                </select>
              </AdminField>

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
            <h3 style={{ fontFamily: "Fredoka", fontSize: "24px", marginBottom: "12px" }}>Permanently Delete Record?</h3>
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

  const filteredRequests = requests.filter((request) => {
    if (searchQuery.trim() && !request.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterPriority === "priority" && !request.priority) return false;
    if (filterPriority === "normal" && request.priority) return false;

    return true;
  });

  return (
    <main className="admin-shell">
      <aside className="admin-nav">
        <button className="admin-brand" onClick={() => go("home")}><img src={logo} alt="Kyuuji" /></button>
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
            
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "10px", padding: "16px 0", borderBottom: "1px solid var(--line)", alignItems: "center" }}>
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
            </div>

            <div className="database-table">
              <div className="database-row database-head" style={{ gridTemplateColumns: "1.2fr 1fr .75fr 1.0fr 1.1fr 75px" }}>
                <span>Client</span><span>Project</span><span>Due</span><span>Finish level</span><span>Progress</span><span />
              </div>
              {filteredRequests.map((request) => {
                const progressPercent = request.stage === 5 ? 100 : Math.min(100, Math.round((request.stage / 5) * 100));
                
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
                    <span>{request.type} · {request.characters} char.</span>
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
          <img src={logo} alt="Kyuuji" style={{ width: "150px", height: "auto", display: "block", margin: "0 auto", mixBlendMode: "multiply" }} />
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

// Add your TikTok / Discord links here. All five icons always show in the footer; an icon with an
// empty link is shown but not clickable until you fill it in.
const SOCIAL_LINKS = {
  email: "mailto:kyuukyuuji@gmail.com",
  instagram: "https://www.instagram.com/jeii_ji",
  facebook: "https://www.facebook.com/christinejoy.morata02/",
  tiktok: "",
  discord: "",
};

type SocialKey = "facebook" | "instagram" | "tiktok" | "discord" | "mail";

// Brand glyphs are drawn on a 24x24 canvas. Gradient ids come from useId so every copy of the icon
// (footer + mobile drawer) owns its own gradient; a shared id inside a display:none drawer is what
// used to make the Instagram badge render flat/wrong.
function SocialIcon({ name }: { name: SocialKey }) {
  const uid = useId().replace(/:/g, "");
  switch (name) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="12" fill="#1877f2" />
          <path fill="#fff" d="M16.671 15.469 17.203 12h-3.328V9.75c0-.949.465-1.875 1.956-1.875h1.513V4.922s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669V12H7.078v3.469h3.047v8.385a12.118 12.118 0 0 0 3.75 0v-8.385h2.796Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id={`ig-${uid}`} cx="0.3" cy="1.07" r="1.5" fx="0.3" fy="1.07">
              <stop offset="0" stopColor="#fdf497" />
              <stop offset="0.05" stopColor="#fdf497" />
              <stop offset="0.45" stopColor="#fd5949" />
              <stop offset="0.6" stopColor="#d6249f" />
              <stop offset="0.9" stopColor="#285aeb" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#ig-${uid})`} />
          <rect x="5" y="5" width="14" height="14" rx="4.2" fill="none" stroke="#fff" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.7" />
          <circle cx="16.3" cy="7.7" r="1.05" fill="#fff" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="12" fill="#000" />
          <g transform="translate(6.3 5.7) scale(.5)">
            <path fill="#25f4ee" transform="translate(-1.1 .9)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
            <path fill="#fe2c55" transform="translate(1.1 -.9)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
            <path fill="#fff" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
          </g>
        </svg>
      );
    case "discord":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="12" fill="#5865f2" />
          <g transform="translate(4.6 5.2) scale(.6)">
            <path fill="#fff" d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
          </g>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="1.5" y="4.5" width="21" height="15" rx="2.2" fill="#fdf2e2" />
          <path d="m2.4 6.2 9.6 7.1 9.6-7.1M2.4 18l6.6-6.1M21.6 18l-6.6-6.1" fill="none" stroke="#373737" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function SocialLinks() {
  const entries: { key: SocialKey; href: string; label: string }[] = [
    { key: "facebook", href: SOCIAL_LINKS.facebook, label: "Facebook" },
    { key: "instagram", href: SOCIAL_LINKS.instagram, label: "Instagram" },
    { key: "tiktok", href: SOCIAL_LINKS.tiktok, label: "TikTok" },
    { key: "discord", href: SOCIAL_LINKS.discord, label: "Discord" },
    { key: "mail", href: SOCIAL_LINKS.email, label: "Email" },
  ];
  return (
    <>
      {entries.map((entry) => entry.href ? (
        <a key={entry.key} className="social-badge" href={entry.href} target={entry.key === "mail" ? undefined : "_blank"} rel="noreferrer" aria-label={entry.key === "mail" ? "Email" : `${entry.label} (opens in a new tab)`}>
          <SocialIcon name={entry.key} />
        </a>
      ) : (
        <span key={entry.key} className="social-badge is-pending" role="img" aria-label={`${entry.label} (link coming soon)`} title={`${entry.label} – coming soon`}>
          <SocialIcon name={entry.key} />
        </span>
      ))}
    </>
  );
}

// The footer is the last element of the page. On the homepage the "Ready to bring your idea to life?"
// call-to-action lives inside it (same dark block), so nothing sits below the footer.
function Footer({ go, showCta }: { go: (page: Page) => void; showCta: boolean }) {
  return (
    <footer className="site-footer">
      {showCta && (
        <div className="footer-cta">
          <h2>Ready to bring your idea to life?</h2>
          <p>Tell me what you’re imagining and receive a personalized quote.</p>
          <button type="button" className="btn-pill btn-light" onClick={() => go("commission")}>Commission Now</button>
        </div>
      )}
      <div className="footer-bottom">
        <div className="footer-bottom-group">
          <span>© 2026 Kyuuji. All Rights Reserved.</span>
          <button type="button" className="footer-link-btn" onClick={() => go("guide")}>Terms and Conditions</button>
        </div>
        <div className="footer-socials">
          <span className="footer-socials-label">Socials</span>
          <span className="sep" aria-hidden="true">|</span>
          <div className="footer-socials-icons"><SocialLinks /></div>
        </div>
      </div>
    </footer>
  );
}


function AppInner() {
  const getPage = (): Page => {
    const hash = window.location.hash.replace("#", "").split("?")[0] as Page;
    return ["home", "about", "gallery", "guide", "commission", "admin"].includes(hash) ? hash : "home";
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
    window.addEventListener("kyuuji:signed-out", onSignedOut);
    return () => window.removeEventListener("kyuuji:signed-out", onSignedOut);
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

  // Scroll-triggered reveals. New elements (such as gallery tiles that arrive after the API answers)
  // are picked up by the MutationObserver, and --i staggers neighbours.
  useEffect(() => {
    const SELECTOR = "main > section, .policy-section, .policy-cta, [data-reveal]";    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement;
      element.classList.add("revealed");
      window.setTimeout(() => element.classList.add("reveal-done"), 1400);
      observer.unobserve(element);
    }), { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });

    const add = (element: Element) => {
      if (seen.has(element)) return;
      seen.add(element);
      element.classList.add("scroll-reveal");
      observer.observe(element);
    };
    const scan = (root: Element | Document) => {
      if (root instanceof Element && root.matches(SELECTOR)) add(root);
      root.querySelectorAll(SELECTOR).forEach(add);
    };
    scan(document);

    const mutations = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof Element) scan(node);
    })));
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => { observer.disconnect(); mutations.disconnect(); };
  }, [page]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [page]);

  const go = (next: Page) => {
    window.location.hash = `${next}`;
    setPage(next);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  };
  const content = { home: <Home />, about: <About go={go} />, guide: <Guide go={go} />, commission: <Commission go={go} />, admin: <Admin go={go} onLogout={logout} /> };
  
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
        <Footer go={go} showCta={page === "home"} />
      </div>
    </CurrencyProvider>
  );
}

export default function App() {
  return <AppInner />;
}