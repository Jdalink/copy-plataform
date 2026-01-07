"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CustomDayPickerCalendarProps = React.ComponentProps<typeof DayPicker>

function CustomDayPickerCalendar({
  className,
  ...props
}: CustomDayPickerCalendarProps) {
  return <DayPicker className={cn("p-3", className)} {...props} />
}
CustomDayPickerCalendar.displayName = "CustomDayPickerCalendar"

export { CustomDayPickerCalendar }