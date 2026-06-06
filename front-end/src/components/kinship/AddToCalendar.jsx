import React, { useState } from "react";
import { Calendar, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Brand Logo SVGs formatted to look clean and premium
const GoogleCalendarIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#4285F4" />
    <path d="M17 13h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="#FFF" />
    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#FFF" strokeWidth="1.5" />
  </svg>
);

const AppleCalendarIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#FF3B30" />
    <rect x="4" y="8" width="16" height="12" rx="3" fill="#FFF" />
    <circle cx="8" cy="12" r="1.2" fill="#1F2937" />
    <circle cx="12" cy="12" r="1.2" fill="#1F2937" />
    <circle cx="16" cy="12" r="1.2" fill="#1F2937" />
    <circle cx="8" cy="16" r="1.2" fill="#1F2937" />
    <circle cx="12" cy="16" r="1.2" fill="#1F2937" />
    <circle cx="16" cy="16" r="1.2" fill="#1F2937" />
  </svg>
);

const SamsungCalendarIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#EC6C24" />
    <rect x="5" y="8" width="14" height="11" rx="2" fill="#FFF" />
    <path d="M8 13.5l2.5 2.5L16 11" stroke="#EC6C24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const OutlookCalendarIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#0078D4" />
    <path d="M6 7.5V17a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0018 17V7.5M6 7.5A1.5 1.5 0 017.5 6h9A1.5 1.5 0 0118 7.5M6 7.5h12M9 11h6M9 14h6" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const YahooCalendarIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#6001D2" />
    <path d="M7 7.5L12 13l5-5.5M12 13v6" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function AddToCalendar({ event, children }) {
  const isMobile = useIsMobile();
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  if (!event) return null;

  // Date utilities
  const startDateObj = new Date(event.eventDate);
  // Default end date to 2 hours after start date
  const endDateObj = new Date(startDateObj.getTime() + 2 * 60 * 60 * 1000);

  const formatUtcDate = (date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const startUtc = formatUtcDate(startDateObj);
  const endUtc = formatUtcDate(endDateObj);

  const title = event.title;
  const description = `${event.subtitle ? event.subtitle + "\n\n" : ""}${event.description || ""}`;
  const location = event.location || "";

  // Calendar URL definitions
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startUtc}/${endUtc}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

  const yahooUrl = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(title)}&st=${startUtc}&et=${endUtc}&desc=${encodeURIComponent(description)}&in_loc=${encodeURIComponent(location)}`;

  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${startUtc}&enddt=${endUtc}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

  // Generate standard iCalendar (.ics) content
  const getIcsContent = () => {
    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "PRODID:-//Kinship//Family Event//EN",
      "BEGIN:VEVENT",
      `UID:${event.id || Math.random().toString(36).substring(2)}@kinship.net`,
      `DTSTAMP:${formatUtcDate(new Date())}`,
      `DTSTART:${startUtc}`,
      `DTEND:${endUtc}`,
      `SUMMARY:${title.replace(/[,;]/g, "\\$&")}`,
      `DESCRIPTION:${description.replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n")}`,
      `LOCATION:${location.replace(/[,;]/g, "\\$&")}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return icsLines.join("\r\n");
  };

  // Triggers .ics file download for Apple and Samsung Calendar apps
  const downloadIcsFile = () => {
    const icsContent = getIcsContent();
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedTitle = event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    link.setAttribute("download", `${sanitizedTitle}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    if (isMobile) setIsOpenMobile(false);
  };

  const calendarOptions = [
    {
      name: "Google Calendar",
      subtitle: "Web & Mobile App",
      icon: <GoogleCalendarIcon />,
      action: () => {
        window.open(googleUrl, "_blank", "noopener,noreferrer");
        if (isMobile) setIsOpenMobile(false);
      },
    },
    {
      name: "Apple Calendar",
      subtitle: "iOS & macOS native Calendar",
      icon: <AppleCalendarIcon />,
      action: downloadIcsFile,
    },
    {
      name: "Samsung Calendar",
      subtitle: "Samsung & Android device native",
      icon: <SamsungCalendarIcon />,
      action: downloadIcsFile,
    },
    {
      name: "Outlook Calendar",
      subtitle: "Outlook Web & App",
      icon: <OutlookCalendarIcon />,
      action: () => {
        window.open(outlookUrl, "_blank", "noopener,noreferrer");
        if (isMobile) setIsOpenMobile(false);
      },
    },
    {
      name: "Yahoo Calendar",
      subtitle: "Yahoo Web interface",
      icon: <YahooCalendarIcon />,
      action: () => {
        window.open(yahooUrl, "_blank", "noopener,noreferrer");
        if (isMobile) setIsOpenMobile(false);
      },
    },
  ];

  const triggerButton = children || (
    <Button
      variant="outline"
      size="sm"
      className="group rounded-xl flex items-center gap-2 border-primary/20 hover:border-primary text-xs font-semibold px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
    >
      <Calendar className="w-3.5 h-3.5 text-primary group-hover:text-primary-foreground transition-colors stroke-[2]" />
      <span>Add to Calendar</span>
      <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary-foreground/80 transition-colors stroke-[2.5]" />
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpenMobile} onOpenChange={setIsOpenMobile}>
        <SheetTrigger asChild>
          {triggerButton}
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-[24px] border-t border-border bg-card p-6 pb-8 max-h-[85vh] overflow-y-auto">
          <div className="mx-auto w-12 h-1 bg-muted rounded-full mb-6" />
          <SheetHeader className="text-left space-y-1 mb-6">
            <SheetTitle className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Add to Calendar
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Select your calendar provider to import <strong>{event.title}</strong>.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            {calendarOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.action}
                className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 active:scale-[0.99] border border-border/50 rounded-2xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-background rounded-xl shadow-sm border border-border/40">
                    {option.icon}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-foreground block leading-tight">
                      {option.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-none">
                      {option.subtitle}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view using DropdownMenu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-card border border-border rounded-xl p-1.5 shadow-xl animate-in fade-in duration-200">
        <div className="px-2 py-1.5 border-b border-border/50 mb-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Select Calendar
          </span>
        </div>
        {calendarOptions.map((option) => (
          <DropdownMenuItem
            key={option.name}
            onClick={option.action}
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all"
          >
            {option.icon}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">
                {option.name}
              </span>
              <span className="text-[9px] text-muted-foreground leading-none">
                {option.subtitle}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
