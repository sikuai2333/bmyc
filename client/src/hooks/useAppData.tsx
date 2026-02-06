import type { Dispatch, ReactNode, SetStateAction } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { DIMENSION_CATEGORIES } from '../constants'
import { useAuth } from './useAuth'
import { api } from '../utils/api'
import type { Certificate, Evaluation, GrowthEvent, Meeting, Person } from '../types/archive'
import type { Permission } from '../types/auth'
import { hasAnyPermission, hasPermission } from '../utils/permissions'

interface DimensionDraft {
  category: string
  detail: string
}

interface InsightItem {
  category: string
  count: number
}

interface CompletionItem {
  month: string
  count: number
}

interface MonthlyDimensionRow {
  month: string
  dimensions: DimensionDraft[]
}

interface AppDataContextValue {
  people: Person[]
  meetings: Meeting[]
  insights: InsightItem[]
  completionInsights: CompletionItem[]
  loading: boolean
  error: string
  selectedPersonId: number | null
  selectedMeetingId: number | null
  selectedPerson: Person | null
  selectedMeeting: Meeting | null
  setSelectedPersonId: (id: number | null) => void
  setSelectedMeetingId: (id: number | null) => void
  refreshAll: () => void
  evaluations: Evaluation[]
  growthEvents: GrowthEvent[]
  certificates: Certificate[]
  dimensionMonthlyRows: MonthlyDimensionRow[]
  dimensionMonth: string
  setDimensionMonth: (value: string) => void
  dimensionDrafts: DimensionDraft[]
  updateDimensionDraft: (idx: number, key: 'detail', value: string) => void
  draftProfile: {
    focus: string
    bio: string
    title: string
    department: string
    birth_date: string
    gender: string
    phone: string
  }
  setDraftProfile: Dispatch<
    SetStateAction<{
      focus: string
      bio: string
      title: string
      department: string
      birth_date: string
      gender: string
      phone: string
    }>
  >
  saveProfile: () => Promise<Person | null>
  saveDimensions: (monthOverride?: string) => Promise<void>
  users: Array<{
    id: number
    name: string
    email: string
    role: string
    personId?: number
    isSuperAdmin?: boolean
    sensitiveUnmasked?: boolean
    permissions?: Permission[]
  }>
  setUsers: Dispatch<
    SetStateAction<
      Array<{
        id: number
        name: string
        email: string
        role: string
        personId?: number
        isSuperAdmin?: boolean
        sensitiveUnmasked?: boolean
        permissions?: Permission[]
      }>
    >
  >
  hasPerm: (permission: Permission) => boolean
  hasAnyPerm: (permissions: Permission[]) => boolean
  isAdmin: boolean
  canManageUsers: boolean
  canManagePermissions: boolean
  canViewEvaluations: boolean
  canViewGrowth: boolean
  canViewCertificates: boolean
  canEditSelected: boolean
  canEditDimensions: boolean
  canEditGrowth: boolean
  canEditEvaluations: boolean
  canManageCertificates: boolean
  sensitiveUnmasked: boolean
  toggleSensitiveView: () => Promise<void>
}

