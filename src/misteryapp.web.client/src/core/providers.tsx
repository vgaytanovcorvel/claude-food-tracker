import { createContext, useContext, type ReactNode } from 'react'
import { HttpUserProfileRepository } from '../repositories/http-user-profile-repository'
import { HttpFoodLogRepository } from '../repositories/http-food-log-repository'
import { HttpReportRepository } from '../repositories/http-report-repository'
import { HttpBookmarkRepository } from '../repositories/http-bookmark-repository'
import { UserProfileService } from '../services/user-profile-service'
import { FoodLogService } from '../services/food-log-service'
import { ReportService } from '../services/report-service'
import { BookmarkService } from '../services/bookmark-service'
import type { IUserProfileService } from '../domain/interfaces/i-user-profile-service'
import type { IFoodLogService } from '../domain/interfaces/i-food-log-service'
import type { IReportService } from '../domain/interfaces/i-report-service'
import type { IBookmarkService } from '../domain/interfaces/i-bookmark-service'

export interface Services {
  userProfileService: IUserProfileService
  foodLogService: IFoodLogService
  reportService: IReportService
  bookmarkService: IBookmarkService
}

const defaultServices: Services = {
  userProfileService: new UserProfileService(new HttpUserProfileRepository()),
  foodLogService: new FoodLogService(new HttpFoodLogRepository()),
  reportService: new ReportService(new HttpReportRepository()),
  bookmarkService: new BookmarkService(new HttpBookmarkRepository()),
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
