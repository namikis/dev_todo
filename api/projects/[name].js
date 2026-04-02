import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../_lib/auth.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  try {
    const name = req.query.name;
    if (!name) return res.status(400).json({ error: "name is required" });

    if (req.method === "DELETE") {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { error, count } = await supabase
        .from("projects")
        .delete({ count: "exact" })
        .eq("name", name);
      if (error) throw new Error(error.message);
      return res.json({ deleted: (count ?? 0) > 0 });
    }
    res.status(405).end("method not allowed");
  } catch (err) {
    res.status(500).end(err.message);
  }
}
