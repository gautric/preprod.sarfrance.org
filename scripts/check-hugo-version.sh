#!/bin/bash
# Vérifie que la version Hugo locale correspond à celle définie dans les workflows CI.
# Peut être utilisé comme hook Git pre-push ou exécuté manuellement.

set -e

LOCAL_VERSION=$(hugo version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
CI_VERSION=$(grep -m1 'HUGO_VERSION:' .github/workflows/deploy.yml | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
PREVIEW_VERSION=$(grep -m1 'HUGO_VERSION:' .github/workflows/preview.yml | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')

echo "Hugo version check:"
echo "  Local:        ${LOCAL_VERSION:-NOT FOUND}"
echo "  deploy.yml:   ${CI_VERSION:-NOT FOUND}"
echo "  preview.yml:  ${PREVIEW_VERSION:-NOT FOUND}"

if [ -z "$LOCAL_VERSION" ]; then
    echo ""
    echo "⚠️  Hugo not found locally — skipping version check"
    exit 0
fi

if [ "$LOCAL_VERSION" != "$CI_VERSION" ] || [ "$LOCAL_VERSION" != "$PREVIEW_VERSION" ]; then
    echo ""
    echo "❌ Hugo version mismatch detected!"
    echo ""
    echo "   Your local Hugo ($LOCAL_VERSION) differs from CI."
    echo "   Update HUGO_VERSION in:"
    echo "     - .github/workflows/deploy.yml"
    echo "     - .github/workflows/preview.yml"
    echo ""
    echo "   Or update your local Hugo to match CI ($CI_VERSION)."
    exit 1
fi

echo ""
echo "✅ All Hugo versions in sync ($LOCAL_VERSION)"
