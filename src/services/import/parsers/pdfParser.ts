import { ParsedBook } from '../../../types';

/**
 * PDF text extraction requires native tooling.
 * Phase 2 may add a backend or native module — for now we surface a clear error.
 */
export async function parsePdf(_base64: string, _fileName: string): Promise<ParsedBook> {
  throw new Error(
    'PDF import is not yet supported on device. Please use TXT or EPUB for now.',
  );
}
