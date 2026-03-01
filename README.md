# SAR France Preprod Website

Hugo website for preprod.sarfrance.org

## Local Development

```bash
hugo server -D
```

Visit http://localhost:1313

## Deployment

The site automatically deploys to GitHub Pages when you push to the `main` branch.

## Setup GitHub Pages

1. Push this repository to GitHub
2. Go to repository Settings > Pages
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Configure your custom domain `preprod.sarfrance.org` in the Pages settings
5. Add a CNAME record in your DNS pointing to `<username>.github.io`

## Adding Content

```bash
hugo new content/posts/my-post.md
```
