// The first character as a reader sees it, so an emoji or flag like 🇹🇲
// (several code points) isn't cut in half.
function firstCharacter(text: string) {
  const [first] = new Intl.Segmenter().segment(text);
  return first?.segment ?? "";
}

// The same nickname always gets the same colour (tone-0…tone-5 in
// globals.css), so people are easy to tell apart in a long list.
const TONES = ["tone-0", "tone-1", "tone-2", "tone-3", "tone-4", "tone-5"];

// FNV-1a, then a final mix so every letter reaches the low bits: with a
// plain "hash * 31 + char", % 6 is just the letters' sum % 6, and similar
// names like Aman and Selbi land on the same colour.
function toneFor(text: string) {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash = Math.imul(hash ^ char.codePointAt(0)!, 0x01000193);
  }
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;
  return TONES[(hash >>> 0) % TONES.length];
}

const SIZES = {
  md: "h-11 w-11 text-lg",
  lg: "h-20 w-20 text-4xl",
};

export default function Avatar({
  nickname,
  size = "md",
}: {
  nickname: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      aria-hidden="true"
      className={`tone ${toneFor(nickname)} flex shrink-0 items-center justify-center rounded-full font-display font-semibold uppercase ${SIZES[size]}`}
    >
      {firstCharacter(nickname)}
    </span>
  );
}
