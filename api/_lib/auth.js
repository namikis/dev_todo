import { createClient } from "@supabase/supabase-js";

export async function requireAuth(req, res) {
  const token = (req.headers.authorization ?? "").replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return user;
}
