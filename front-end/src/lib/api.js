const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Default developer ID representing Sarah Mitchell from the seeded DB profiles.
// This allows testing the backend directly without requiring a live Supabase Auth login flow.
const DEFAULT_DEV_USER_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Custom fetch wrapper that automatically injects auth/dev headers and content-type.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If a real Supabase access token is saved in localStorage, attach it as Bearer
  const token = localStorage.getItem('supabase_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Only send dev header if not authenticated with Supabase
    headers['x-user-id'] = localStorage.getItem('kinship_dev_user_id') || DEFAULT_DEV_USER_ID;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * API Fetching Layer functions
 */
export const api = {
  // Profiles
  getMe: () => apiFetch('/profiles/me'),
  getCircle: () => apiFetch('/profiles/circle'),
  getUpcomingBirthdays: () => apiFetch('/profiles/upcoming-birthdays'),
  getProfile: (id) => apiFetch(`/profiles/${id}`),
  getProfileActivity: (id) => apiFetch(`/profiles/${id}/activity`),
  createProfile: (profileData) => apiFetch('/profiles', {
    method: 'POST',
    body: JSON.stringify(profileData),
  }),
  updateProfile: (id, profileData) => apiFetch(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
  createRelationship: (relationshipData) => apiFetch('/profiles/relationships', {
    method: 'POST',
    body: JSON.stringify(relationshipData),
  }),

  // Posts / Social Feed
  getPosts: () => apiFetch('/posts'),
  getPost: (id) => apiFetch(`/posts/${id}`),
  createPost: (content, imageUrl, type) => apiFetch('/posts', {
    method: 'POST',
    body: JSON.stringify({ content, image_url: imageUrl, type }),
  }),
  deletePost: (id) => apiFetch(`/posts/${id}`, {
    method: 'DELETE',
  }),
  addComment: (postId, text) => apiFetch(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),
  deleteComment: (postId, commentId) => apiFetch(`/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  }),
  toggleReaction: (postId, emoji) => apiFetch(`/posts/${postId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  }),

  // Heritage Vault / Timeline Events
  getHeritageEvents: () => apiFetch('/heritage'),
  getHeritageEvent: (id) => apiFetch(`/heritage/${id}`),
  createHeritageEvent: (eventData) => apiFetch('/heritage', {
    method: 'POST',
    body: JSON.stringify({
      title: eventData.title,
      description: eventData.description,
      event_date: eventData.eventDate || eventData.event_date,
      media_urls: eventData.mediaUrls || eventData.media_urls || [],
    }),
  }),
  deleteHeritageEvent: (id) => apiFetch(`/heritage/${id}`, {
    method: 'DELETE',
  }),

  // Family Events
  getEvents: () => apiFetch('/events'),
  getEvent: (id) => apiFetch(`/events/${id}`),
  createEvent: (eventData) => apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  }),
  updateEvent: (id, eventData) => apiFetch(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData)
  }),
  deleteEvent: (id) => apiFetch(`/events/${id}`, {
    method: 'DELETE'
  }),
  rsvpEvent: (eventId, status) => apiFetch(`/events/${eventId}/rsvp`, {
    method: 'POST',
    body: JSON.stringify({ status })
  }),
  votePollOption: (optionId) => apiFetch(`/events/options/${optionId}/vote`, {
    method: 'POST'
  }),

  // Connection Requests
  connectExistingByEmail: (email, relationshipType) => apiFetch('/profiles/connect-email', {
    method: 'POST',
    body: JSON.stringify({ email, relationship_type: relationshipType })
  }),
  getPendingRequests: () => apiFetch('/profiles/pending-requests'),
  respondToRequest: (id, action) => apiFetch(`/profiles/pending-requests/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action })
  }),
};
