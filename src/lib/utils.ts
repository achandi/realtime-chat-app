import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

//anytime we create conditional classes across components, this is the conditional function we are going to use
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function chatHrefConstructor(id1: string, id2: string) {
  const sortedIds = [id1, id2].sort();
  return `${sortedIds[0]}--${sortedIds[1]}`;
}

export function toPusherKey(key: string) {
  return key.replace(/:/g, "__");
}
