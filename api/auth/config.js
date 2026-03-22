export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("method not allowed");
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
}
