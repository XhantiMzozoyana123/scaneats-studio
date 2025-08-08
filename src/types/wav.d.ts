
declare module 'wav' {
  import { Transform } from 'stream';

  interface WriterOptions {
    channels?: number;
    sampleRate?: number;
    bitDepth?: number;
  }

  export class Writer extends Transform {
    constructor(options?: WriterOptions);
  }
}
