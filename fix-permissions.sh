#!/bin/bash

# ============================================
# Icon Permission Fix Script
# Run this on the server via SSH
# ============================================

cd ~/public_html

echo "🔐 Fixing permissions for all files and directories..."
echo ""

# Fix directory permissions (755 = rwxr-xr-x)
echo "Setting directory permissions to 755..."
find . -type d -exec chmod 755 {} \;

# Fix file permissions (644 = rw-r--r--)
echo "Setting file permissions to 644..."
find . -type f -exec chmod 644 {} \;

echo ""
echo "✓ Base permissions set"
echo ""

# Specifically ensure icons directory and files are accessible
echo "Ensuring icons directory is accessible..."
chmod 755 icons 2>/dev/null || true
chmod 644 icons/*.png 2>/dev/null || true
chmod 644 icons/*.jpg 2>/dev/null || true
chmod 644 icons/*.gif 2>/dev/null || true

echo ""
echo "✓ Icon permissions fixed"
echo ""

# List icon permissions for verification
echo "Icon file permissions:"
ls -la icons/ | grep -E '\.(png|jpg|gif)$'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PERMISSIONS FIXED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Test the site: https://jol3.com"
echo "2. Clear browser cache if needed"
echo "3. Check that all icons load correctly"
