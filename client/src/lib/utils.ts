import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  } else {
    return value.toString();
  }
}

export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'youtube':
      return '#FF0000';
    case 'instagram':
      return '#E1306C';
    case 'twitter':
      return '#1DA1F2';
    case 'facebook':
      return '#4267B2';
    default:
      return '#3B82F6';
  }
}

export function getPlatformIcon(platform: string): string {
  switch (platform) {
    case 'youtube':
      return 'ri-youtube-line';
    case 'instagram':
      return 'ri-instagram-line';
    case 'twitter':
      return 'ri-twitter-x-line';
    case 'facebook':
      return 'ri-facebook-circle-line';
    default:
      return 'ri-global-line';
  }
}

export function getEngagementIcon(type: string): string {
  switch (type) {
    case 'likes':
      return 'ri-thumb-up-line';
    case 'comments':
      return 'ri-chat-1-line';
    case 'shares':
      return 'ri-share-forward-line';
    case 'views':
      return 'ri-eye-line';
    case 'bookmarks':
      return 'ri-bookmark-line';
    case 'retweets':
      return 'ri-repeat-line';
    case 'hearts':
      return 'ri-heart-line';
    default:
      return 'ri-heart-line';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
}

export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function formatDateToLocal(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export const downloadCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;

  // Get headers from the first item
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(field => {
        const value = row[field];
        // Handle strings that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
