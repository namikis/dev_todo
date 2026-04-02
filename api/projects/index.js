import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../_lib/auth.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return res.json({ projects: data ?? [] });
    }
    if (req.method === "POST") {
      const user = await requireAuth(req, res);
      if (!user) return;
      const name = (req.body.name ?? "").trim();
      if (!name) return res.status(400).json({ error: "name is required" });
      const { data, error } = await supabase
        .from("projects")
        .upsert({ name }, { onConflict: "name" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return res.json({ project: data });
    }
    res.status(405).end("method not allowed");
  } catch (err) {
    res.status(500).end(err.message);
  }
}
