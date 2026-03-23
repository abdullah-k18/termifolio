import { supabase } from "./supabase";

export interface Profile {
  id: string;
  username: string;
  name: string;
  ascii_art: string;
  about: string;
  skills: string[];
  email: string;
  phone: string;
  social_links: Record<string, string>;
  created_at: string;
}

export async function getProfile(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function usernameExists(username: string): Promise<boolean> {
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("username", username.toLowerCase());

  return (count ?? 0) > 0;
}

export async function createProfile(
  data: Omit<Profile, "id" | "created_at">
): Promise<Profile> {
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ ...data, username: data.username.toLowerCase() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created as Profile;
}
