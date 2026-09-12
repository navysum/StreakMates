-- ============================================================================
-- Prevent username enumeration
--
-- A public availability RPC lets an authenticated user test arbitrary handles
-- at scale. The client now makes a claim directly; the unique index remains
-- the authority and a failed claim deliberately does not identify an owner.
-- ============================================================================

revoke all on function public.username_available(text) from public, anon, authenticated;

