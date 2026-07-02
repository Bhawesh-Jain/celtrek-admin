type ApiResponse<T = any> = {
  status: boolean;
  data?: T;
  message?: string;
};

export class ApiClient {
  private baseUrl: string;
  private isServer: boolean;

  constructor(baseUrl: string = '/api') {
    // Check if we're running on server side
    this.isServer = typeof window === 'undefined';
    
    // For server-side calls, we need the full URL
    if (this.isServer) {
      const protocol = process.env.NODE_ENV === 'production' ? 'https://' : 'http://';
      const host = process.env.NEXT_PUBLIC_API_URL || 'localhost:3000';
      this.baseUrl = `${protocol}${host}${baseUrl}`;
    } else {
      this.baseUrl = baseUrl;
    }
  }

  private getAbsoluteUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  private async fetchWithError<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.getAbsoluteUrl(endpoint);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          status: false,
          message: `Error Processing Request. Code: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        status: false,
        message: 'Error Processing Request',
      };
    }
  }

  async post<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.fetchWithError<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetchWithError<T>(endpoint, {
      method: 'GET',
    });
  }
}
