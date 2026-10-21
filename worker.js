const MEDIA = {
  products: ["title", "description", "image", "category", "price", "publishedAt", "artStyle", "scope", "service", "colorFinish", "dateMade", "tools", "format"],
  discounts: ["title", "percentage", "requirementType", "description", "startDate", "endDate", "bannerImage", "code", "artStyle", "scope", "service", "colorFinish"],
};
// Gallery entries have their own handler below: the cover image lives in gallery.image and the rest of the set
// lives one-per-row in gallery_images, so an entry can total 10 MB even though a D1 row tops out at 2 MB.
const GALLERY_COLS = ["title", "description", "image", "category", "scope", "service", "colorFinish", "publishedAt", "artStyle", "dateMade", "tools", "format"];

const NUMERIC = new Set(["price", "percentage"]);
const DEFAULTS = { requirementType: "Any" };
const clean = (col, value) =>
  NUMERIC.has(col) ? Number(value) || 0 : value ?? DEFAULTS[col] ?? "";

const MAX_ENTRY_BYTES = 10 * 1024 * 1024; // all images of one gallery entry, combined
const MAX_IMAGE_BYTES = 1_900_000;        // a single image still has to fit in one D1 row (2 MB)
const ROWS_PER_INSERT = 4;                // keeps every statement small

// Real size of a data URL (what base64 decodes to). Anything else counts by its text length.
const imageBytes = (src) => {
  const comma = src.indexOf(",");
  if (!src.startsWith("data:") || comma === -1) return src.length;
  const base64 = src.slice(comma + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};
const megabytes = (bytes) => (bytes / (1024 * 1024)).toFixed(1);

// Returns an error message, or "" when the set is fine.
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

// INSERT statements for the extra images (position 1 and up; the cover is position 0 and lives in gallery.image).
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // --- COMMISSIONS ---
      if (path === "/api/commissions" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM commissions ORDER BY submittedAt DESC").all();
        const formatted = results.map(r => ({
          ...r,
          commercial: Boolean(r.commercial),
          priority: Boolean(r.priority),
          references: JSON.parse(r.references || "[]")
        }));
        return Response.json(formatted, { headers: corsHeaders });
      }

      if (path === "/api/commissions" && request.method === "POST") {
        const data = await request.json();
        
        await env.DB.prepare(`
          INSERT INTO commissions (
            id, name, email, social, type, finish, characters, background, 
            commercial, priority, dueDate, notes, "references", totalPhp, 
            submittedAt, stage, discountCode, discountName, discountAmount, 
            historyType, submittedToHistoryAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.id,
          data.name,
          data.email,
          data.social || "",
          data.type,
          data.finish || "",
          data.characters || 1,
          data.background || "",
          data.commercial ? 1 : 0,
          data.priority ? 1 : 0,
          data.dueDate || "",
          data.notes || "",
          JSON.stringify(data.references || []),
          data.totalPhp || 0,
          data.submittedAt,
          data.stage || 0,
          data.discountCode || null,
          data.discountName || null,
          data.discountAmount || 0,
          data.historyType || null,
          data.submittedToHistoryAt || null
        ).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (path.startsWith("/api/commissions/") && request.method === "PUT") {
        const id = path.split("/")[3];
        const data = await request.json();
        
        await env.DB.prepare(`
          UPDATE commissions 
          SET stage = ?, historyType = ?, submittedToHistoryAt = ? 
          WHERE id = ?
        `).bind(
          data.stage, 
          data.historyType || null, 
          data.submittedToHistoryAt || null, 
          id
        ).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (path.startsWith("/api/commissions/") && request.method === "DELETE") {
        const id = path.split("/")[3];
        await env.DB.prepare("DELETE FROM commissions WHERE id = ?").bind(id).run();
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // --- GALLERY (cover + image set) ---
      const gallery = path.match(/^\/api\/gallery(?:\/(\d+)(\/images)?)?\/?$/);
      if (gallery) {
        const id = gallery[1] ? Number(gallery[1]) : null;
        const wantsImages = Boolean(gallery[2]);

        // List: covers only, plus how many images each entry has. Full sets load on demand below.
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

        // Every image of one entry, in order (cover first).
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
          const item = await request.json();
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
          const item = await request.json();
          const replacing = Array.isArray(item.images);
          if (replacing) {
            const problem = checkImages(item.images);
            if (problem) return Response.json({ error: problem }, { status: 413, headers: corsHeaders });
          }

          // Only update the fields that were sent. When a new image set is sent, it also replaces the cover.
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

      // --- SHOP PRODUCTS + DISCOUNTS (shared CRUD) ---
      const media = path.match(/^\/api\/(products|discounts)(?:\/(\d+))?\/?$/);
      if (media) {
        const table = media[1];          // safe: matched against a fixed whitelist by the regex
        const cols = MEDIA[table];
        const id = media[2] ? Number(media[2]) : null;

        if (!id && request.method === "GET") {
          const { results } = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
          return Response.json(results, { headers: corsHeaders });
        }

        if (!id && request.method === "POST") {
          const item = await request.json();
          await env.DB.prepare(
            `INSERT INTO ${table} (id, ${cols.join(", ")}) VALUES (${["?", ...cols.map(() => "?")].join(", ")})`
          ).bind(Number(item.id), ...cols.map((col) => clean(col, item[col]))).run();
          return Response.json({ success: true }, { headers: corsHeaders });
        }

        if (id && request.method === "PUT") {
          const item = await request.json();
          // Only update the fields that were actually sent, so nothing gets blanked by accident.
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
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ error: message }, {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};