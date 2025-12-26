import re

# Read the file
with open('fronend_web/src/pages/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all console.log statements
# Pattern 1: Single line console.log
content = re.sub(r'\s*console\.log\([^;]*\);?\n', '', content)

# Pattern 2: Multi-line console.log
content = re.sub(r'\s*console\.log\([^)]*\)[;,]?\n', '', content)

# Pattern 3: console.log in JSX (with curly braces)
content = re.sub(r'\s*\{console\.log\([^}]*\)\}\n', '', content)

# Write back
with open('fronend_web/src/pages/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Removed all console.log statements!")
