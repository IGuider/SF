// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
const repository = process.env.GITHUB_REPOSITORY ?? '';
const repositoryOwner = process.env.GITHUB_REPOSITORY_OWNER ?? '';
const repositoryName = repository.split('/')[1] ?? '';
const isUserSite = repositoryName === `${repositoryOwner}.github.io`;
const githubPagesSite = repositoryOwner
  ? `https://${repositoryOwner}.github.io`
  : undefined;
const githubPagesBase =
  repositoryName && !isUserSite ? `/${repositoryName}` : undefined;

export default defineConfig({
  site: githubPagesSite,
  base: githubPagesBase,
  server: {
    host: '127.0.0.1',
    allowedHosts: ['.lhr.life'],
  },
});
