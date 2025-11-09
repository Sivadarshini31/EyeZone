
export enum ContrastMode {
  Light = 'theme-light',
  Dark = 'theme-dark',
  YellowDark = 'theme-yellow-dark',
  BlueDark = 'theme-blue-dark',
}

export enum Language {
  English = 'en-US',
  Tamil = 'ta-IN',
}

export enum ReadingRate {
  Slow = 0.75,
  Normal = 1,
  Fast = 1.5,
}

export type AppFile = {
  name: string;
  type: 'image' | 'pdf';
  content: string; // base64 for images
};

export type ProcessedData = {
  file: AppFile;
  extractedText: string;
};

export type HighlightInfo = {
  startIndex: number;
  endIndex: number;
};

export type Command = {
  keywords: string[];
  callback: () => void;
  feedback: string; // The text to speak upon execution
};