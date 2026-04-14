export const getAuthToken = () => localStorage.getItem('access_token');
export const setAuthToken = (token: string) => localStorage.setItem('access_token', token);
export const removeAuthToken = () => localStorage.removeItem('access_token');

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.detail)) {
        errorMsg = errorData.detail.map((err: any) => err.msg).join(', ');
      } else {
        errorMsg = errorData.detail || errorMsg;
      }
    } catch {
      errorMsg = response.statusText;
    }
    throw new APIError(response.status, errorMsg as string);
  }
  
  return response.json();
}

export const api = {
  async login(email: string, password: string) {
    const data = await fetchWithAuth('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  async signup(email: string, password: string, name?: string) {
    return fetchWithAuth('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  async getMe() {
    return fetchWithAuth('/api/me', {
      method: 'GET',
    });
  },

  logout() {
    removeAuthToken();
  },

  async analyzeLegalDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    // For FormData, we don't set Content-Type header (browser sets it with boundary)
    const token = getAuthToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch('/api/analyze-legal', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await response.json();
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((err: any) => err.msg).join(', ');
        } else {
          errorMsg = errorData.detail || errorMsg;
        }
      } catch {
        errorMsg = response.statusText;
      }
      throw new APIError(response.status, errorMsg as string);
    }
    
    return response.json();
  },

  async chat(messages: { sender: string; message: string }[], documentContext?: any) {
    return fetchWithAuth('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, documentContext }),
    });
  },

  async legalQuery(query: string, documentContext?: string) {
    return fetchWithAuth('/api/legal-query', {
      method: 'POST',
      body: JSON.stringify({ query, documentContext }),
    });
  },

  async getSubscriptionPlans() {
    return fetchWithAuth('/api/subscription/plans', {
      method: 'GET',
    });
  },

  async getUserTier() {
    return fetchWithAuth('/api/user/tier', {
      method: 'GET',
    });
  },

  async checkUploadLimit() {
    return fetchWithAuth('/api/upload/check', {
      method: 'GET',
    });
  },

  async uploadDocumentWithLimit(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getAuthToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch('/api/upload/document-with-limit', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await response.json();
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((err: any) => err.msg).join(', ');
        } else {
          errorMsg = errorData.detail || errorMsg;
        }
      } catch {
        errorMsg = response.statusText;
      }
      throw new APIError(response.status, errorMsg as string);
    }
    
    return response.json();
  },

  async processPayment(planName: string, cardNumber: string, cardExpiry: string, cardCvv: string) {
    return fetchWithAuth('/api/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({
        plan_name: planName,
        card_number: cardNumber,
        card_expiry: cardExpiry,
        card_cvv: cardCvv,
      }),
    });
  },

  async getSubscriptionHistory() {
    return fetchWithAuth('/api/subscription/history', {
      method: 'GET',
    });
  },

  async updateProfile(data: {
    name?: string;
    current_password?: string;
    new_password?: string;
    confirm_password?: string;
  }) {
    return fetchWithAuth('/api/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getNotifications() {
    return fetchWithAuth('/api/user/notifications', {
      method: 'GET',
    });
  },

  async dismissNotification(notificationId: number) {
    return fetchWithAuth(`/api/user/notifications/${notificationId}/dismiss`, {
      method: 'POST',
    });
  },

  async getUploadCycle() {
    return fetchWithAuth('/api/user/upload-cycle', {
      method: 'GET',
    });
  },
};
