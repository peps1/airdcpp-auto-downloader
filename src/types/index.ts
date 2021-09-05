export interface SearchHistory {
  name: string,
  timestamp: Date,
  listid: number
}

export interface DBData {
  search_history: SearchHistory[]
}
