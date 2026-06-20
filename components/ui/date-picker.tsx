'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  value?: string; // Format YYYY-MM-DD
  onChange?: (date: string) => void;
  className?: string;
  hasError?: boolean;
}

export function DatePicker({ value, onChange, className, hasError }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedDate = value ? parseISO(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}`);
      setIsOpen(false);
    }
  };

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "w-full px-4 py-2 bg-gray-50 border rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-300 text-left flex items-center justify-between text-[14px]",
            hasError ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 focus:border-primary focus:ring-primary/20 hover:border-gray-300",
            !selectedDate && "text-gray-500",
            className
          )}
        >
          {selectedDate ? (
            <span className="font-medium text-gray-900">{format(selectedDate, 'PPP', { locale: fr })}</span>
          ) : (
            <span>Sélectionner une date</span>
          )}
          <CalendarIcon className={cn("w-4 h-4 transition-colors", isOpen ? "text-primary" : "text-gray-400")} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          className="w-auto z-50 rounded-xl bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 outline-none animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <style>{`
            .rdp-root {
              --rdp-cell-size: 44px;
              --rdp-accent-color: #2D8B6F;
              --rdp-background-color: #f3f4f6;
              --rdp-accent-color-dark: #236a55;
              --rdp-background-color-dark: #e5e7eb;
              --rdp-outline: 2px solid var(--rdp-accent-color);
              --rdp-outline-offset: 2px;
              margin: 0;
            }
            .rdp-day_selected {
              border-radius: 12px;
            }
            .rdp-day_button {
              border-radius: 12px;
              transition: all 0.2s;
            }
            .rdp-day_button:hover {
              background-color: var(--rdp-background-color);
            }
            .striped-rect {
              background: repeating-linear-gradient(
                45deg,
                #f3f4f6,
                #f3f4f6 2px,
                #ffffff 2px,
                #ffffff 6px
              );
              color: transparent !important;
              pointer-events: none;
              border-radius: 12px;
            }
            .rdp-nav {
              margin-bottom: 1rem;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={fr}
            showOutsideDays={true}
            className="font-sans m-0"
            modifiersClassNames={{
              outside: "striped-rect text-gray-400"
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-5 w-5 text-gray-600" />,
              IconRight: () => <ChevronRight className="h-5 w-5 text-gray-600" />,
              CaptionLabel: (props: any) => {
                const date = props?.displayMonth || props?.month || props?.date;
                if (!date || isNaN(date.getTime())) return <div />;
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                      <CalendarIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-[18px] font-medium text-gray-900 capitalize">
                      {format(date, 'MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                );
              }
            } as any}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

