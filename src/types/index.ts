export interface SearchHistory {
  pattern: string,
  patternIndex: number,
  timestamp: Date,
  searchItemId: number
}

export interface DBData {
  search_history: SearchHistory[]
}

export interface SearchPatternItem {
  searchItemId: number,
  patternIndex: number,
  singlePattern: string
}

export interface SearchItem {
  pattern_list: string,
  excluded: string,
  excluded_users: string,
  extensions: string,
  file_type: string,
  min_size: number,
  remove_after_found: boolean,
  exact_match: boolean,
  queue_all: boolean,
  queue_dupe: string,
  remove_dupe: boolean,
  priority: number,
  target_directory: string
}

export interface ServerInfo {
  address: string,
  secure: boolean
}

export interface Extension {
  name: string,
  configPath: string,
  logPath: string,
  debugMode: boolean,
  server: ServerInfo,
  onStart: any,
  onStop: any
}