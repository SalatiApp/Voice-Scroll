export type CommandType = 'NEXT' | 'PREVIOUS' | 'STOP' | 'RESUME' | 'PAUSE' | 'PLAY' | 'NONE';

export interface CommandDefinition {
  type: CommandType;
  titleAr: string;
  titleEn: string;
  gesture: string;
  direction: 'up' | 'down' | 'stop' | 'resume' | 'tap';
}

export interface CustomAlias {
  id: string;
  phrase: string;
  command: CommandType;
}

export interface RecognitionLog {
  id: string;
  timestamp: string;
  rawText: string;
  matchedCommand: CommandType;
  matchedAlias: string;
  success: boolean;
}

export interface VideoItem {
  id: number;
  creator: string;
  handle: string;
  avatar: string;
  caption: string;
  music: string;
  likes: string;
  comments: string;
  shares: string;
  bgGradient: string;
  tag: string;
}
