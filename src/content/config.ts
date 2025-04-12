import { z, defineCollection } from "astro:content";

const postCollection = defineCollection({
    schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        isPublished: z.boolean(),
        readingTime: z.number().optional(),
        tags: z.array(z.string()).optional(),
        heroImage: z.string().optional(),
        heroImageCaption: z.string().optional(),
    })
});

export const collections = {
    posts: postCollection,
}
