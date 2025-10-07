# Quick Testing Guide - Game Entry Improvements

## Prerequisites
1. Start the development server: `npm run dev` (or `npm start`)
2. Open browser DevTools (F12)
3. Open Application tab → Storage → Session Storage

## Test 1: Final Score Entry - Persistence

### Steps:
1. Navigate to Game Entry → Select "Final Score Entry"
2. Enter a score: `185`
3. Enter strikes: `3`
4. Enter spares: `4`
5. Add a ball (optional)
6. **DO NOT SAVE** - Refresh the page (F5 or Ctrl+R)
7. Navigate back to Game Entry → Final Score Entry

### Expected Result:
✅ Score 185, 3 strikes, 4 spares should be restored
✅ Ball selection should be restored (if added)

### Check Session Storage:
- Key: `bowling_entry_final_score`
- Should contain your entered data with timestamp

---

## Test 2: Frame by Frame Entry - Persistence

### Steps:
1. Navigate to Game Entry → Select "Frame by Frame Entry"
2. Enter frame 1, throw 1: Click "Strike" (10 pins)
3. Enter frame 2, throw 1: Click "7"
4. Enter frame 2, throw 2: Click "Spare" (/)
5. Select a ball for frame 2, throw 2
6. **DO NOT SAVE** - Refresh the page
7. Navigate back to Game Entry → Frame by Frame Entry

### Expected Result:
✅ Frame 1: Strike (X) should be there
✅ Frame 2: 7 + Spare should be there
✅ Selected ball for frame 2 should be restored
✅ Should auto-select frame 3 or stay on frame 2

### Check Session Storage:
- Key: `bowling_entry_frame_by_frame`
- Should contain frames array and selectedFrame

---

## Test 3: Pin by Pin Entry - Persistence

### Steps:
1. Navigate to Game Entry → Select "Pin by Pin Entry"
2. Frame 1, Throw 1: Click pins 1, 3, 5, 7, 9 (5 pins)
3. Click "Confirm 5 Pins"
4. Frame 1, Throw 2: Click remaining 5 pins
5. Click "Confirm 5 Pins"
6. **DO NOT SAVE** - Refresh the page
7. Navigate back to Game Entry → Pin by Pin Entry

### Expected Result:
✅ Should be on frame 2 (or frame 1 if not auto-advanced)
✅ Frame 1 scorecard should show the throws
✅ Pin selections should be preserved in frameThrowPins state

### Check Session Storage:
- Key: `bowling_entry_pin_by_pin`
- Should contain currentFrame, currentThrow, frameThrowPins

---

## Test 4: Mobile Responsiveness

### Steps:
1. Open DevTools (F12)
2. Click device toolbar icon (or Ctrl+Shift+M)
3. Select "iPhone SE" or "iPhone 12 Pro"
4. Test each entry mode

### Check Each Mode:
✅ All buttons are tappable (no accidental clicks)
✅ No horizontal scrolling
✅ Text doesn't overflow or wrap awkwardly
✅ Grids stack properly on mobile
✅ Ball selector modal fits on screen
✅ Quick select buttons are large enough to tap

### Specific Checks:
- **Final Score**: Score input, strikes/spares inputs, ball selector
- **Frame by Frame**: Frame grid (5 columns), quick select buttons, number grid (5 columns)
- **Pin by Pin**: Pin deck scales, quick select buttons, ball selector

---

## Test 5: Error Handling - Network Failure

### Steps:
1. Open DevTools → Network tab
2. Click "Offline" in the throttling dropdown
3. Try to complete and save a game in any mode

### Expected Result:
✅ Should show user-friendly error message
✅ Should mention network/connection issue
✅ Data should still be in sessionStorage
✅ Can retry when back online

### To Test Retry:
1. Keep the error visible
2. Go back online (remove "Offline" mode)
3. Click save again
✅ Should succeed this time

---

## Test 6: Validation Errors

### Final Score Entry:
1. Enter score: `350` (invalid - max is 300)
2. Try to save

✅ Should show validation error

### Frame by Frame Entry:
1. Clear all frames
2. Try to save

✅ Should show "Please enter at least one throw"

### Pin by Pin Entry:
1. Start game but don't complete all 10 frames
2. Try to save

✅ Should not allow save (button disabled or shows error)

---

## Test 7: Ball Selector Component

