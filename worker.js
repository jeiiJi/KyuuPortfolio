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

      // --- GALLERY ---
      if (path === "/api/gallery" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM gallery ORDER BY id DESC").all();
        return Response.json(results, { headers: corsHeaders });
      }

      if (path === "/api/gallery" && request.method === "POST") {
        const item = await request.json();
        await env.DB.prepare(`
          INSERT INTO gallery (id, title, description, image, category, scope, service, colorFinish, publishedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.id, item.title, item.description || "", item.image || "", 
          item.category, item.scope || "", item.service || "", 
          item.colorFinish || "", item.publishedAt
        ).run();
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (path.startsWith("/api/gallery/") && request.method === "DELETE") {
        const id = path.split("/")[3];
        await env.DB.prepare("DELETE FROM gallery WHERE id = ?").bind(id).run();
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // --- SHOP PRODUCTS ---
      if (path === "/api/products" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM products ORDER BY id DESC").all();
        return Response.json(results, { headers: corsHeaders });
      }

      if (path === "/api/products" && request.method === "POST") {
        const item = await request.json();
        await env.DB.prepare(`
          INSERT INTO products (id, title, description, image, category, price, publishedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.id, item.title, item.description || "", item.image || "", 
          item.category, item.price || 0, item.publishedAt
        ).run();
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (path.startsWith("/api/products/") && request.method === "DELETE") {
        const id = path.split("/")[3];
        await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // --- DISCOUNTS ---
      if (path === "/api/discounts" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM discounts ORDER BY id DESC").all();
        return Response.json(results, { headers: corsHeaders });
      }

      if (path === "/api/discounts" && request.method === "POST") {
        const item = await request.json();
        await env.DB.prepare(`
          INSERT INTO discounts (id, title, percentage, requirementType, description, startDate, endDate, bannerImage, code)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.id, item.title, item.percentage, item.requirementType || "Any", 
          item.description || "", item.startDate || "", item.endDate || "", 
          item.bannerImage || "", item.code
        ).run();
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (path.startsWith("/api/discounts/") && request.method === "DELETE") {
        const id = path.split("/")[3];
        await env.DB.prepare("DELETE FROM discounts WHERE id = ?").bind(id).run();
        return Response.json({ success: true }, { headers: corsHeaders });
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