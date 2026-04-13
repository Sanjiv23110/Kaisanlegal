import { api } from './api';

export interface UploadStatus {
  allowed: boolean;
  remaining: number;
  tier: string;
  message: string;
}

export class DocumentUploadManager {
  static async checkUploadAllowed(): Promise<UploadStatus> {
    try {
      return await api.checkUploadLimit();
    } catch (error: any) {
      console.error('Error checking upload limit:', error);
      throw error;
    }
  }

  static async uploadDocument(file: File): Promise<any> {
    try {
      // First check if upload is allowed
      const status = await this.checkUploadAllowed();
      
      if (!status.allowed) {
        throw new Error(status.message);
      }

      // Upload document with rate limiting
      const result = await api.uploadDocumentWithLimit(file);
      return result;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  static getRemainingUploads(remaining: number, tier: string): string {
    if (tier === 'premium') {
      return '∞ uploads remaining this month';
    }
    const plural = remaining === 1 ? 'upload' : 'uploads';
    return `${remaining} ${plural} remaining this month`;
  }

  static getUploadMessage(tier: string, remaining: number, uploaded: number): string {
    if (tier === 'premium') {
      return 'You can upload unlimited documents this month';
    }
    if (remaining === 0) {
      return 'You\'ve reached your monthly upload limit. Upgrade to premium for unlimited uploads.';
    }
    const plural = remaining === 1 ? 'upload' : 'uploads';
    return `You have ${remaining} ${plural} remaining this month (${uploaded}/5 used)`;
  }
}
