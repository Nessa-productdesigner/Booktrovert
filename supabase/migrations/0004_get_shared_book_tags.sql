CREATE OR REPLACE FUNCTION get_shared_book_tags(share_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_book_id TEXT;
  v_context_tags JSONB;
BEGIN
  -- 1. Find the valid share link
  SELECT user_id, book_id INTO v_user_id, v_book_id
  FROM share_links
  WHERE token = share_token
    AND (expires_at IS NULL OR expires_at > NOW());

  -- If no valid link found, return null
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Fetch the tags from userbooks (bypassing RLS because of SECURITY DEFINER)
  SELECT context_tags INTO v_context_tags
  FROM userbooks
  WHERE user_id = v_user_id AND book_id = v_book_id;

  RETURN v_context_tags;
END;
$$;
