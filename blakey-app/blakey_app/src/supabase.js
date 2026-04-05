import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ROW_ID = "blakey_family";

export async function loadChecked() {
  const { data } = await supabase
    .from("progress")
    .select("checked")
    .eq("id", ROW_ID)
    .single();
  return data?.checked ?? {};
}

export async function saveChecked(checked) {
  await supabase
    .from("progress")
    .update({ checked, updated_at: new Date().toISOString() })
    .eq("id", ROW_ID);
}
