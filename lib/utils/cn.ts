type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      classes.push(cn(...value));
    } else {
      classes.push(String(value));
    }
  }
  return classes.join(" ");
}
