export interface CallRecord {
  id: number | string
  callerName: string
  callerNumber: string
  receiverNumber: string
  city: string
  callDirection: boolean
  callStatus: boolean
  callDuration: number
  callCost: number | string
  callStartTime: string
  callEndTime: string
}

export interface CallPage {
  items: CallRecord[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface CurrentUser {
  id: number
  email: string
  fullName: string
  role: "admin" | "analyst"
  createdAt: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: "bearer"
  expiresIn: number
  user: CurrentUser
}

export interface Summary {
  totalCalls: number
  totalDurationSeconds: number
  averageDurationSeconds: number
  totalCost: number
  averageCost: number
  successfulCalls: number
  failedCalls: number
  incomingCalls: number
  outgoingCalls: number
  longestCallSeconds: number | null
  shortestCallSeconds: number | null
}
export interface DurationBucket { label: string; minSeconds: number; maxSeconds: number | null; calls: number }
export interface CityStat { city: string; calls: number; totalCost: number; averageCost: number }
export interface CityStats { distinctCities: number; items: CityStat[] }
export interface TimePoint { period: string; calls: number }
export interface CallsOverTime { granularity: string; items: TimePoint[] }
