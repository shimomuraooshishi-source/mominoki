// =============================================
// Supabase 接続設定
// =============================================

const SUPABASE_URL = 'https://fewahdqscldxnzpdlrwb.supabase.co';  //
const SUPABASE_KEY = 'sb_publishable_LvFpq99umR3ngFIWrWIUGQ_4R8mGWGT';  //

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
