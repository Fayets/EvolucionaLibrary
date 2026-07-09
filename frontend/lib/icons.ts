export type ResourceTypeInfo = {
  type: 'miro' | 'google_doc' | 'google_sheet' | 'loom' | 'notion' | 'fathom' | 'other';
  iconPath: string;
  label: string;
};

const FALLBACK: ResourceTypeInfo = {
  type: 'other',
  iconPath: '/icons/link.svg',
  label: 'Enlace',
};

export function detectResourceType(url: string): ResourceTypeInfo {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return FALLBACK;
  }

  if (hostname.includes('loom.com')) {
    return { type: 'loom', iconPath: '/icons/loom.png', label: 'Loom' };
  }
  if (hostname.includes('docs.google.com')) {
    if (url.includes('/spreadsheets/')) {
      return { type: 'google_sheet', iconPath: '/icons/gsheets.png', label: 'Google Sheet' };
    }
    if (url.includes('/presentation/')) {
      return { type: 'google_doc', iconPath: '/icons/gslides.png', label: 'Google Slides' };
    }
    return { type: 'google_doc', iconPath: '/icons/gdocs.png', label: 'Google Doc' };
  }
  if (hostname.includes('miro.com')) {
    return { type: 'miro', iconPath: '/icons/miro.png', label: 'Miro' };
  }
  if (hostname.includes('notion.so') || hostname.includes('notion.site')) {
    return { type: 'notion', iconPath: '/icons/notion.png', label: 'Notion' };
  }
  if (hostname.includes('fathom.video')) {
    return { type: 'fathom', iconPath: '/icons/fathom.png', label: 'Fathom' };
  }

  return FALLBACK;
}