"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DatePicker({ onChange, date, subYear = 0, maxToday = true, minToday = false }: { 
  onChange: (date: Date | null) => void; 
  date: Date | null;
  subYear?: number;
  maxToday?: boolean;
  minToday?: boolean;
}) {
  const minYear = new Date()
  if (!minToday) {
    minYear.setFullYear(1900); 
  }
  
  const currentYear = new Date().getFullYear()
  const yearAgo = currentYear - subYear
  const maxDate = new Date()
  maxDate.setFullYear(yearAgo)
  maxDate.setHours(23, 59, 59, 999)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 ">
        <Calendar
          onChange={(value) => {
            onChange(value as Date);
          }}
          value={date ?? maxDate}
          minDate={minYear}
          maxDate={(maxToday || subYear != 0) ? maxDate : undefined} 
          className="border-0  min-h-[22rem] p-3 shadow-md m-auto"
          tileClassName={({ date: tileDate, view }) => 
            view === 'month' && tileDate.getTime() === date?.getTime() 
              ? 'bg-primary text-primary-foreground' 
              : ''
          }
        />
      </PopoverContent>
    </Popover>
  );
}