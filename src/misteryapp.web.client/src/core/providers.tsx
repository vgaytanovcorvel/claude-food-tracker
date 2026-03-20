import { createContext, useContext, type ReactNode } from 'react'
import { HttpUserProfileRepository } from '../repositories/http-user-profile-repository'
import { HttpFoodLogRepository } from '../repositories/http-food-log-repository'
import { HttpReportRepository } from '../repositories/http-report-repository'
import { HttpBookmarkRepository } from '../repositories/http-bookmark-repository'
import type { IUserProfileRepository } from '../domain/interfaces/i-user-profile-repository'
import type { IFoodLogRepository } from '../domain/interfaces/i-food-log-repository'
import type { IReportRepository } from '../domain/interfaces/i-report-repository'
import type { IBookmarkRepository } from '../domain/interfaces/i-bookmark-repository'

export interface Services {
  userProfileRepository: IUserProfileRepository
  foodLogRepository: IFoodLogRepository
  reportRepository: IReportRepository
  bookmarkRepository: IBookmarkRepository
}

const defaultServices: Services = {
  userProfileRepository: new HttpUserProfileRepository(),
  foodLogRepository: new HttpFoodLogRepository(),
  reportRepository: new HttpReportRepository(),
  bookmarkRepository: new HttpBookmarkRepository(),
}

const ServicesContext = createContext<Services | null>(null)

export function ServicesProvider({
  children,
  services = defaultServices,
}: {
  children: ReactNode
  services?: Services
}) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  )
}

export function useServices(): Services {
  const ctx = useContext(ServicesContext)
  if (!ctx) throw new Error('useServices must be used inside ServicesProvider')
  return ctx
}
