import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (num: number | string): string => {
  const amount = typeof num === 'string' ? parseFloat(num) : num;
  return "₺ " + amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 });
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("tr-TR");
};
