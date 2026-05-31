import { Building2, Hammer, LayoutGrid, Wrench } from 'lucide-react'

export const DOMAIN_OPTIONS = [
  {
    value: 'office-buildout',
    label: 'Complete Office Tenant Build-Out',
    icon: Building2,
  },
  {
    value: 'renovation',
    label: 'Interior Renovation & Modernization',
    icon: Hammer,
  },
  {
    value: 'acoustic-partition',
    label: 'Acoustic, Partition, & Spatial Restructuring',
    icon: LayoutGrid,
  },
  {
    value: 'minor-modifications',
    label: 'Minor Modifications & Facility Adjustments',
    icon: Wrench,
  },
]

export const TIMELINE_OPTIONS = [
  {
    value: 'immediate',
    label: 'Immediate / Critical Mobilization',
  },
  {
    value: '30-60-days',
    label: 'Within 30 to 60 Days',
  },
  {
    value: 'planning',
    label: 'Strategic Planning / Budget Qualification',
  },
]
