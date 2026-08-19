# Optimize Images

Automatically detect and optimize images in `static/` that exceed 2 MB. Converts oversized PNGs (photos) to JPG and resizes all images to a maximum of 2000×2000 pixels at 85% JPEG quality.

## When to use

Run this skill whenever new images are added to the repository (especially in `static/images/phototheque/`) or when asked to optimize images.

## Steps

1. **Find oversized images** — scan `static/images/` for files over 2 MB (PNG, JPG, JPEG).

2. **Classify and convert**:
   - **PNG photos** (non-icon, non-logo PNGs over 2 MB): convert to JPG with `magick "$f" -resize "2000x2000>" -quality 85 "${f%.png}.jpg"`, then delete the original PNG.
   - **JPG/JPEG over 2 MB**: resize in place with `magick "$f" -resize "2000x2000>" -quality 85 "$f"`.
   - **Skip**: PNGs under 2 MB, SVGs, anything in `static/images/icons/` (logos, favicons need transparency or exact dimensions).

3. **Update content references** — for any PNG→JPG conversion, search all files in `content/` for the old `.png` path and replace with `.jpg`:
   ```bash
   sed -i '' "s|/images/path/old-name.png|/images/path/old-name.jpg|g" content/**/*.md
   ```

4. **Verify build** — run `hugo --minify` to confirm no broken references.

5. **Report** — list converted files with before/after sizes.

## Rules

- Never touch files in `static/images/icons/` (favicons, logos, SVG flags need exact format).
- Never convert PNGs that require transparency (logos, diagrams). If unsure, check with `magick identify -format "%[channels]" file.png` — if it has an alpha channel AND uses it, keep as PNG.
- Maximum output dimension: 2000px on the longest side.
- JPEG quality: 85 (good balance of quality vs size for photos).
- The threshold is 2 MB — files under this size are left alone.
- Requires ImageMagick (`magick` command). Check availability first.
