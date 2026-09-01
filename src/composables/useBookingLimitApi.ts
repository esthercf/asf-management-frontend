import { client } from '../services/http.client'
import { BookingTypeEnum } from '../enums/booking.enum'

export interface BookingLimitFlag {
    value: boolean
    updatedAt: string | null
    updatedBy: string | null
}

export interface BookingLimitFlags {
    youthCheckinDone: BookingLimitFlag
    soloCheckinDone: BookingLimitFlag
    firstRoundDone: BookingLimitFlag
    secondRoundDone: BookingLimitFlag
    youthDone: BookingLimitFlag
}

export interface BookingLimitRule {
    _id?: string
    name: string
    maxMinutesPerDay: number
    priority: number
    active: boolean
    allOfBookingTypes: BookingTypeEnum[]
    anyOfBookingTypes: BookingTypeEnum[]
    noneOfBookingTypes: BookingTypeEnum[]
    exactMatch: boolean
    requiredFlags: string[]
    forbiddenFlags: string[]
    comments?: string
}

export interface BookingLimitConfiguration {
    flags: BookingLimitFlags
    rules: BookingLimitRule[]
}

export function useBookingLimitApi() {
    function get(): Promise<BookingLimitConfiguration> {
        return client.get<BookingLimitConfiguration>('/booking-limit-configuration').then(r => r.data)
    }

    function setFlag(flagName: keyof BookingLimitFlags, value: boolean): Promise<BookingLimitConfiguration> {
        return client.put<BookingLimitConfiguration>('/booking-limit-configuration/flags', { flagName, value }).then(r => r.data)
    }

    function setRules(rules: BookingLimitRule[]): Promise<BookingLimitConfiguration> {
        return client.put<BookingLimitConfiguration>('/booking-limit-configuration/rules', { rules }).then(r => r.data)
    }

    return { get, setFlag, setRules }
}