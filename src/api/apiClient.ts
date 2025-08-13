// API client for encrypted book data with authentication
import { appLog } from '../auth/fileLogger';

// API base URL - update this to match your backend
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export class ApiClient {
  private accessToken: string | null = null;
  private deviceId: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (this.deviceId) {
      headers['X-Device-Id'] = this.deviceId;
    }

    try {
      appLog.debug('api-client', `Making request to ${endpoint}`, { method: options.method || 'GET' });
      
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        appLog.error('api-client', `API request failed: ${response.status}`, { endpoint, error: errorText });
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      appLog.debug('api-client', `Request successful: ${endpoint}`);
      return data;
    } catch (error) {
      appLog.error('api-client', `Request error for ${endpoint}`, error);
      throw error;
    }
  }

  // User endpoints
  async getMe() {
    return this.makeRequest('/users/me');
  }

  async updateUserKeys(userKeyWraps: { recovery: string }) {
    return this.makeRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ userKeyWraps })
    });
  }

  // Book endpoints
  async getUserBooks() {
    return this.makeRequest('/books/userbooks');
  }

  async getBook(bookId: string) {
    return this.makeRequest(`/books/${bookId}`);
  }

  async putBook(bookId: string, bookData: any) {
    return this.makeRequest(`/books/${bookId}`, {
      method: 'PUT',
      body: JSON.stringify(bookData)
    });
  }

  async createBook(bookData: any) {
    return this.makeRequest('/books', {
      method: 'POST',
      body: JSON.stringify(bookData)
    });
  }

  // Version endpoints
  async getVersion(bookId: string, versionId: string) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}`);
  }

  async putVersion(bookId: string, versionId: string, versionData: any) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}`, {
      method: 'PUT',
      body: JSON.stringify(versionData)
    });
  }

  async createVersion(bookId: string, versionData: any) {
    return this.makeRequest(`/books/${bookId}/versions`, {
      method: 'POST',
      body: JSON.stringify(versionData)
    });
  }

  // Chapter endpoints
  async getChapter(bookId: string, versionId: string, chapterId: string) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}`);
  }

  async putChapter(bookId: string, versionId: string, chapterId: string, chapterData: any) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(chapterData)
    });
  }

  // Scene endpoints
  async getScene(bookId: string, versionId: string, chapterId: string, sceneId: string) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}/scenes/${sceneId}`);
  }

  async putScene(bookId: string, versionId: string, chapterId: string, sceneId: string, sceneData: {
    sceneId: string;
    encScheme: 'udek' | 'bsk';
    contentEnc: string;
    contentIv: string;
    revLocal: string;
    prevCloudRev?: string;
    updatedAt: number;
  }) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}/scenes/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify(sceneData)
    });
  }

  // Bulk content operations
  async putVersionContent(bookId: string, versionId: string, contentData: any) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/content`, {
      method: 'PUT',
      body: JSON.stringify(contentData)
    });
  }

  async putPlotArcs(bookId: string, versionId: string, plotArcsData: any) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/plotArcs`, {
      method: 'PUT',
      body: JSON.stringify(plotArcsData)
    });
  }

  async putCharacters(bookId: string, versionId: string, charactersData: any) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/characters`, {
      method: 'PUT',
      body: JSON.stringify(charactersData)
    });
  }

  async putWorldBuilding(bookId: string, versionId: string, worldBuildingData: any) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/worldBuilding`, {
      method: 'PUT',
      body: JSON.stringify(worldBuildingData)
    });
  }

  // Chapter management endpoints
  async getChapters(bookId: string, versionId: string) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters`);
  }

  async createChapter(bookId: string, versionId: string, chapterData: {
    id?: string; // Allow client-generated ID
    title: string;
    position: number;
    linkedActId?: string;
    linkedOutlineId?: string;
  }) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(chapterData)
    });
  }

  async updateChapter(bookId: string, versionId: string, chapterId: string, chapterData: any) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(chapterData)
    });
  }

  async deleteChapter(bookId: string, versionId: string, chapterId: string) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}`, {
      method: 'DELETE'
    });
  }

  // Plot structure endpoints - now returns narrative flow data
  async getPlotNodes(bookId: string, versionId: string): Promise<{ nodes: any[]; edges: any[] }> {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/plotCanvas`);
  }

  async createPlotNode(bookId: string, versionId: string, plotNodeData: {
    id?: string; // Allow client-generated ID
    type: 'outline' | 'act' | 'chapter' | 'scene';
    title: string;
    description?: string;
    parentId?: string;
    position: number;
  }) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/plotCanvas`, {
      method: 'POST',
      body: JSON.stringify(plotNodeData)
    });
  }

  // Revision management
  async saveRevision(bookId: string, versionId: string, chapterId: string, revisionData: {
    id?: string; // Allow client-generated ID
    content: any;
    isMinor: boolean;
    message?: string;
  }) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}/revisions`, {
      method: 'POST',
      body: JSON.stringify(revisionData)
    });
  }

  async getRevisions(bookId: string, versionId: string, chapterId: string) {
    return this.makeRequest(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}/revisions`);
  }

  // Sharing endpoints
  async createGrant(bookId: string, grantData: {
    id?: string; // Allow client-generated ID
    collaboratorUserId: string;
    perms: string;
    bskWrapForCollab: string;
  }) {
    return this.makeRequest(`/books/${bookId}/grants`, {
      method: 'POST',
      body: JSON.stringify(grantData)
    });
  }

  async getGrants() {
    return this.makeRequest('/grants');
  }

  async revokeGrant(bookId: string, grantId: string) {
    return this.makeRequest(`/books/${bookId}/grants/${grantId}`, {
      method: 'DELETE'
    });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
