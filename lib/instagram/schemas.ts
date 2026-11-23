import { z } from "zod";

export const InstagramMediaItemSchema = z.object({
  id: z.string(),
  caption: z.string().optional(),
  mediaType: z.string().optional(),
  permalink: z.string().optional(),
  timestamp: z.string().optional(),
});

export type InstagramMediaItem = z.infer<typeof InstagramMediaItemSchema>;

export const InstagramRetrievedProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string().optional(),
  biography: z.string().optional(),
  profilePictureUrl: z.string().optional(),
  accountType: z.string().optional(),
  mediaCount: z.number().optional(),
  captions: z.array(z.string()).default([]),
  media: z.array(InstagramMediaItemSchema).default([]),
  retrievedAt: z.string(),
  source: z.literal("instagram_official_api"),
});

export type InstagramRetrievedProfile = z.infer<
  typeof InstagramRetrievedProfileSchema
>;

export const InstagramSessionPublicSchema = z.object({
  connected: z.literal(true),
  configured: z.literal(true),
  profile: InstagramRetrievedProfileSchema,
});

export type InstagramSessionPublic = z.infer<typeof InstagramSessionPublicSchema>;
