import {
  Building2,
  Calendar,
  CalendarClock,
  Clock,
  CloudLightning,
  Hammer,
  HelpCircle,
  Home,
  Paintbrush,
  Search,
  Zap,
} from 'lucide-react'

export const SERVICE_OPTIONS = [
  { value: 'roof-replacement', label: 'Roof Replacement', icon: Home },
  { value: 'storm-repair', label: 'Storm Repair / Tarping', icon: CloudLightning },
  { value: 'commercial', label: 'Commercial Solutions', icon: Building2 },
  { value: 'custom-design', label: 'Custom Roof Design', icon: Paintbrush },
  { value: 'remodeling', label: 'Remodeling', icon: Hammer },
]

export const PROPERTY_AGE_OPTIONS = [
  { value: 'under-10', label: 'Under 10 years', icon: Home },
  { value: '10-15', label: '10 to 15 years', icon: Calendar },
  { value: 'over-15', label: 'More than 15 years', icon: Clock },
  { value: 'not-sure', label: 'Not sure', icon: HelpCircle },
]

export const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'ASAP / Emergency', icon: Zap },
  { value: '1-2-weeks', label: 'Within 1–2 Weeks', icon: CalendarClock },
  { value: '1-month', label: 'Within 1 Month', icon: Calendar },
  { value: 'researching', label: 'Just Researching', icon: Search },
]
