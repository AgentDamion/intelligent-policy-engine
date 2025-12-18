// MIME type mappings for file extensions
export const FILE_EXTENSION_TO_MIME: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.txt': ['text/plain'],
  '.md': ['text/markdown', 'text/plain'],
  '.csv': ['text/csv'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.ppt': ['application/vnd.ms-powerpoint'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.json': ['application/json'],
  '.xml': ['application/xml', 'text/xml'],
};

/**
 * Converts an array of file extensions to a MIME type accept object
 * for use with react-dropzone
 */
export function extensionsToMimeAccept(extensions: string[]): Record<string, string[]> {
  return extensions.reduce((acc, ext) => {
    const mimeTypes = FILE_EXTENSION_TO_MIME[ext];
    if (mimeTypes && mimeTypes.length > 0) {
      // Use the first MIME type as key, with the extension as value
      acc[mimeTypes[0]] = [ext];
    }
    return acc;
  }, {} as Record<string, string[]>);
}
