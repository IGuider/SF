import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const faq = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/faq' }),
	schema: z.object({
		question: z.string(),
		answer: z.string(),
		order: z.number().int().positive(),
	}),
});

const products = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
	schema: z.object({
		modifier: z.enum(['credit-line', 'early-payouts', 'seasonal-plan', 'classic-plan']),
		title: z.string(),
		description: z.string(),
		points: z.array(z.string()).min(1),
		order: z.number().int().positive(),
	}),
});

const clients = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/clients' }),
	schema: z.object({
		company: z.string(),
		industry: z.string(),
		coverVariant: z.enum(['magnifier', 'focus']),
		beforeLead: z.string(),
		beforeAccent: z.string(),
		afterLead: z.string(),
		afterAccent: z.string(),
		order: z.number().int().positive(),
	}),
});

const blogPosts = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/blog-posts' }),
	schema: z.object({
		title: z.string(),
		href: z.string(),
		order: z.number().int().positive(),
	}),
});

const socialLinks = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/social-links' }),
	schema: z.object({
		label: z.string(),
		href: z.string(),
		icon: z.enum(['vk', 'telegram', 'max']),
		order: z.number().int().positive(),
	}),
});

const featureCards = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/feature-cards' }),
	schema: z.object({
		title: z.string(),
		text: z.string(),
		modifier: z.enum(['primary', 'top', 'bottom', 'accent']),
		order: z.number().int().positive(),
	}),
});

const steps = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/steps' }),
	schema: z.object({
		number: z.string(),
		title: z.string(),
		description: z.string(),
		ctaLabel: z.string().optional(),
		order: z.number().int().positive(),
	}),
});

export const collections = {
	faq,
	products,
	clients,
	blogPosts,
	socialLinks,
	featureCards,
	steps,
};
