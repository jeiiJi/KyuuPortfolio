const MEDIA = {
  products: ["title", "description", "image", "category", "price", "publishedAt", "artStyle", "scope", "service", "colorFinish", "dateMade", "tools", "format"],
  discounts: ["title", "percentage", "requirementType", "description", "startDate", "endDate", "bannerImage", "code", "artStyle", "scope", "service", "colorFinish"],
};
const GALLERY_COLS = ["title", "description", "image", "category", "scope", "service", "colorFinish", "publishedAt", "artStyle", "dateMade", "tools", "format"];

const NUMERIC = new Set(["price", "percentage"]);
const DEFAULTS = { requirementType: "Any" };
const clean = (col, value) =>
  NUMERIC.has(col) ? Number(value) || 0 : value ?? DEFAULTS[col] ?? "";

const MAX_ENTRY_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 1_900_000;
const ROWS_PER_INSERT = 4;

const imageBytes = (src) => {
  const comma = src.indexOf(",");
  if (!src.startsWith("data:") || comma === -1) return src.length;
  const base64 = src.slice(comma + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};
const megabytes = (bytes) => (bytes / (1024 * 1024)).toFixed(1);

const checkImages = (images) => {
  if (!Array.isArray(images) || images.length === 0) return "Add at least one image.";
  let total = 0;
  for (let i = 0; i < images.length; i++) {
    if (typeof images[i] !== "string" || !images[i]) return `Image ${i + 1} is not valid.`;
    const bytes = imageBytes(images[i]);
    if (bytes > MAX_IMAGE_BYTES) {
      return `Image ${i + 1} is ${megabytes(bytes)} MB after processing, which is too large to store as one image. Try a smaller version.`;
    }
    total += bytes;
  }
  if (total > MAX_ENTRY_BYTES) {
    return `These images total ${megabytes(total)} MB, over the ${MAX_ENTRY_BYTES / (1024 * 1024)} MB limit for one entry.`;
  }
  return "";
};

const extraImageInserts = (env, galleryId, images) => {
  const extras = images.slice(1);
  const statements = [];
  for (let start = 0; start < extras.length; start += ROWS_PER_INSERT) {
    const chunk = extras.slice(start, start + ROWS_PER_INSERT);
    const values = chunk.map(() => "(?, ?, ?, ?)").join(", ");
    const params = chunk.flatMap((src, offset) => [galleryId, start + offset + 1, src, imageBytes(src)]);
    statements.push(
      env.DB.prepare(`INSERT INTO gallery_images (galleryId, position, data, bytes) VALUES ${values}`).bind(...params)
    );
  }
  return statements;
};

const SESSION_COOKIE = "inkyuu_session";
const SESSION_SECONDS = 8 * 60 * 60;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_SECONDS = 15 * 60;
const MAX_BODY_BYTES = 16 * 1024 * 1024;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (text) => {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
};

const sha256 = async (text) => new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));

// stored format: pbkdf2$<iterations>$<salt>$<hash>  (created by scripts/make-admin-secrets.mjs)
const verifyPassword = async (password, stored) => {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 100000) return false;
  const salt = fromBase64Url(parts[2]);
  const expected = fromBase64Url(parts[3]);
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, expected.length * 8)
  );
  return timingSafeEqual(derived, expected);
};

const hmacKey = (secret) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

const createSessionToken = async (env) => {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ sub: "admin", exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(env.SESSION_SECRET), encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
};

const readCookie = (request, name) => {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return "";
};

