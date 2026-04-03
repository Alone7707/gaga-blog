export type SettingGroupKey = 'site' | 'seo' | 'comment' | 'content'

export type SettingItemValue = string | number | boolean | string[] | null

export interface SettingItem {
  key: string
  group: SettingGroupKey | string
  description: string
  isPublic: boolean
  value: SettingItemValue
  updatedById: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface SettingGroup {
  group: SettingGroupKey | string
  items: SettingItem[]
}

export interface AdminSettingsResponse {
  groups: SettingGroup[]
  items: SettingItem[]
}

export interface AdminSettingsUpdatePayload {
  items: Array<{
    key: string
    value: Exclude<SettingItemValue, null>
  }>
}
