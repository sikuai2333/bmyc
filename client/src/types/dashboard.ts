export interface Metric {
  label: string
  value: string | number
  unit?: string
  trend?: string
}

export interface TrendPoint {
  month: string
  meetings: number
  dimensions: number
}

export interface DimensionDistribution {
  name: string
  value: number
}