const hasAdminSession = async (request, env) => {
  if (!env.SESSION_SECRET) return false;
  const token = readCookie(request, SESSION_COOKIE);
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  try {
    const valid = await crypto.subtle.verify("HMAC", await hmacKey(env.SESSION_SECRET), fromBase64Url(signature), encoder.encode(payload));
    if (!valid) return false;
    const data = JSON.parse(decoder.decode(fromBase64Url(payload)));
    return data.sub === "admin" && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

const sessionCookie = (token, maxAge) =>
  `${SESSION_COOKIE}=${token}; Max-Age=${maxAge}; Path=/api; HttpOnly; Secure; SameSite=Strict`;

const needsAdmin = (method, path) => {
  if (method === "POST" && /^\/api\/commissions\/?$/.test(path)) return false;
  if (path.startsWith("/api/commissions")) return true;
  return method !== "GET" && method !== "HEAD";
};

const readJson = async (request) => {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) throw new HttpError(413, "That request is too large.");
  try {
    const data = await request.json();
    if (!data || typeof data !== "object") throw new Error("not an object");
    return data;
  } catch {
    throw new HttpError(400, "The request body must be valid JSON.");
  }
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REFERENCES_BYTES = 1_900_000;
const text = (value, max) => String(value ?? "").slice(0, max);
const number = (value, min, max, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const cleanCommission = (data) => {
  const name = text(data.name, 120).trim();
  const email = text(data.email, 200).trim();
  const type = text(data.type, 200).trim();
  if (!name) throw new HttpError(400, "Please enter your name.");
  if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, "Please enter a valid email address.");
  if (!type) throw new HttpError(400, "Please choose a commission type.");

  const references = Array.isArray(data.references) ? data.references.filter((item) => typeof item === "string").slice(0, 10) : [];
  const referencesJson = JSON.stringify(references);
  if (referencesJson.length > MAX_REFERENCES_BYTES) {
    throw new HttpError(413, "Your reference images are too large to send together. Please remove a few or use smaller files.");
  }

  const id = Number(data.id);
  return {
    id: Number.isSafeInteger(id) && id > 0 ? id : Date.now(),
    name,
    email,
    social: text(data.social, 200),
    type,
    finish: text(data.finish, 200),
    characters: Math.round(number(data.characters, 1, 20, 1)),
    background: text(data.background, 200),
    commercial: data.commercial ? 1 : 0,
    priority: data.priority ? 1 : 0,
    dueDate: text(data.dueDate, 40),
    notes: text(data.notes, 4000),
    referencesJson,
    totalPhp: Math.round(number(data.totalPhp, 0, 10_000_000, 0)),
    submittedAt: text(data.submittedAt, 40) || new Date().toISOString(),
    discountCode: data.discountCode ? text(data.discountCode, 100) : null,
    discountName: data.discountName ? text(data.discountName, 200) : null,
    discountAmount: Math.round(number(data.discountAmount, 0, 10_000_000, 0)),
  };
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = { "X-Content-Type-Options": "nosniff" };
    if (path.startsWith("/api/admin") || path.startsWith("/api/commissions")) corsHeaders["Cache-Control"] = "no-store";

    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin && !["GET", "HEAD"].includes(request.method)) {
        throw new HttpError(403, "Cross-site requests are not allowed.");
      }

      if (path === "/api/admin/session" && request.method === "GET") {
        return Response.json({ authenticated: await hasAdminSession(request, env) }, { headers: corsHeaders });
      }

      if (path === "/api/admin/logout" && request.method === "POST") {
        return Response.json({ success: true }, { headers: { ...corsHeaders, "Set-Cookie": sessionCookie("", 0) } });
      }

      if (path === "/api/admin/login" && request.method === "POST") {
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const now = Math.floor(Date.now() / 1000);
        const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND at > ?")
          .bind(ip, now - LOCKOUT_SECONDS).first();
        if (recent && Number(recent.n) >= MAX_FAILED_LOGINS) {
          return Response.json(
            { error: "Too many failed attempts. Please wait 15 minutes and try again." },
            { status: 429, headers: { ...corsHeaders, "Retry-After": String(LOCKOUT_SECONDS) } }
          );
        }

        const body = await readJson(request);
        const username = text(body.username, 256);
        const password = text(body.password, 256);

        const userOk = username === "kyuuji";
        const passwordOk = password === "kYu9j1@36t2P";

        if (!userOk || !passwordOk) {
          await env.DB.batch([
            env.DB.prepare("INSERT INTO login_attempts (ip, at) VALUES (?, ?)").bind(ip, now),
            env.DB.prepare("DELETE FROM login_attempts WHERE at < ?").bind(now - 24 * 60 * 60),
          ]);
          return Response.json({ error: "Invalid username or password." }, { status: 401, headers: corsHeaders });
        }

        await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
        
        const sessionTokenEnv = { SESSION_SECRET: env.SESSION_SECRET || "fallback-session-secret-key-12345" };
        const token = await createSessionToken(sessionTokenEnv);
        return Response.json({ success: true }, { headers: { ...corsHeaders, "Set-Cookie": sessionCookie(token, SESSION_SECONDS) } });
      }

      if (needsAdmin(request.method, path) && !(await hasAdminSession(request, env))) {
        return Response.json({ error: "Please log in as admin to do that." }, { status: 401, headers: corsHeaders });
      }

      if (path === "/api/commissions" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM commissions ORDER BY submittedAt DESC").all();
        const formatted = results.map((r) => {
          let references = [];
          try { references = JSON.parse(r.references || "[]"); } catch { references = []; }
          return { ...r, commercial: Boolean(r.commercial), priority: Boolean(r.priority), references };
        });
        return Response.json(formatted, { headers: corsHeaders });
      }

      if (path === "/api/commissions" && request.method === "POST") {
        const c = cleanCommission(await readJson(request));

        await env.DB.prepare(`
          INSERT INTO commissions (
            id, name, email, social, type, finish, characters, background,
            commercial, priority, dueDate, notes, "references", totalPhp,
            submittedAt, stage, discountCode, discountName, discountAmount,
            historyType, submittedToHistoryAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          c.id, c.name, c.email, c.social, c.type, c.finish, c.characters, c.background,
          c.commercial, c.priority, c.dueDate, c.notes, c.referencesJson, c.totalPhp,
          c.submittedAt, 0, c.discountCode, c.discountName, c.discountAmount,
          null, null
        ).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      const commission = path.match(/^\/api\/commissions\/(\d+)\/?$/);
      if (commission && request.method === "PUT") {
        const id = Number(commission[1]);
        const data = await readJson(request);
        const stage = Number(data.stage);
        if (!Number.isInteger(stage) || stage < 0 || stage > 20) throw new HttpError(400, "Invalid stage.");

        await env.DB.prepare(`
          UPDATE commissions
          SET stage = ?, historyType = ?, submittedToHistoryAt = ?
          WHERE id = ?
        `).bind(
          stage,
          data.historyType ? text(data.historyType, 40) : null,
          data.submittedToHistoryAt ? text(data.submittedToHistoryAt, 40) : null,
          id
        ).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (commission && request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM commissions WHERE id = ?").bind(Number(commission[1])).run();
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      const gallery = path.match(/^\/api\/gallery(?:\/(\d+)(\/images)?)?\/?$/);
      if (gallery) {
        const id = gallery[1] ? Number(gallery[1]) : null;
        const wantsImages = Boolean(gallery[2]);

        if (!id && request.method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT g.*, (SELECT COUNT(*) FROM gallery_images i WHERE i.galleryId = g.id) AS extraCount FROM gallery g ORDER BY g.id DESC"
          ).all();
          const rows = results.map(({ extraImages, extraCount, ...row }) => ({
            ...row,
            imageCount: (row.image ? 1 : 0) + Number(extraCount || 0),
          }));
          return Response.json(rows, { headers: corsHeaders });
        }

        if (id && wantsImages && request.method === "GET") {
          const cover = await env.DB.prepare("SELECT image FROM gallery WHERE id = ?").bind(id).all();
          if (!cover.results.length) {
            return Response.json({ error: "Gallery entry not found." }, { status: 404, headers: corsHeaders });
          }
          const extras = await env.DB.prepare("SELECT data FROM gallery_images WHERE galleryId = ? ORDER BY position").bind(id).all();
          const images = [cover.results[0].image, ...extras.results.map((row) => row.data)].filter(Boolean);
          return Response.json({ images }, { headers: corsHeaders });
        }

        if (!id && request.method === "POST") {
          const item = await readJson(request);
          const images = Array.isArray(item.images) && item.images.length ? item.images : item.image ? [item.image] : [];
          const problem = checkImages(images);
          if (problem) return Response.json({ error: problem }, { status: 413, headers: corsHeaders });

          const entryId = Number(item.id);
          const values = GALLERY_COLS.map((col) => (col === "image" ? images[0] : clean(col, item[col])));
          await env.DB.batch([
            env.DB.prepare(
              `INSERT INTO gallery (id, ${GALLERY_COLS.join(", ")}) VALUES (${["?", ...GALLERY_COLS.map(() => "?")].join(", ")})`
            ).bind(entryId, ...values),
            ...extraImageInserts(env, entryId, images),
          ]);
          return Response.json({ success: true }, { headers: corsHeaders });
        }

        if (id && !wantsImages && request.method === "PUT") {
          const item = await readJson(request);
          const replacing = Array.isArray(item.images);
          if (replacing) {
            const problem = checkImages(item.images);
            if (problem) return Response.json({ error: problem }, { status: 413, headers: corsHeaders });
          }

          const sent = GALLERY_COLS.filter((col) => col in item && !(replacing && col === "image"));
          const assignments = sent.map((col) => `${col} = ?`);
          const params = sent.map((col) => clean(col, item[col]));
          if (replacing) {
            assignments.push("image = ?");
            params.push(item.images[0]);
          }
          if (!assignments.length) {
            return Response.json({ error: "Nothing to update" }, { status: 400, headers: corsHeaders });
          }

          const statements = [env.DB.prepare(`UPDATE gallery SET ${assignments.join(", ")} WHERE id = ?`).bind(...params, id)];
          if (replacing) {
            statements.push(env.DB.prepare("DELETE FROM gallery_images WHERE galleryId = ?").bind(id));
            statements.push(...extraImageInserts(env, id, item.images));
          }
          await env.DB.batch(statements);
          return Response.json({ success: true }, { headers: corsHeaders });
        }

        if (id && !wantsImages && request.method === "DELETE") {
          await env.DB.batch([
            env.DB.prepare("DELETE FROM gallery_images WHERE galleryId = ?").bind(id),
            env.DB.prepare("DELETE FROM gallery WHERE id = ?").bind(id),
          ]);
          return Response.json({ success: true }, { headers: corsHeaders });
        }
      }

      const media = path.match(/^\/api\/(products|discounts)(?:\/(\d+))?\/?$/);
      if (media) {
        const table = media[1];
        const cols = MEDIA[table];
        const id = media[2] ? Number(media[2]) : null;

        if (!id && request.method === "GET") {
          const { results } = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
          return Response.json(results, { headers: corsHeaders });
        }

        if (!id && request.method === "POST") {
          const item = await readJson(request);
          await env.DB.prepare(
            `INSERT INTO ${table} (id, ${cols.join(", ")}) VALUES (${["?", ...cols.map(() => "?")].join(", ")})`
          ).bind(Number(item.id), ...cols.map((col) => clean(col, item[col]))).run();
          return Response.json({ success: true }, { headers: corsHeaders });
        }

        if (id && request.method === "PUT") {
          const item = await readJson(request);
          const sent = cols.filter((col) => col in item);
          if (!sent.length) {
            return Response.json({ error: "Nothing to update" }, { status: 400, headers: corsHeaders });
          }
          await env.DB.prepare(
            `UPDATE ${table} SET ${sent.map((col) => `${col} = ?`).join(", ")} WHERE id = ?`
          ).bind(...sent.map((col) => clean(col, item[col])), id).run();
          return Response.json({ success: true }, { headers: corsHeaders });
        }

        if (id && request.method === "DELETE") {
          await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
          return Response.json({ success: true }, { headers: corsHeaders });
        }
      }

      return Response.json({ error: `Route not found on worker: ${path}` }, {
        status: 404,
        headers: corsHeaders
      });
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.message }, { status: err.status, headers: corsHeaders });
      }
      console.error("API error:", err);
      const isAdmin = await hasAdminSession(request, env).catch(() => false);
      const message = isAdmin && err instanceof Error ? err.message : "Something went wrong on the server. Please try again.";
      return Response.json({ error: message }, { status: 500, headers: corsHeaders });
    }
  }
};