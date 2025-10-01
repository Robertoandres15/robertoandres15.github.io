import os
import re

# Get all API route files
api_dir = "app/api"
route_files = []

for root, dirs, files in os.walk(api_dir):
    for file in files:
        if file == "route.ts":
            route_files.append(os.path.join(root, file))

print(f"[v0] Found {len(route_files)} API route files")

# Process each file
files_updated = 0
files_skipped = 0

for file_path in route_files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file already has the dynamic export
        if 'export const dynamic' in content:
            print(f"[v0] Skipping {file_path} - already has dynamic export")
            files_skipped += 1
            continue
        
        # Find the first export async function
        match = re.search(r'^(export async function (GET|POST|PUT|DELETE|PATCH))', content, re.MULTILINE)
        
        if not match:
            print(f"[v0] Skipping {file_path} - no export async function found")
            files_skipped += 1
            continue
        
        # Insert the dynamic export before the first export async function
        insert_pos = match.start()
        
        # Add the dynamic export with proper spacing
        new_content = (
            content[:insert_pos] +
            'export const dynamic = "force-dynamic"\n\n' +
            content[insert_pos:]
        )
        
        # Write the updated content back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"[v0] Updated {file_path}")
        files_updated += 1
        
    except Exception as e:
        print(f"[v0] Error processing {file_path}: {e}")

print(f"\n[v0] Summary:")
print(f"[v0] Files updated: {files_updated}")
print(f"[v0] Files skipped: {files_skipped}")
print(f"[v0] Total files: {len(route_files)}")
