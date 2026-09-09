export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function hashString(text) {
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function deterministicNumber(text, min = 0, max = 100) {
  return min + (hashString(text) % (max - min + 1));
}

export function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function dailyItem(array, key) {
  const index = hashString(`${getTodayKey()}-${key}`) % array.length;
  return array[index];
}
