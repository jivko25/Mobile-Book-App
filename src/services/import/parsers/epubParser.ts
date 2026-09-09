import JSZip from 'jszip';
import { ParsedBook, ParsedChapter, ParsedCoverImage } from '../../../types';

interface ManifestItem {
  href: string;
  mediaType: string;
  properties: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m?.[1]?.trim() ?? '';
}

function extractAttr(block: string, attr: string): string {
  const re = new RegExp(`${attr}=["']([^"']+)["']`, 'i');
  return block.match(re)?.[1] ?? '';
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function resolvePath(base: string, href: string): string {
  if (href.startsWith('/')) return href.slice(1);
  const baseDir = base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : '';
  const parts = (baseDir + href).split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') resolved.pop();
    else if (part && part !== '.') resolved.push(part);
  }
  return resolved.join('/');
}

function extensionFromMediaType(mediaType: string, href: string): string {
  const lower = mediaType.toLowerCase();
  if (lower.includes('png')) return 'png';
  if (lower.includes('webp')) return 'webp';
  if (lower.includes('gif')) return 'gif';
  if (lower.includes('jpeg') || lower.includes('jpg')) return 'jpg';

  const ext = href.split('.').pop()?.toLowerCase();
  if (ext === 'png' || ext === 'webp' || ext === 'gif' || ext === 'jpg' || ext === 'jpeg') {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return 'jpg';
}

function findCoverId(
  opfXml: string,
  manifest: Record<string, ManifestItem>,
): string | null {
  const metaMatch =
    opfXml.match(/<meta[^>]+name=["']cover["'][^>]+content=["']([^"']+)["']/i) ??
    opfXml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']cover["']/i);
  if (metaMatch?.[1] && manifest[metaMatch[1]]?.mediaType.startsWith('image/')) {
    return metaMatch[1];
  }

  for (const [id, item] of Object.entries(manifest)) {
    if (item.properties.includes('cover-image') && item.mediaType.startsWith('image/')) {
      return id;
    }
  }

  for (const [id, item] of Object.entries(manifest)) {
    if (/cover/i.test(id) && item.mediaType.startsWith('image/')) {
      return id;
    }
  }

  for (const [id, item] of Object.entries(manifest)) {
    if (/cover/i.test(item.href) && item.mediaType.startsWith('image/')) {
      return id;
    }
  }

  return null;
}

async function extractCoverImage(
  zip: JSZip,
  opfPath: string,
  opfXml: string,
  manifest: Record<string, ManifestItem>,
): Promise<ParsedCoverImage | null> {
  const coverId = findCoverId(opfXml, manifest);
  if (!coverId) return null;

  const item = manifest[coverId];
  if (!item?.mediaType.startsWith('image/')) return null;

  const imagePath = resolvePath(opfPath, item.href);
  const file = zip.file(imagePath);
  if (!file) return null;

  const bytes = await file.async('uint8array');
  if (bytes.length < 64) return null;

  return {
    bytes,
    extension: extensionFromMediaType(item.mediaType, item.href),
  };
}

function buildSynopsis(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 280) return clean;
  const cut = clean.slice(0, 280);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : 280)}…`;
}

export async function parseEpub(
  data: Uint8Array | string,
  fileName: string,
): Promise<ParsedBook> {
  const zip =
    typeof data === 'string'
      ? await JSZip.loadAsync(data, { base64: true })
      : await JSZip.loadAsync(data);

  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) throw new Error('Invalid EPUB: missing container.xml');

  const opfPath = extractAttr(containerXml, 'full-path');
  if (!opfPath) throw new Error('Invalid EPUB: cannot find content.opf');

  const opfXml = await zip.file(opfPath)?.async('string');
  if (!opfXml) throw new Error('Invalid EPUB: cannot read content file');

  const title =
    decodeXmlEntities(extractTag(opfXml, 'dc:title')) ||
    fileName.replace(/\.epub$/i, '');
  const author =
    decodeXmlEntities(extractTag(opfXml, 'dc:creator')) || 'Unknown Author';

  const manifestItems: Record<string, ManifestItem> = {};
  const spineManifest: Record<string, string> = {};
  const manifestBlocks = opfXml.match(/<item[^>]+\/>|<item[^>]+>[\s\S]*?<\/item>/gi) ?? [];
  for (const block of manifestBlocks) {
    const id = extractAttr(block, 'id');
    const href = extractAttr(block, 'href');
    const mediaType = extractAttr(block, 'media-type');
    const properties = extractAttr(block, 'properties');
    if (!id || !href) continue;

    manifestItems[id] = { href, mediaType, properties };
    if (mediaType.includes('html')) {
      spineManifest[id] = resolvePath(opfPath, href);
    }
  }

  const spineIds: string[] = [];
  const spineBlocks = opfXml.match(/<itemref[^>]+\/>/gi) ?? [];
  for (const block of spineBlocks) {
    const idref = extractAttr(block, 'idref');
    if (idref && spineManifest[idref]) spineIds.push(idref);
  }

  const coverImage = await extractCoverImage(zip, opfPath, opfXml, manifestItems);

  const chapters: ParsedChapter[] = [];

  for (const id of spineIds) {
    const path = spineManifest[id];
    const html = await zip.file(path)?.async('string');
    if (!html) continue;

    const text = stripHtml(html);
    if (text.length < 20) continue;

    const hMatch = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    const chapterTitle = hMatch ? stripHtml(hMatch[1]).slice(0, 100) : `Chapter ${chapters.length + 1}`;

    chapters.push({ title: chapterTitle, content: text });
  }

  if (chapters.length === 0) {
    throw new Error('No readable chapters found in this EPUB.');
  }

  const fullText = chapters.map((c) => c.content).join('\n\n');

  return {
    title,
    author,
    synopsis: buildSynopsis(fullText),
    chapters,
    coverImage,
  };
}
