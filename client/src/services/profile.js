import { supabase } from '../supabase/supabaseClient';

/**
 * Fetch a user profile from Supabase Postgres
 * @param {string} uid 
 */
export const getUserProfile = async (uid) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
};

/**
 * Create a new user profile in Supabase Postgres
 * @param {string} uid 
 * @param {Object} data - Minimal fields required on creation
 */
export const createUserProfile = async (uid, data) => {
  const { error } = await supabase
    .from('users')
    .upsert([{
      id: uid,
      uid,
      profileComplete: false,
      ...data
    }]);

  if (error) throw error;
};

/**
 * Update an existing user profile in Supabase Postgres
 * @param {string} uid 
 * @param {Object} data - Fields to update
 */
export const updateUserProfile = async (uid, data) => {
  const { error } = await supabase
    .from('users')
    .update(data)
    .eq('id', uid);

  if (error) throw error;
};
