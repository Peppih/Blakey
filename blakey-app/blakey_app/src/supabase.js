import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ROW_ID = "blakey_family";

export async function loadChecked() {
  const { data, error } = await supabase
    .from("progress")
    .select("checked")
    .eq("id", ROW_ID)
    .single();
  if (error) console.error("loadChecked error:", error);
  console.log("loadChecked data:", data);
  return data?.checked ?? {};
}

export async function saveChecked(checked) {
  const { error } = await supabase
    .from("progress")
    .update({ checked, updated_at: new Date().toISOString() })
    .eq("id", ROW_ID);
  if (error) console.error("saveChecked error:", error);
  else console.log("saveChecked ok:", Object.keys(checked).length, "items");
}