### Steps:
1. Open any entry mode with ball selection
2. Click "Add Ball" or "Select Ball"
3. Test both Personal Balls and House Balls sections
4. Select a ball
5. Try to change the ball
6. Try to clear/remove the ball

### Expected Result:
✅ Modal opens smoothly
✅ Can select personal ball (if you have any)
✅ Can select house ball (8-16 lbs)
✅ Selected ball displays with color and weight
✅ Can change selection
✅ Can remove ball (X button or "No ball selected")

---

## Test 8: Quick Select Buttons (Frame by Frame)

### Steps:
1. Go to Frame by Frame Entry
2. Select Frame 1
3. For 1st throw, test all quick select buttons:
   - Click "Gutter" → Should show 0
   - Click "Strike" → Should show X
   - Click "Half" → Should show 5
   - Clear and enter any number 1-9
4. For 2nd throw (if not strike):
   - Click "Spare" → Should complete to 10
   - Test "Gutter" and "Half" buttons

### Expected Result:
✅ All quick select buttons work
✅ Spare button only shows on 2nd throw
✅ Visual feedback when clicking (active state)
✅ Auto-advances to next frame when complete

---

## Test 9: Complete Game Flow

### Full Game Test:
1. Choose Pin by Pin Entry (most complete)
2. Enter a complete 10-frame game
3. Watch the scorecard update
4. Complete frame 10 (may have 3 throws)
5. Verify "Game Complete" shows
6. Save the game

### Expected Result:
✅ All frames calculate correctly
✅ Strikes and spares bonus correctly
✅ 10th frame allows 3 throws if strike/spare
✅ Total score is accurate
✅ Game saves successfully
✅ Redirects to dashboard
✅ SessionStorage cleared after save

---

## Test 10: Quick Select Legend

### Steps:
1. Go to Frame by Frame Entry
2. Scroll down past the frame selection
3. Look for "Quick Actions" legend box

### Expected Result:
✅ Legend explains each quick select button:
  - Strike: All 10 pins knocked down (1st throw)
  - Spare: Remaining pins knocked down (2nd throw)
  - Gutter: No pins knocked down (0)
  - Half: 5 pins knocked down

---

## Common Issues to Check

### If persistence doesn't work:
- Check browser console for errors
- Verify sessionStorage is enabled (not private/incognito mode)
- Check that ENTRY_MODE constant is defined

### If UI looks broken on mobile:
- Clear browser cache
- Check for CSS conflicts
- Verify Tailwind classes are being applied

### If errors aren't caught:
- Check browser console for unhandled promise rejections
- Verify withErrorHandling is imported correctly
- Check that error messages display in UI

### If balls don't load:
- Check network tab for API call to /balls
- Verify backend is running
- Check authentication token

---

## Performance Check

### Desktop:
1. Open Chrome DevTools → Performance
2. Start recording
3. Navigate through entry modes
4. Stop recording

✅ No long tasks (>50ms)
✅ Smooth animations (60fps)
✅ Fast initial render (<1s)

### Mobile:
1. Use Chrome DevTools device emulation
2. Enable CPU throttling (4x slowdown)
3. Test interactions

✅ Still responsive
✅ Buttons react quickly
✅ No jank/stuttering

---

## Cleanup After Testing

1. Complete and save a game to clear sessionStorage
2. Or manually clear: DevTools → Application → Session Storage → Clear All
3. Close DevTools
4. Exit device emulation mode

---

## Report Issues

If you find any issues:
1. Note the entry mode (Final Score, Frame by Frame, Pin by Pin)
2. Note the steps to reproduce
3. Check browser console for errors
4. Note device/browser (Chrome, Firefox, Safari, mobile, etc.)
5. Take screenshot if visual issue

---

## Success Criteria

All tests pass means:
✅ Data persists across refreshes for all entry modes
✅ Data clears after successful save
✅ Error handling works for network failures
✅ Validation prevents invalid data
✅ Mobile UI is responsive with no overlap
✅ Touch targets are appropriate size
✅ Ball selector works consistently
✅ Quick select buttons work and have legend
✅ Complete game flow works end-to-end
✅ Performance is acceptable on mobile

---

## Next Steps After Testing

Once all tests pass:
1. Consider adding more extensive test coverage (unit tests, E2E)
2. Gather user feedback on UX improvements
3. Monitor for any issues in production
4. Consider additional enhancements from GAME_ENTRY_IMPROVEMENTS.md

