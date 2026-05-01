import type { CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blogPosts">;
export type BlogDirection = BlogPost["data"]["direction"];
export type BlogCategory = BlogPost["data"]["category"];

export const BLOG_DIRECTIONS = [
  { value: "all", label: "Все статьи" },
  { value: "marketplaces", label: "Маркетплейсы" },
  { value: "procurement", label: "Госзакупки" },
] as const;

export const BLOG_CATEGORIES = [
  { value: "all", label: "Все", icon: "layers" },
  { value: "news", label: "Новости", icon: "book" },
  { value: "finance", label: "Финансы", icon: "coins" },
  { value: "cash-gap", label: "Кассовый разрыв", icon: "chain" },
  { value: "law", label: "Законодательство", icon: "gavel" },
  { value: "cases", label: "Кейсы", icon: "briefcase" },
] as const;

export type BlogDirectionFilter = (typeof BLOG_DIRECTIONS)[number]["value"];
export type BlogCategoryFilter = (typeof BLOG_CATEGORIES)[number]["value"];

const directionLabels: Record<BlogDirection, string> = {
  marketplaces: "Маркетплейсы",
  procurement: "Госзаказ",
};

const categoryLabels: Record<BlogCategory, string> = {
  news: "Новости",
  finance: "Финансы",
  "cash-gap": "Кассовый разрыв",
  law: "Законодательство",
  cases: "Кейсы",
};

export const getBlogPostPath = (post: BlogPost) => `blog/${post.data.slug}/`;

export const getBlogBlockText = (block: any) =>
  block?.text ?? block?.children?.map((child: { text: string }) => child.text).join("") ?? "";

export const getBlogPostExcerpt = (post: BlogPost) =>
  getBlogBlockText(post.data.body.find((block) => block.type === "paragraph")) ?? "";

export const getBlogPostTags = (
  post: BlogPost,
  directionFilter: BlogDirectionFilter = "all",
) => {
  const tags = [{ label: categoryLabels[post.data.category], value: post.data.category }];

  if (directionFilter === "all") {
    return [
      { label: directionLabels[post.data.direction], value: post.data.direction },
      ...tags,
    ];
  }

  return tags;
};

export const formatBlogDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

export const sortBlogPosts = (posts: BlogPost[]) =>
  [...posts].sort((left, right) => left.data.order - right.data.order);

export const isBlogDirectionFilter = (
  value: string | null,
): value is BlogDirectionFilter =>
  BLOG_DIRECTIONS.some((direction) => direction.value === value);

export const isBlogCategoryFilter = (
  value: string | null,
): value is BlogCategoryFilter =>
  BLOG_CATEGORIES.some((category) => category.value === value);
