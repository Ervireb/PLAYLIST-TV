#!/usr/bin/env python3
"""
Script to update background color and create distribution ZIP for video playlist app
"""

import os
import zipfile
from pathlib import Path

def update_background_color():
    """Update the background color in styles.css to gray"""
    css_file = './final/css/styles.css'
    
    # Read the current CSS file
    with open(css_file, 'r') as f:
        content = f.read()
    
    # Replace the background color
    # Current: --bg-color: #f9fafb; (very light gray/white)
    # New: --bg-color: #f5f5f5; (light gray - maintains good contrast)
    updated_content = content.replace(
        '--bg-color: #f9fafb;',
        '--bg-color: #f5f5f5;'
    )
    
    # Write the updated content back
    with open(css_file, 'w') as f:
        f.write(updated_content)
    
    print("✅ Background color updated to gray (#f5f5f5)")
    print(f"   Updated file: {css_file}")
    return True

def create_zip_archive():
    """Create ZIP archive of the video playlist application"""
    
    source_dir = './final'
    zip_filename = './video-playlist-app.zip'
    
    # List of all files to include
    files_to_include = [
        'index.html',
        'README.md',
        'TESTING_GUIDE.md',
        'FILE_IMPORT_IMPLEMENTATION.md',
        'ENHANCEMENT_VERIFICATION.md',
        'IMPLEMENTATION_SUMMARY.md',
        'test_videos.csv',
        'test_videos.txt',
        'test_videos_with_headers.csv',
        'test_videos_semicolon.csv',
        'test_mixed_urls.txt',
        'css/styles.css',
        'js/playlist.js',
        'js/video-player.js',
        'js/app.js'
    ]
    
    print("\n📦 Creating ZIP archive...")
    
    # Create ZIP file with compression
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in files_to_include:
            full_path = os.path.join(source_dir, file_path)
            if os.path.exists(full_path):
                # Add file to ZIP maintaining directory structure
                zipf.write(full_path, file_path)
                print(f"   ✓ Added: {file_path}")
            else:
                print(f"   ✗ Missing: {file_path}")
    
    return zip_filename, files_to_include

def verify_zip_contents(zip_filename):
    """Verify the contents of the created ZIP file"""
    
    print(f"\n🔍 Verifying ZIP archive: {zip_filename}")
    
    with zipfile.ZipFile(zip_filename, 'r') as zipf:
        file_list = zipf.namelist()
        
        print(f"\n📋 ZIP Contents ({len(file_list)} files):")
        print("=" * 60)
        
        # Group files by directory
        root_files = []
        css_files = []
        js_files = []
        
        for filename in sorted(file_list):
            if filename.startswith('css/'):
                css_files.append(filename)
            elif filename.startswith('js/'):
                js_files.append(filename)
            else:
                root_files.append(filename)
        
        # Display root files
        print("\n📄 Root Files:")
        for f in root_files:
            info = zipf.getinfo(f)
            size = info.file_size
            print(f"   • {f} ({size:,} bytes)")
        
        # Display CSS files
        print("\n🎨 CSS Files:")
        for f in css_files:
            info = zipf.getinfo(f)
            size = info.file_size
            print(f"   • {f} ({size:,} bytes)")
        
        # Display JS files
        print("\n⚙️  JavaScript Files:")
        for f in js_files:
            info = zipf.getinfo(f)
            size = info.file_size
            print(f"   • {f} ({size:,} bytes)")
    
    # Get ZIP file size
    zip_size = os.path.getsize(zip_filename)
    zip_size_kb = zip_size / 1024
    
    print("\n" + "=" * 60)
    print(f"\n📊 Archive Statistics:")
    print(f"   • Total files: {len(file_list)}")
    print(f"   • Archive size: {zip_size:,} bytes ({zip_size_kb:.2f} KB)")
    print(f"   • Location: {os.path.abspath(zip_filename)}")
    
    return len(file_list), zip_size

def main():
    """Main execution function"""
    
    print("=" * 60)
    print("🚀 Video Playlist App - Distribution Preparation")
    print("=" * 60)
    
    # Step 1: Update background color
    print("\n📝 Step 1: Updating Background Color")
    print("-" * 60)
    update_background_color()
    
    # Step 2: Create ZIP archive
    print("\n📦 Step 2: Creating Distribution Archive")
    print("-" * 60)
    zip_filename, expected_files = create_zip_archive()
    
    # Step 3: Verify ZIP contents
    print("\n✅ Step 3: Verification")
    print("-" * 60)
    file_count, zip_size = verify_zip_contents(zip_filename)
    
    # Final summary
    print("\n" + "=" * 60)
    print("🎉 Distribution Package Ready!")
    print("=" * 60)
    print(f"\n✅ Background color: Changed to gray (#f5f5f5)")
    print(f"✅ ZIP archive: {zip_filename}")
    print(f"✅ Files included: {file_count}")
    print(f"✅ Archive size: {zip_size / 1024:.2f} KB")
    
    print("\n📥 Download Instructions:")
    print("-" * 60)
    print("1. The ZIP file is located at: ./video-playlist-app.zip")
    print("2. Download the file from the file browser/sidebar")
    print("3. Extract the ZIP file to your desired location")
    print("4. Open index.html in a web browser to run the application")
    print("5. No additional setup or dependencies required!")
    
    print("\n📝 What's Included:")
    print("-" * 60)
    print("• Complete video playlist web application")
    print("• Multi-platform support (YouTube, Vimeo, Coub)")
    print("• File import functionality (CSV, TXT)")
    print("• Loop mode and fullscreen persistence")
    print("• Settings panel for customization")
    print("• Comprehensive documentation and test files")
    print("• Updated gray background color for better aesthetics")
    
    print("\n" + "=" * 60)
    print("✨ All tasks completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()
