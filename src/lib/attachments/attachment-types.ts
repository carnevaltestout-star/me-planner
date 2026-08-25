export interface AttachmentFolder {
  id: string;
  name: string;
  // null = a top-level folder, shown on the main page. Otherwise the id of
  // the folder it's nested inside — folders can nest arbitrarily deep.
  parentId: string | null;
}

export interface AttachmentFile {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  // null = sitting unfiled at the top level, not inside any folder.
  folderId: string | null;
  addedAt: string;
}

export interface AttachmentsData {
  folders: AttachmentFolder[];
  files: AttachmentFile[];
}
