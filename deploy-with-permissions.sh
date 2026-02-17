#!/bin/bash

# ============================================
# jol3.com Deployment Script with Permission Hardening
# ============================================

set -e  # Exit on error

# Configuration
SERVER="jol3.com"
PORT="2222"
USER="jol3"
REMOTE_DIR="public_html"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 jol3.com Deployment Pipeline${NC}"
echo "================================"

# Check if build exists
if [ ! -d "out" ]; then
    echo -e "${RED}❌ Build directory not found. Run 'npm run build' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build directory found with $(find out -type f | wc -l) files${NC}"

# Create deployment package
echo ""
echo -e "${YELLOW}📦 Preparing deployment package...${NC}"

# Create a deploy directory with proper structure
rm -rf .deploy-temp
mkdir -p .deploy-temp
cp -R out/* .deploy-temp/

# Create a permission fix script that will run on the server
cat > .deploy-temp/fix-permissions.sh << 'EOF'
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
EOF

chmod +x .deploy-temp/fix-permissions.sh

echo -e "${GREEN}✓ Deployment package ready${NC}"

# Upload using scp (will prompt for password)
echo ""
echo -e "${YELLOW}📤 Uploading files to ${SERVER}...${NC}"
echo "You'll be prompted for your password for each step."
echo ""

# First, backup existing files
echo "Creating backup of existing files..."
ssh -p ${PORT} ${USER}@${SERVER} "cd ~/ && mkdir -p backups && tar -czf backups/backup-\$(date +%Y%m%d-%H%M%S).tar.gz ${REMOTE_DIR}/* 2>/dev/null || true" || true

# Upload files
echo ""
echo "Uploading new files..."
scp -P ${PORT} -r .deploy-temp/* ${USER}@${SERVER}:~/${REMOTE_DIR}/

# Fix permissions
echo ""
echo -e "${YELLOW}🔐 Fixing permissions on server...${NC}"
ssh -p ${PORT} ${USER}@${SERVER} "bash ~/public_html/fix-permissions.sh && rm ~/public_html/fix-permissions.sh"

# Verify deployment
echo ""
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

ICONS_TO_CHECK=(
    "icons/folder.png"
    "icons/notepad.png"
    "icons/url-shortcut.png"
    "icons/brainjar.png"
)

ALL_OK=true

for icon in "${ICONS_TO_CHECK[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${SERVER}/${icon}")

    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "304" ]; then
        echo -e "${GREEN}✓${NC} ${icon} - HTTP ${HTTP_CODE}"
    else
        echo -e "${RED}✗${NC} ${icon} - HTTP ${HTTP_CODE} (FAILED)"
        ALL_OK=false
    fi
done

# Check main page
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${SERVER}/")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "304" ]; then
    echo -e "${GREEN}✓${NC} Main page - HTTP ${HTTP_CODE}"
else
    echo -e "${RED}✗${NC} Main page - HTTP ${HTTP_CODE} (FAILED)"
    ALL_OK=false
fi

# Cleanup
rm -rf .deploy-temp

echo ""
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "🌐 Your site is live at: ${GREEN}https://${SERVER}${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT SECURITY REMINDERS:${NC}"
    echo "1. Change your SSH password via cPanel"
    echo "2. Test all functionality on mobile and desktop"
    echo "3. Clear your browser cache if needed"
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  DEPLOYMENT COMPLETED WITH WARNINGS${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Some assets returned non-200 status codes."
    echo "This might be due to:"
    echo "1. ModSecurity rules blocking PNG files"
    echo "2. .htaccess rewrite rules"
    echo "3. Server caching (wait a few minutes)"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Log into cPanel"
    echo "2. Check ModSecurity settings"
    echo "3. Review .htaccess in public_html"
    echo "4. Contact hosting support if issues persist"
fi

echo ""