// Centralized data context keeps legacy API flows consistent across pages.
const AppDataContext = createContext<AppDataContextValue | undefined>(undefined)

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const createEmptyDimensions = () =>
  DIMENSION_CATEGORIES.map((category) => ({
    category,
    detail: '无'
  }))

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { token, user, updateUser } = useAuth()
  const [people, setPeople] = useState<Person[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [insights, setInsights] = useState<InsightItem[]>([])
  const [completionInsights, setCompletionInsights] = useState<CompletionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [growthEvents, setGrowthEvents] = useState<GrowthEvent[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [dimensionMonthlyRows, setDimensionMonthlyRows] = useState<MonthlyDimensionRow[]>([])
  const [dimensionMonth, setDimensionMonth] = useState(getCurrentMonth())
  const [dimensionDrafts, setDimensionDrafts] = useState<DimensionDraft[]>(createEmptyDimensions())
  const [users, setUsers] = useState<
    Array<{
      id: number
      name: string
      email: string
      role: string
      personId?: number
      isSuperAdmin?: boolean
      sensitiveUnmasked?: boolean
      permissions?: Permission[]
    }>
  >([])
  const [draftProfile, setDraftProfile] = useState({
    focus: '',
    bio: '',
    title: '',
    department: '',
    birth_date: '',
    gender: '',
    phone: ''
  })
  const [dataVersion, setDataVersion] = useState(0)

  const refreshAll = useCallback(() => setDataVersion((prev) => prev + 1), [])

  const hasPerm = useCallback((permission: Permission) => hasPermission(user, permission), [user])
  const hasAnyPerm = useCallback(
    (permissions: Permission[]) => hasAnyPermission(user, permissions),
    [user]
  )
  const isAdmin = hasPerm('people.edit.all') || hasPerm('users.manage') || hasPerm('permissions.manage')
  const canManageUsers = hasPerm('users.manage') || hasPerm('permissions.manage')
  const canManagePermissions = hasPerm('permissions.manage')
  const canViewEvaluations = hasPerm('evaluations.view')
  const canViewGrowth =
    hasPerm('growth.view.all') || hasPerm('growth.edit.self') || hasPerm('growth.edit.all')
  const canViewCertificates = hasPerm('certificates.view')

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId) || null,
    [people, selectedPersonId]
  )
  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === selectedMeetingId) || null,
    [meetings, selectedMeetingId]
  )

  const sensitiveUnmasked = Boolean(user?.sensitiveUnmasked)

  const toggleSensitiveView = async () => {
    if (!user) return
    const nextValue = !sensitiveUnmasked
    await api.put('/profile/sensitive', { sensitiveUnmasked: nextValue })
    updateUser({ ...user, sensitiveUnmasked: nextValue })
  }

  useEffect(() => {
    if (!token) {
      setPeople([])
      setMeetings([])
      setSelectedPersonId(null)
      setSelectedMeetingId(null)
      setInsights([])
      setCompletionInsights([])
      setEvaluations([])
      setGrowthEvents([])
      setCertificates([])
      setDimensionMonthlyRows([])
      setUsers([])
      setError('')
      return
    }

    const fetchBase = async () => {
      setLoading(true)
      try {
        const canViewDimensionInsights = hasPerm('dimensions.view.all')
        const [peopleRes, meetingRes, insightRes, completionRes] = await Promise.all([
          api.get('/personnel'),
          api.get('/meetings'),
          canViewDimensionInsights
            ? api.get('/insights/dimensions')
            : Promise.resolve({ data: [] }),
          canViewDimensionInsights
            ? api.get('/insights/completions', { params: { months: 6 } })
            : Promise.resolve({ data: [] })
        ])
        const peopleData = peopleRes.data || []
        const meetingData = meetingRes.data || []
        setPeople(peopleData)
        setMeetings(meetingData)
        setInsights(insightRes.data || [])
        setCompletionInsights(completionRes.data || [])

        if (!selectedPersonId || !peopleData.some((item: Person) => item.id === selectedPersonId)) {
          const preferredId =
            user?.role === 'user' && user.personId ? user.personId : peopleData[0]?.id ?? null
          setSelectedPersonId(preferredId ?? null)
        }
        if (!selectedMeetingId || !meetingData.some((item: Meeting) => item.id === selectedMeetingId)) {
          setSelectedMeetingId(meetingData[0]?.id ?? null)
        }
        setError('')
      } catch (err: any) {
        const message = err?.response?.data?.message || '加载数据失败'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchBase()
  }, [token, dataVersion, user])

  useEffect(() => {
    if (!selectedPerson) {
      setDraftProfile({
        focus: '',
        bio: '',
        title: '',
        department: '',
        birth_date: '',
        gender: '',
        phone: ''
      })
      setDimensionDrafts(createEmptyDimensions())
      return
    }
    setDraftProfile({
      focus: selectedPerson.focus || '',
      bio: selectedPerson.bio || '',
      title: selectedPerson.title || '',
      department: selectedPerson.department || '',
      birth_date: selectedPerson.birth_date || '',
      gender: selectedPerson.gender || '',
      phone: selectedPerson.phone || ''
    })
  }, [selectedPerson])

  useEffect(() => {
    if (!token || !selectedPersonId) {
      setEvaluations([])
      setGrowthEvents([])
      setCertificates([])
      setDimensionMonthlyRows([])
      return
    }
    const fetchDetails = async () => {
      const requests = {
        evaluations: canViewEvaluations
          ? api.get('/evaluations', { params: { personId: selectedPersonId } })
          : Promise.resolve({ data: [] }),
        growth: canViewGrowth
          ? api.get('/growth', { params: { personId: selectedPersonId } })
          : Promise.resolve({ data: [] }),
        certificates: canViewCertificates
          ? api.get('/certificates', { params: { personId: selectedPersonId } })
          : Promise.resolve({ data: [] }),
        dimensions: api.get(`/personnel/${selectedPersonId}/dimensions/monthly`, {
          params: { months: 6 }
        })
      }

      try {
        const [evalRes, growthRes, certRes, dimensionRes] = await Promise.all([
          requests.evaluations,
          requests.growth,
          requests.certificates,
          requests.dimensions
        ])
        setEvaluations(evalRes.data || [])
        setGrowthEvents(growthRes.data || [])
        setCertificates(certRes.data || [])
        setDimensionMonthlyRows(dimensionRes?.data?.rows || [])
      } catch {
        setEvaluations([])
        setGrowthEvents([])
        setCertificates([])
        setDimensionMonthlyRows([])
      }
    }

    fetchDetails()
  }, [token, selectedPersonId, dataVersion, canViewEvaluations, canViewGrowth, canViewCertificates])

  useEffect(() => {
    if (!token || !selectedPersonId) {
      setDimensionDrafts(createEmptyDimensions())
      return
    }
    const fetchDimensionMonth = async () => {
      try {
        const { data } = await api.get(`/personnel/${selectedPersonId}/dimensions/monthly`, {
          params: { month: dimensionMonth }
        })
        const row = data?.rows?.find((item: MonthlyDimensionRow) => item.month === dimensionMonth)
        if (row?.dimensions?.length) {
          setDimensionDrafts(row.dimensions.map((dimension) => ({ ...dimension })))
        } else {
          setDimensionDrafts(createEmptyDimensions())
        }
      } catch {
        setDimensionDrafts(createEmptyDimensions())
      }
    }
    fetchDimensionMonth()
  }, [token, selectedPersonId, dimensionMonth, dataVersion])

  useEffect(() => {
    if (!token || !canManageUsers) {
      setUsers([])
      return
    }
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/users')
        setUsers(data || [])
      } catch {
        setUsers([])
      }
    }
    fetchUsers()
  }, [token, canManageUsers, dataVersion])

  const updateDimensionDraft = (idx: number, key: 'detail', value: string) => {
    setDimensionDrafts((prev) =>
      prev.map((dimension, index) => (index === idx ? { ...dimension, [key]: value } : dimension))
    )
  }

  const saveProfile = async () => {
    if (!selectedPerson) return null
    const { data } = await api.put(`/personnel/${selectedPerson.id}`, draftProfile)
    setPeople((prev) => prev.map((person) => (person.id === data.id ? { ...person, ...data } : person)))
    return data as Person
  }

  const saveDimensions = async (monthOverride?: string) => {
    if (!selectedPerson) return
    const targetMonth = monthOverride || dimensionMonth || getCurrentMonth()
    const payload = dimensionDrafts.map(({ category, detail }) => ({
      category,
      detail: detail && String(detail).trim() ? String(detail).trim() : '无'
    }))
    const { data } = await api.put(`/personnel/${selectedPerson.id}/dimensions`, {
      dimensions: payload,
      month: targetMonth
    })
    setDimensionMonthlyRows((prev) => {
      const next = prev.filter((row) => row.month !== targetMonth)
      next.push({ month: targetMonth, dimensions: data })
      return next.sort((a, b) => b.month.localeCompare(a.month))
    })
    refreshAll()
  }

  const canEditSelected =
    Boolean(user && selectedPerson) &&
    (hasPerm('people.edit.all') ||
      (hasPerm('people.edit.self') && user?.personId === selectedPerson?.id))
  const canEditDimensions =
    Boolean(user && selectedPerson) &&
    (hasPerm('dimensions.edit.all') ||
      (hasPerm('dimensions.edit.self') && user?.personId === selectedPerson?.id))
  const canEditGrowth =
    Boolean(user && selectedPerson) &&
    (hasPerm('growth.edit.all') || (hasPerm('growth.edit.self') && user?.personId === selectedPerson?.id))
  const canEditEvaluations = hasPerm('evaluations.edit')
  const canManageCertificates =
    Boolean(user && selectedPerson) &&
    (hasPerm('certificates.upload') || hasPerm('certificates.delete')) &&
    (hasPerm('people.edit.all') || user?.personId === selectedPerson?.id)

  const value = useMemo<AppDataContextValue>(
    () => ({
      people,
      meetings,
      insights,
      completionInsights,
      loading,
      error,
      selectedPersonId,
      selectedMeetingId,
      selectedPerson,
      selectedMeeting,
      setSelectedPersonId,
      setSelectedMeetingId,
      refreshAll,
      evaluations,
      growthEvents,
      certificates,
      dimensionMonthlyRows,
      dimensionMonth,
      setDimensionMonth,
      dimensionDrafts,
      updateDimensionDraft,
      draftProfile,
      setDraftProfile,
      saveProfile,
      saveDimensions,
      users,
      setUsers,
      hasPerm,
      hasAnyPerm,
      isAdmin,
      canManageUsers,
      canManagePermissions,
      canViewEvaluations,
      canViewGrowth,
      canViewCertificates,
      canEditSelected,
      canEditDimensions,
      canEditGrowth,
      canEditEvaluations,
      canManageCertificates,
      sensitiveUnmasked,
      toggleSensitiveView
    }),
    [
      people,
      meetings,
      insights,
      completionInsights,
      loading,
      error,
      selectedPersonId,
      selectedMeetingId,
      selectedPerson,
      selectedMeeting,
      evaluations,
      growthEvents,
      certificates,
      dimensionMonthlyRows,
      dimensionMonth,
      dimensionDrafts,
      draftProfile,
      users,
      hasPerm,
      hasAnyPerm,
      isAdmin,
      canManageUsers,
      canManagePermissions,
      canViewEvaluations,
      canViewGrowth,
      canViewCertificates,
      canEditSelected,
      canEditDimensions,
      canEditGrowth,
      canEditEvaluations,
      canManageCertificates,
      sensitiveUnmasked
    ]
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider')
  }
  return ctx
}
