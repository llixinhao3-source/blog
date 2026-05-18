import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    category: z.enum(['hardware', 'ai', 'cuda', 'guide']),
    tags: z.array(z.string()),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    music_id: z.string().optional(),
    golden_quote: z.string().optional(),
    scene_theme: z.enum(['cosmic', 'aurora', 'ember', 'forest', 'void']).optional(),
    card_rarity: z.enum(['common', 'rare', 'epic']).optional(),
  }),
});

export const collections = {
  posts: postsCollection,
};
