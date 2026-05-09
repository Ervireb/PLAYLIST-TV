import zipfile
import os

zip_path = './video-playlist-app.zip'
source_dir = './final'

file_count = 0
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, '.')
            zipf.write(file_path, arcname)
            file_count += 1

zip_size = os.path.getsize(zip_path)
print(f"ZIP archive created: {zip_path}")
print(f"Files included: {file_count}")
print(f"Archive size: {zip_size} bytes ({zip_size / 1024:.1f} KB)")
