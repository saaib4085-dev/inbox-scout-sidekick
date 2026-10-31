import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data, error } = await supabase.from("credit_wallets").select("*").maybeSingle();
      if (error) throw error;
      const w = data ?? {
        plan: "free",
        subscription_credits: 0,
        bonus_credits: 0,
        topup_credits: 0,
        period_end: null,
      };
      const expired = w.period_end && new Date(w.period_end) < new Date();
      const subscription = expired ? 0 : w.subscription_credits;
      return {
        plan: w.plan as "free" | "pro" | "business",
        periodEnd: w.period_end,
        subscription,
        bonus: w.bonus_credits,
        topup: w.topup_credits,
        total: subscription + w.bonus_credits + w.topup_credits,
      };
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useLedger(limit = 500) {
  return useQuery({
    queryKey: ["ledger", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });
}

export function useOutbox() {
  return useQuery({
    queryKey: ["outbox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbox")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
}

export function useDrafts() {
  return useQuery({
    queryKey: ["drafts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drafts")
        .select("id, mode, tone, strategy, sender, created_at, options")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
}
