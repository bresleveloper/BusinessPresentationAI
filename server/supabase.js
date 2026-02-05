const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize credits for new user (called after signup)
async function initializeUserCredits(userId) {
  // Check if user already has credits
  const { data: existing } = await supabase
    .from('user_credits')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return; // Already initialized
  }

  // Create credits record with 3 free credits
  await supabase.from('user_credits').insert({
    user_id: userId,
    credits: 3
  });

  // Log the signup bonus transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: 3,
    reason: 'signup_bonus'
  });
}

// Get user's current credits
async function getUserCredits(userId) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return 0;
  }
  return data.credits;
}

// Deduct one credit for generation
async function deductCredit(userId) {
  const currentCredits = await getUserCredits(userId);

  if (currentCredits < 1) {
    return { success: false, error: 'insufficient_credits' };
  }

  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      credits: currentCredits - 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Log the transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -1,
    reason: 'generation'
  });

  return { success: true, remainingCredits: currentCredits - 1 };
}

// Verify JWT token and get user
async function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

module.exports = {
  supabase,
  initializeUserCredits,
  getUserCredits,
  deductCredit,
  verifyToken
};
