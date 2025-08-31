
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

export const searchUsersByEmail = async (emailQuery: string) => {
  if (emailQuery.trim().length < 3) {
    return [];
  }
  const { data, error } = await supabase.rpc("search_users_by_email", {
    email_query: emailQuery,
  });

  if (error) {
    console.error("Search RPC returned an error:", error);
    throw error;
  }

  return (data || []).map((u: any) => ({
    id: u.id,
    first_name: u.raw_user_meta_data?.first_name || "Unknown",
    last_name: u.raw_user_meta_data?.last_name || "",
    email: u.email,
  }));
};

export const getUserProfilesByIds = async (userIds: string[]) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }
  const { data, error } = await supabase.rpc("get_user_profiles_by_ids", {
    user_ids: userIds,
  });

  if (error) {
    console.error("Error fetching user profiles:", error);
    throw error;
  }

  return (data || []).map((u: any) => ({
    id: u.id,
    first_name: u.raw_user_meta_data?.first_name || "U",
    last_name: u.raw_user_meta_data?.last_name || "",
    email: u.raw_user_meta_data?.email,
  }));
};
    