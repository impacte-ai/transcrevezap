export interface MediaDownloadResult {
  buffer: Buffer;
  mimetype: string;
}

export interface MediaPort {
  downloadAudio(messageId: string): Promise<MediaDownloadResult>;
  getBase64Audio(messageId: string): Promise<MediaDownloadResult>;
}

export const MEDIA_PORT = Symbol('MediaPort');
