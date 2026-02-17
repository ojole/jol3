#!/bin/bash
cd ~/public_html

echo "Setting directory permissions to 755..."
find . -type d -exec chmod 755 {} \;

echo "Setting file permissions to 644..."
find . -type f -exec chmod 644 {} \;

echo "Ensuring icons directory is accessible..."
chmod 755 icons 2>/dev/null || true
chmod 644 icons/*.png 2>/dev/null || true

echo "✓ Permissions fixed"
