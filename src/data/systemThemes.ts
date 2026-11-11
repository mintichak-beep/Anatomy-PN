import { SystemId } from '../types/anatomy';

export interface SystemTheme {
  iconBg: string;
  iconBgFilled: string;
  iconText: string;
  iconBorder: string;
  softBg: string;
  softBorder: string;
  accentText: string;
  barFill: string;
  buttonBg: string;
}

export const SYSTEM_THEMES: Record<SystemId, SystemTheme> = {
  respiratory: {
    iconBg: 'bg-sky-50',
    iconBgFilled: 'bg-sky-600',
    iconText: 'text-sky-600',
    iconBorder: 'border-sky-200',
    softBg: 'bg-sky-50/80',
    softBorder: 'border-sky-200',
    accentText: 'text-sky-700',
    barFill: 'bg-sky-500',
    buttonBg: 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200',
  },
  digestive: {
    iconBg: 'bg-amber-50',
    iconBgFilled: 'bg-amber-500',
    iconText: 'text-amber-600',
    iconBorder: 'border-amber-200',
    softBg: 'bg-amber-50/80',
    softBorder: 'border-amber-200',
    accentText: 'text-amber-700',
    barFill: 'bg-amber-500',
    buttonBg: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200',
  },
  nervous: {
    iconBg: 'bg-indigo-50',
    iconBgFilled: 'bg-indigo-600',
    iconText: 'text-indigo-600',
    iconBorder: 'border-indigo-200',
    softBg: 'bg-indigo-50/80',
    softBorder: 'border-indigo-200',
    accentText: 'text-indigo-700',
    barFill: 'bg-indigo-500',
    buttonBg: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  female_reproductive: {
    iconBg: 'bg-rose-50',
    iconBgFilled: 'bg-rose-500',
    iconText: 'text-rose-600',
    iconBorder: 'border-rose-200',
    softBg: 'bg-rose-50/80',
    softBorder: 'border-rose-200',
    accentText: 'text-rose-700',
    barFill: 'bg-rose-500',
    buttonBg: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
  },
  male_reproductive: {
    iconBg: 'bg-blue-50',
    iconBgFilled: 'bg-blue-600',
    iconText: 'text-blue-600',
    iconBorder: 'border-blue-200',
    softBg: 'bg-blue-50/80',
    softBorder: 'border-blue-200',
    accentText: 'text-blue-700',
    barFill: 'bg-blue-500',
    buttonBg: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
  },
  urinary: {
    iconBg: 'bg-emerald-50',
    iconBgFilled: 'bg-emerald-600',
    iconText: 'text-emerald-600',
    iconBorder: 'border-emerald-200',
    softBg: 'bg-emerald-50/80',
    softBorder: 'border-emerald-200',
    accentText: 'text-emerald-700',
    barFill: 'bg-emerald-500',
    buttonBg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  cardiovascular: {
    iconBg: 'bg-red-50',
    iconBgFilled: 'bg-red-600',
    iconText: 'text-red-600',
    iconBorder: 'border-red-200',
    softBg: 'bg-red-50/80',
    softBorder: 'border-red-200',
    accentText: 'text-red-700',
    barFill: 'bg-red-500',
    buttonBg: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
  },
  endocrine: {
    iconBg: 'bg-purple-50',
    iconBgFilled: 'bg-purple-600',
    iconText: 'text-purple-600',
    iconBorder: 'border-purple-200',
    softBg: 'bg-purple-50/80',
    softBorder: 'border-purple-200',
    accentText: 'text-purple-700',
    barFill: 'bg-purple-500',
    buttonBg: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
  },
};
