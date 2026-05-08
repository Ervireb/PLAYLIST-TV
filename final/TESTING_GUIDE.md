# File Import Feature Testing Guide

## Test Files Created

The following test files have been created in the `/home/user/final/` directory:

1. **test_videos.csv** - Simple CSV with URLs only
2. **test_videos.txt** - TXT file with URLs and comments
3. **test_videos_with_headers.csv** - CSV with headers and multiple columns
4. **test_videos_semicolon.csv** - CSV with semicolon delimiter
5. **test_mixed_urls.txt** - TXT file with valid and invalid URLs

## Manual Testing Steps

### Test 1: Basic CSV Import
1. Open index.html in a browser
2. Click "Import File" button
3. Select `test_videos.csv`
4. Verify import dialog shows:
   - Total URLs: 5
   - Valid URLs: 5
   - Invalid URLs: 0
   - Duplicates: 0
5. Click "Add to Queue"
6. Verify 5 videos are added to playlist
7. Verify success toast message appears

### Test 2: TXT File Import with Comments
1. Clear the playlist
2. Click "Import File" button
3. Select `test_videos.txt`
4. Verify import dialog shows:
   - Total URLs: 4 (comment line ignored)
   - Valid URLs: 4
5. Click "Replace Queue"
6. Verify playlist is replaced with 4 videos

### Test 3: CSV with Headers
1. Click "Import File" button
2. Select `test_videos_with_headers.csv`
3. Verify URLs are correctly extracted from the URL column
4. Verify 3 videos are detected
5. Click "Add to Queue"

### Test 4: Semicolon Delimiter CSV
1. Click "Import File" button
2. Select `test_videos_semicolon.csv`
3. Verify semicolon-separated values are parsed correctly
4. Verify 3 valid URLs are found

### Test 5: Mixed Valid/Invalid URLs
1. Clear the playlist
2. Click "Import File" button
3. Select `test_mixed_urls.txt`
4. Verify import dialog shows:
   - Total URLs: 7
   - Valid URLs: 4 (YouTube, Vimeo, Coub only)
   - Invalid URLs: 3 (invalid-url.com, not-a-url, facebook.com)
5. Verify invalid URLs are reported
6. Click "Add to Queue"
7. Verify only 4 valid videos are added

### Test 6: Duplicate Detection
1. Add some videos manually to the playlist
2. Import a file containing the same URLs
3. Verify duplicates are detected and reported
4. Verify duplicate count is shown in import dialog

### Test 7: Cancel Import
1. Click "Import File" button
2. Select any test file
3. Click "Cancel" in the import dialog
4. Verify dialog closes without adding videos
5. Verify "Import cancelled" toast appears

### Test 8: Empty File
1. Create an empty file or file with only comments
2. Import the file
3. Verify "No valid video URLs found" message appears
4. Verify import dialog does not show

### Test 9: Invalid File Type
1. Try to select a file with wrong extension (e.g., .pdf, .doc)
2. Verify file input only accepts .csv and .txt files

### Test 10: Mobile Responsiveness
1. Open the app on a mobile device or use browser dev tools
2. Verify "Import File" button is properly sized
3. Verify import dialog is responsive
4. Verify action buttons stack vertically on small screens

## Expected Behavior

### File Processing
- Files are read asynchronously
- Loading message appears during processing
- File input is reset after processing (allows re-upload)

### URL Validation
- Only YouTube, Vimeo, and Coub URLs are accepted
- Invalid URLs are filtered out
- Duplicates within file are removed
- Duplicates in playlist are detected

### Import Dialog
- Shows comprehensive summary of import
- Three clear action options
- Can be closed by clicking outside or X button
- Background scrolling is disabled when open

### User Feedback
- Toast notifications for all actions
- Clear error messages for failures
- Success messages with counts
- Specific feedback for edge cases

## Browser Compatibility Testing

Test in the following browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Verify:
- FileReader API works correctly
- File input accepts correct file types
- Modal displays properly
- Responsive design works
- Toast notifications appear correctly

## Performance Testing

- Test with small files (5-10 URLs)
- Test with medium files (50-100 URLs)
- Test with large files (500+ URLs)
- Verify no lag or freezing
- Verify memory usage is reasonable

## Error Scenarios

Test the following error conditions:
1. Corrupted file (should show error message)
2. File with special characters
3. File with different encodings
4. Very long URLs
5. URLs with query parameters
6. Network interruption during file read

## Success Criteria

✅ All test files import correctly
✅ Valid URLs are properly detected
✅ Invalid URLs are filtered out
✅ Duplicates are detected
✅ Both CSV delimiters work (comma and semicolon)
✅ TXT comments are ignored
✅ Import dialog shows accurate information
✅ All three action buttons work correctly
✅ Toast notifications appear for all actions
✅ File input resets after processing
✅ Responsive design works on mobile
✅ No console errors
✅ Existing functionality remains intact

