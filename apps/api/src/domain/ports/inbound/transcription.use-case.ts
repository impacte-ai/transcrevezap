import { AudioMessage } from '../../entities/audio-message.entity';
import { TranscriptionEntity } from '../../entities/transcription.entity';

export interface TranscriptionUseCase {
  process(message: AudioMessage): Promise<TranscriptionEntity>;
}

export const TRANSCRIPTION_USE_CASE = Symbol('TranscriptionUseCase');
