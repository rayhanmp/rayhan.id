import { z, defineCollection } from "astro:content";
import { getReadingTime } from '../utils/readingTime';

const postCollection = defineCollection({
    schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        is_published: z.boolean(),
        readingTime: z.number().optional()
    })
});

export const collections = {
    posts: postCollection,
}
