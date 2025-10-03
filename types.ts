export interface File {
  id: string;
  name: string;
  content: string;
  isPinned?: boolean;
}

export interface Group {
  id: string;
  name: string;
  fileIds: string[];
  isCollapsed?: boolean;
}
