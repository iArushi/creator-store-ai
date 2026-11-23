/**
 * Free Unsplash imagery (license: Unsplash License).
 * Used for atmosphere and product covers only — never as fake creator photos.
 */

export const MEDIA = {
  onboardingHero:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
  pageAtmosphere:
    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1600&q=70",
  readyPanel:
    "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=1200&q=80",
  niches: {
    Finance:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    Fitness:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80",
    Cooking:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
    Education:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
    "Exam prep":
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
    Astrology:
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80",
    Fashion:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    Design:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80",
    Other:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
  },
  formats: {
    "digital files":
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1000&q=80",
    "1-on-1 session":
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80",
    membership:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80",
    "event / webinar":
      "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=1000&q=80",
    "locked content":
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80",
    course:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1000&q=80",
  },
} as const;

export function nicheImage(niche?: string): string {
  const key = (niche || "Other").trim();
  if (key in MEDIA.niches) {
    return MEDIA.niches[key as keyof typeof MEDIA.niches];
  }
  const lower = key.toLowerCase();
  if (lower.includes("financ") || lower.includes("money")) return MEDIA.niches.Finance;
  if (lower.includes("fit") || lower.includes("health")) return MEDIA.niches.Fitness;
  if (lower.includes("cook") || lower.includes("food")) return MEDIA.niches.Cooking;
  if (lower.includes("exam") || lower.includes("upsc") || lower.includes("neet")) {
    return MEDIA.niches["Exam prep"];
  }
  if (lower.includes("astro") || lower.includes("horoscope")) {
    return MEDIA.niches.Astrology;
  }
  if (lower.includes("educ") || lower.includes("teach")) return MEDIA.niches.Education;
  if (lower.includes("fashion") || lower.includes("style")) return MEDIA.niches.Fashion;
  if (lower.includes("design")) return MEDIA.niches.Design;
  return MEDIA.niches.Other;
}

export function formatImage(format?: string): string {
  if (format && format in MEDIA.formats) {
    return MEDIA.formats[format as keyof typeof MEDIA.formats];
  }
  // Legacy / free-text formats from older storefronts
  const key = (format || "").toLowerCase();
  if (key.includes("1:1") || key.includes("call") || key.includes("session")) {
    return MEDIA.formats["1-on-1 session"];
  }
  if (key.includes("community") || key.includes("membership")) {
    return MEDIA.formats.membership;
  }
  if (key.includes("workshop") || key.includes("webinar") || key.includes("event")) {
    return MEDIA.formats["event / webinar"];
  }
  if (key.includes("course") || key.includes("cohort") || key.includes("mini")) {
    return MEDIA.formats.course;
  }
  if (key.includes("locked")) return MEDIA.formats["locked content"];
  return MEDIA.formats["digital files"];
}
