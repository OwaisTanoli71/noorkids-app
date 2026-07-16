const API_URL = "http://localhost:5000/api";

/**
 * Returns the URL to stream the audio for a specific story.
 * The <audio> element handles the actual fetching and HTTP Range requests.
 * @param {string} storyId 
 * @returns {string} The full streaming URL
 */
export const getStoryAudioUrl = (storyId) => {
  return `${API_URL}/stories/${storyId}/audio?v=6`;
};

export const getStoryTimingUrl = (storyId) => {
  return `${API_URL}/stories/${storyId}/timing?t=${Date.now()}`;
};
