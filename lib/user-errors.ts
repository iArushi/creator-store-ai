export type UserFacingError = {
  title: string;
  message: string;
  tip?: string;
};

type ErrorContext =
  | "profile"
  | "discovery"
  | "review"
  | "goals"
  | "opportunities"
  | "storefront"
  | "chat"
  | "upload"
  | "generic";

function asText(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw instanceof Error) return raw.message;
  if (raw && typeof raw === "object" && "message" in raw) {
    return String((raw as { message: unknown }).message || "");
  }
  return "";
}

/**
 * Turn technical/API failures into short, creator-friendly copy.
 */
export function toUserError(
  raw: unknown,
  context: ErrorContext = "generic",
): UserFacingError {
  const text = asText(raw).trim();
  const lower = text.toLowerCase();

  if (
    lower.includes("openai_api_key") ||
    lower.includes("openai api key") ||
    lower.includes("not configured")
  ) {
    return {
      title: "AI isn’t set up yet",
      message:
        "Add your OpenAI key in .env.local, then refresh and try again.",
      tip: "This is a setup step — nothing is wrong with your answers.",
    };
  }

  if (lower.includes("tavily")) {
    return {
      title: "Market research unavailable",
      message:
        "We can still draft ideas from what you shared. External price research needs a Tavily key.",
      tip: "Your recommendations will be labelled as estimates.",
    };
  }

  if (
    lower.includes("failed validation") ||
    lower.includes("couldn't finish analysing") ||
    lower.includes("unexpected") ||
    lower.includes("invalid json")
  ) {
    if (context === "opportunities") {
      return {
        title: "Couldn’t draft offers yet",
        message:
          "The AI response came back incomplete. Try again — or add one clearer note about what you teach.",
        tip: "A short example of what people ask you helps a lot.",
      };
    }
    return {
      title: "We couldn’t finish that draft",
      message:
        "Something in the AI response didn’t land cleanly. Try again in a moment.",
      tip: "Adding a screenshot or one concrete example usually helps.",
    };
  }

  if (
    lower.includes("not enough") ||
    lower.includes("insufficient") ||
    lower.includes("follow-up") ||
    lower.includes("add a clearer") ||
    lower.includes("thin")
  ) {
    return {
      title: "Need a little more from you",
      message:
        text.length > 12 && text.length < 180
          ? text
          : "Share one concrete topic you help with, or add a screenshot / short note, then try again.",
      tip: "Specifics beat long bios here.",
    };
  }

  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return {
      title: "Connection hiccup",
      message: "Check your internet and try again.",
    };
  }

  if (lower.includes("instagram")) {
    return {
      title: "Instagram step needs a tweak",
      message:
        text ||
        "We couldn’t use Instagram just now. Continue with a short description instead.",
      tip: "Your store can still be built without connecting Instagram.",
    };
  }

  if (context === "goals") {
    return {
      title: "Pick a goal",
      message: text || "Choose at least one goal so we know what to prioritise.",
    };
  }

  if (context === "opportunities" && lower.includes("select one")) {
    return {
      title: "Choose an offer",
      message: "Tap Select on one idea before building your store.",
    };
  }

  if (context === "upload") {
    return {
      title: "Couldn’t add that file",
      message:
        text ||
        "Try a smaller JPG/PNG screenshot, or a short text note instead.",
    };
  }

  if (context === "storefront") {
    return {
      title: "Storefront didn’t generate",
      message:
        text.length > 12 && !lower.includes("openai")
          ? text
          : "Try again in a moment. Your selected offer is still saved.",
      tip: "If it keeps failing, go back and regenerate the offer once.",
    };
  }

  if (context === "chat") {
    return {
      title: "Chat paused",
      message: text || "We couldn’t continue that conversation. Try sending again.",
    };
  }

  // Already human-ish short message — keep it, add a calm title
  if (text && text.length < 160 && !lower.includes("zod") && !lower.includes("undefined")) {
    return {
      title:
        context === "profile"
          ? "Couldn’t analyse that yet"
          : context === "discovery"
            ? "Almost — one more thing"
            : context === "review"
              ? "Snapshot needs a fix"
              : context === "opportunities"
                ? "Offers need another try"
                : "Something went wrong",
      message: text,
    };
  }

  return {
    title: "Something went wrong",
    message:
      "Please try again. If it keeps happening, go back one step and add a bit more detail.",
    tip: "Your previous answers are still here.",
  };
}

export function formatUserError(raw: unknown, context?: ErrorContext): string {
  const err = toUserError(raw, context);
  return err.tip ? `${err.message} ${err.tip}` : err.message;
}
