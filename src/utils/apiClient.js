import { initialClients, initialPool } from '../data/profiles';
import { calculateCompatibility, generateEmailIntro } from './matchingAlgo';

const BASE_URL = 'https://data-crew-task.onrender.com/api';

// Helper to check if backend is online
async function checkBackend() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
    const res = await fetch(`${BASE_URL}/clients`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (e) {
    return false;
  }
}

export const apiClient = {
  // Fetch active clients
  getClients: async () => {
    try {
      const isOnline = await checkBackend();
      if (isOnline) {
        const res = await fetch(`${BASE_URL}/clients`);
        if (res.ok) {
          const data = await res.json();
          console.log('[API] Clients loaded from Express server.');
          return { data, mode: 'Full-Stack Backend' };
        }
      }
    } catch (e) {
      console.warn('[API] Express backend not responding. Falling back to Local Storage.');
    }

    // Fallback to local storage
    const stored = localStorage.getItem('tdc_clients');
    const data = stored ? JSON.parse(stored) : initialClients;
    if (!stored) {
      localStorage.setItem('tdc_clients', JSON.stringify(initialClients));
    }
    return { data, mode: 'Client-Side Local Storage' };
  },

  // Fetch complete matchmaking pool
  getPool: async () => {
    try {
      const isOnline = await checkBackend();
      if (isOnline) {
        const res = await fetch(`${BASE_URL}/pool`);
        if (res.ok) {
          const data = await res.json();
          console.log('[API] Pool profiles loaded from Express server.');
          return { data, mode: 'Full-Stack Backend' };
        }
      }
    } catch (e) {
      console.warn('[API] Express backend not responding. Falling back to Local Storage.');
    }

    // Fallback to local storage
    const stored = localStorage.getItem('tdc_pool');
    const data = stored ? JSON.parse(stored) : initialPool;
    if (!stored) {
      localStorage.setItem('tdc_pool', JSON.stringify(initialPool));
    }
    return { data, mode: 'Client-Side Local Storage' };
  },

  // Fetch scored and ranked matches for a client
  getMatches: async (client, poolList) => {
    try {
      const isOnline = await checkBackend();
      if (isOnline) {
        const res = await fetch(`${BASE_URL}/clients/${client.id}/matches`);
        if (res.ok) {
          const data = await res.json();
          return { data, mode: 'Full-Stack Backend' };
        }
      }
    } catch (e) {
      console.warn('[API] Express backend matches API error. Calculating locally.');
    }

    // Fallback client-side calculation
    const oppositeGenderPool = poolList.filter(p => p.gender !== client.gender);
    const scored = oppositeGenderPool.map(candidate => {
      const matchResult = calculateCompatibility(client, candidate);
      return {
        ...candidate,
        matchResult
      };
    }).sort((a, b) => b.matchResult.score - a.matchResult.score);

    return { data: scored, mode: 'Client-Side Local Calculation' };
  },

  // Update client's matchmaking journey stage
  updateStage: async (clientId, newStage, clientsList) => {
    try {
      const isOnline = await checkBackend();
      if (isOnline) {
        const res = await fetch(`${BASE_URL}/clients/${clientId}/stage`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: newStage })
        });
        if (res.ok) {
          const updatedClient = await res.json();
          return { updatedClient, mode: 'Full-Stack Backend' };
        }
      }
    } catch (e) {
      console.warn('[API] Express stage update error. Applying locally.');
    }

    // Fallback to local storage updates
    const timestamp = new Date().toISOString().split('T')[0];
    const newNote = {
      date: timestamp,
      text: `Matchmaker changed journey stage to: "${newStage}".`
    };
    
    const updatedList = clientsList.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          stage: newStage,
          notes: [newNote, ...(client.notes || [])]
        };
      }
      return client;
    });

    localStorage.setItem('tdc_clients', JSON.stringify(updatedList));
    const updatedClient = updatedList.find(c => c.id === clientId);
    return { updatedClient, mode: 'Client-Side Local Storage', fullList: updatedList };
  },

  // Add consultation meeting note
  addNote: async (clientId, text, clientsList) => {
    try {
      const isOnline = await checkBackend();
      if (isOnline) {
        const res = await fetch(`${BASE_URL}/clients/${clientId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        if (res.ok) {
          const updatedClient = await res.json();
          return { updatedClient, mode: 'Full-Stack Backend' };
        }
      }
    } catch (e) {
      console.warn('[API] Express notes logging error. Applying locally.');
    }

    // Fallback to local storage updates
    const timestamp = new Date().toISOString().split('T')[0];
    const newNote = {
      date: timestamp,
      text: text.trim()
    };

    const updatedList = clientsList.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          notes: [newNote, ...(client.notes || [])]
        };
      }
      return client;
    });

    localStorage.setItem('tdc_clients', JSON.stringify(updatedList));
    const updatedClient = updatedList.find(c => c.id === clientId);
    return { updatedClient, mode: 'Client-Side Local Storage', fullList: updatedList };
  },

  // Generate personalized email proposal draft
  generateEmail: async (client, match, apiKey) => {
    try {
      const isOnline = await checkBackend();
      if (isOnline) {
        const res = await fetch(`${BASE_URL}/match/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client, match, apiKey })
        });
        if (res.ok) {
          const data = await res.json();
          return { email: data.email, mode: data.mode };
        }
      }
    } catch (e) {
      console.warn('[API] Express email API error. Rendering locally.');
    }

    // Local fallback email text generator
    const email = await generateEmailIntro(client, match, apiKey);
    return { email, mode: apiKey ? 'OpenAI GPT-4o-mini' : 'Local NLG Engine' };
  },

  // Dispatch and log match suggestion invitation
  sendMatch: async (clientId, matchCandidate, clientsList) => {
    try {
      const isOnline = await checkBackend();
      if (isOnline) {
        const res = await fetch(`${BASE_URL}/match/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, matchCandidate })
        });
        if (res.ok) {
          const updatedClient = await res.json();
          return { updatedClient, mode: 'Full-Stack Backend' };
        }
      }
    } catch (e) {
      console.warn('[API] Express sendMatch log error. Applying locally.');
    }

    // Fallback client-side log
    const timestamp = new Date().toISOString().split('T')[0];
    const matchResult = calculateCompatibility(clientsList.find(c => c.id === clientId), matchCandidate);
    const newNote = {
      date: timestamp,
      text: `Suggested match sent: ${matchCandidate.fullName} (${matchCandidate.age}, ${matchCandidate.designation} in ${matchCandidate.city}). Compatibility Score: ${matchResult.score}%.`
    };

    const updatedList = clientsList.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          notes: [newNote, ...(client.notes || [])]
        };
      }
      return client;
    });

    localStorage.setItem('tdc_clients', JSON.stringify(updatedList));
    const updatedClient = updatedList.find(c => c.id === clientId);
    return { updatedClient, mode: 'Client-Side Local Storage', fullList: updatedList };
  }
};
