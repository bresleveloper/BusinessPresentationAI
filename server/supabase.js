const { createClient } = require('@supabase/supabase-js');
const { logError, logInfo } = require('./logger.js');
const crypto = require('crypto');

function generateUUID() {
  return crypto.randomUUID();
}

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

// Save or update user session
async function saveUserSession(userId, sessionId, data) {
  try {
    // Check if session already exists
    const { data: existing, error: selectError } = await supabase
      .from('user_sessions')
      .select('id, business_profile, conversation, presentations')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is OK
      logError('saveUserSession - SELECT', selectError);
      return false;
    }

    if (existing) {
      // Update existing session - merge with existing data
      const mergedData = {
        business_profile: data.business_profile || existing.business_profile,
        conversation: data.conversation || existing.conversation,
        presentations: data.presentations || existing.presentations
      };

      const { error } = await supabase
        .from('user_sessions')
        .update(mergedData)
        .eq('id', existing.id);

      if (error) {
        logError('saveUserSession - UPDATE', error);
        return false;
      }
      return true;
    } else {
      // Insert new session - generate UUID manually
      const recordId = generateUUID();
      const { data: insertData, error } = await supabase
        .from('user_sessions')
        .insert({
          id: recordId,
          user_id: userId,
          session_id: sessionId,
          ...data
        })
        .select();

      if (error) {
        logError('saveUserSession - INSERT', error);
        return false;
      }
      return true;
    }
  } catch (err) {
    logError('saveUserSession - EXCEPTION', err);
    return false;
  }
}

// Get user's sessions
async function getUserSessions(userId) {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logError('getUserSessions', error);
      return [];
    }
    return data || [];
  } catch (err) {
    logError('getUserSessions - EXCEPTION', err);
    return [];
  }
}

// Get specific session
async function getSession(userId, sessionId) {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

// Delete user session
async function deleteUserSession(userId, sessionId) {
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', sessionId);

  return !error;
}

// Save rating for a presentation
async function saveRating(userId, sessionId, style, rating, feedback = null) {
  try {
    // Check if user already rated this presentation
    const { data: existing, error: selectError } = await supabase
      .from('presentation_ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .eq('style', style)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      logError('saveRating - SELECT', selectError);
      return false;
    }

    if (existing) {
      // Update existing rating
      const { error } = await supabase
        .from('presentation_ratings')
        .update({ rating, feedback })
        .eq('id', existing.id);

      if (error) {
        logError('saveRating - UPDATE', error);
        return false;
      }
      return true;
    } else {
      // Insert new rating with generated UUID
      const recordId = generateUUID();
      const { error } = await supabase
        .from('presentation_ratings')
        .insert({
          id: recordId,
          user_id: userId,
          session_id: sessionId,
          style,
          rating,
          feedback
        });

      if (error) {
        logError('saveRating - INSERT', error);
        return false;
      }
      return true;
    }
  } catch (err) {
    logError('saveRating - EXCEPTION', err);
    return false;
  }
}

// Get rating for a specific presentation
async function getRating(userId, sessionId, style) {
  const { data, error } = await supabase
    .from('presentation_ratings')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .eq('style', style)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

module.exports = {
  supabase,
  initializeUserCredits,
  getUserCredits,
  deductCredit,
  verifyToken,
  saveUserSession,
  getUserSessions,
  getSession,
  deleteUserSession,
  saveRating,
  getRating
};
