import re

# Read the file
with open('fronend_web/src/pages/ChatPage.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Process line by line
new_lines = []
skip_next = False

for i, line in enumerate(lines):
    # Skip if previous line was a console.log that we removed
    if skip_next:
        skip_next = False
        continue
    
    # Check if line contains console.log
    if 'console.log(' in line:
        # Skip this line
        continue
    
    # Keep the line
    new_lines.append(line)

# Write back
with open('fronend_web/src/pages/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"✅ Removed console.log statements! Kept {len(new_lines)}/{len(lines)} lines")
