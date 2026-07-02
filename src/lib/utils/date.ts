import { format } from 'date-fns';
import { enIN } from 'date-fns/locale';

export default function formatDate(date: string, dateFormat: string = 'dd-MM-yyyy') {
  if (!date) return '';
  return format(new Date(date), dateFormat, { locale: enIN });
}

export function formatDateTime(date: string, dateFormat: string = 'dd-MM-yyyy hh:mm a') {
  if (!date) return '';
  return format(new Date(date), dateFormat, { locale: enIN });
}

export function formatTime(time: string, dateFormat: string = 'hh:mm a') {
  if (!time) return '';
  time = '01-01-2001 ' + time;
  return format(new Date(time), dateFormat, { locale: enIN });
}