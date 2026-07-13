import { supabase } from '../supabase/supabaseClient';

/**
 * Mark a story as read in the reading_progress table
 * @param {string} userId - The Supabase user UUID
 * @param {string} storyId - The ID of the story read
 */
export const markStoryAsRead = async (userId, storyId) => {
  const { error } = await supabase
    .from('reading_progress')
    .upsert(
      {
        user_id: userId,
        story_id: storyId,
        completed: true,
        completed_at: new Date().toISOString()
      },
      { onConflict: 'user_id, story_id' }
    );

  if (error) {
    console.error("Error updating reading progress:", error);
    throw error;
  }
};
