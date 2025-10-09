# PWA Authentication Troubleshooting Guide

## 🚨 Quick Emergency Fixes

If a user reports they cannot log in, try these steps in order:

### Option 1: Clear Browser Data (Recommended)
1. Open browser settings
2. Clear browsing data
3. Select "Cached images and files" and "Cookies and site data"
4. Clear data for the last 24 hours
5. Refresh the PWA
6. Try logging in again

### Option 2: Use Developer Tools (For Tech-Savvy Users)
1. Open the PWA
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to Application tab → Storage
4. Click "Clear site data"
5. Refresh the page
6. Try logging in

### Option 3: Hard Refresh
1. On the login page
2. Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
3. Try logging in

### Option 4: Uninstall and Reinstall (Last Resort)
⚠️ **This should NOT be needed after the fix is deployed!**
1. Go to device settings
2. Find the installed PWA
3. Uninstall it
4. Go back to the website
5. Install the PWA again
6. Log in

---

## 🔍 Diagnostic Commands

Run these in the browser console (F12) to diagnose issues:

### Check if user is "authenticated" but with expired token
```javascript
// Check localStorage
const token = localStorage.getItem('authToken');
const user = localStorage.getItem('user');
console.log('Has token:', !!token);
console.log('Has user data:', !!user);

// If has token, check expiration
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = new Date(payload.exp * 1000);
    const isExpired = Date.now() > payload.exp * 1000;
    console.log('Token expires at:', expiresAt.toLocaleString());
    console.log('Is expired:', isExpired);
    
    if (isExpired) {
      console.log('🔴 PROBLEM: User has expired token in localStorage');
      console.log('🔧 FIX: Clear localStorage and refresh');
    }
  } catch (e) {
    console.error('Invalid token format:', e);
  }
}
```

### Check service worker status
```javascript
// Check if service worker is registered
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) {
      console.log('Service Worker registered');
      console.log('State:', reg.active?.state);
      console.log('Script URL:', reg.active?.scriptURL);
    } else {
      console.log('No service worker registered');
    }
  });
} else {
  console.log('Service Workers not supported');
}
```

### Check cache status
```javascript
// List all caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('Total caches:', cacheNames.length);
    console.log('Cache names:', cacheNames);
    
    // Check for auth-related caches
    const authCaches = cacheNames.filter(name => 
      name.includes('auth') || 
      name.includes('api') || 
      name.includes('runtime')
    );
    console.log('Auth/API caches:', authCaches);
  });
}
```

### Manual cache clear (if cacheManager is not available)
```javascript
// Clear all caches manually
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
  }).then(() => {
    console.log('✅ All caches cleared');
    console.log('🔄 Refresh the page and try logging in');
  });
}
```

### Complete reset (nuclear option)
```javascript
// Clear EVERYTHING
async function completeReset() {
  console.log('🚨 Starting complete reset...');
  
  // Clear localStorage
  localStorage.clear();
  console.log('✅ localStorage cleared');
  
  // Clear sessionStorage
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');
  
  // Clear all caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('✅ All caches cleared');
  }
  
  // Unregister service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(r => r.unregister()));
    console.log('✅ Service worker unregistered');
  }
  
  // Clear IndexedDB
  if ('indexedDB' in window) {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      indexedDB.deleteDatabase(db.name);
    }
    console.log('✅ IndexedDB cleared');
  }
  
  console.log('🎉 Complete reset finished!');
  console.log('🔄 Refresh the page to start fresh');
}

// Run it
completeReset();
```

---

## 🐛 Common Error Messages and Solutions

### "Invalid email/username or password" (but credentials are correct)
**Cause:** Service worker is serving a cached 401 response

**Solution:**
```javascript
// Clear caches and try again
caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
).then(() => location.reload());
```

### "Token expired" immediately after login
**Cause:** Old expired token still in localStorage

**Solution:**
```javascript
// Clear auth data and refresh
localStorage.removeItem('authToken');
localStorage.removeItem('user');
location.reload();
```

### Login button doesn't respond / loading spinner forever
**Cause:** Network request stuck or being blocked by service worker

**Solution:**
```javascript
// Check network tab in DevTools
// If you see pending requests, clear caches:
caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
).then(() => location.reload());
```

### "Your session has expired" on every page load
**Cause:** Token is actually expired, need to log in again

**Solution:**
1. This is normal behavior after 30 days or token expiration
2. Simply log in again with your credentials
3. Token will be refreshed

### App logs me out randomly
**Possible Causes:**
1. Token actually expired (check console logs)
2. Backend server restarted (clears session data)
3. Network issues during token refresh

**Solution:**
```javascript
// Check if token is valid
const token = localStorage.getItem('authToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresAt = new Date(payload.exp * 1000);
  console.log('Token expires:', expiresAt);
  console.log('Time until expiry:', (payload.exp * 1000 - Date.now()) / 1000 / 60, 'minutes');
}
```

---

## 📊 Expected Console Logs

### Normal Login Flow
```
[AUTH] Login attempt { identifier: "user@example.com" }
[CACHE] Clearing all caches { reason: "pre_login" }
[API] API Request { method: "POST", url: "/auth/login" }
[API] API Response { method: "POST", url: "/auth/login", status: 200 }
[AUTH] Login successful { userId: 123, username: "user" }
```

### Normal Logout Flow
```
[AUTH] User logout { userId: 123, username: "user" }
[CACHE] Clearing all caches { reason: "logout" }
[CACHE] All caches cleared { clearedCaches: 3 }
```

### Token Expiration on App Load
```
[AUTH] Initializing authentication store
[AUTH] Token validation on init { isExpired: true }
[AUTH] Token expired on initialization - clearing auth state
[CACHE] Clearing all caches { reason: "expired_token" }
```

### Successful Token Refresh
```
[API] API Request { method: "POST", url: "/auth/refresh" }
[API] API Response { method: "POST", url: "/auth/refresh", status: 200 }
[AUTH] Token refreshed successfully { userId: 123 }
```

---

## 🛠️ Developer Testing Commands

### Simulate token expiration
```javascript
// Get current token
const token = localStorage.getItem('authToken');

// Decode it
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));

// Set expiration to past
payload.exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

// Re-encode (this is just for testing - won't actually work with backend)
// For real testing, you need to modify the backend or wait for natural expiration
console.log('Original expiry:', new Date(JSON.parse(atob(parts[1])).exp * 1000));
console.log('To really test, wait for natural expiration or modify backend token TTL');
```

### Force service worker update
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) {
      reg.update().then(() => {
        console.log('✅ Service worker update check triggered');
      });
    }
  });
}
```

### Check all storage usage
```javascript
if (navigator.storage && navigator.storage.estimate) {
  navigator.storage.estimate().then(estimate => {
    const used = (estimate.usage / 1024 / 1024).toFixed(2);
    const quota = (estimate.quota / 1024 / 1024).toFixed(2);
    const percent = ((estimate.usage / estimate.quota) * 100).toFixed(2);
    
    console.log(`Storage used: ${used} MB / ${quota} MB (${percent}%)`);
    console.log('Breakdown:', estimate);
  });
}
```

---

## 📞 What to Tell Support

If you need to escalate to technical support, provide:

1. **Browser and OS:** Chrome 118 on Windows 11 / Safari on iOS 17, etc.
2. **Steps to reproduce:** Exact steps you took
3. **Console logs:** Copy the console output (F12 → Console tab)
4. **Network logs:** Screenshots of Network tab showing failed requests
5. **Storage status:** Run the diagnostic commands above and share output
6. **Error messages:** Exact error messages you see
7. **When it started:** "Working yesterday, broken today" or "Never worked"

---

## ✅ Verification Checklist

After any fix attempt, verify these work:

- [ ] Can log in with valid credentials
- [ ] Can log out successfully
- [ ] Can log in again after logging out
- [ ] No console errors during login
- [ ] Network tab shows 200 status for /auth/login
- [ ] No cached auth responses being served
- [ ] Service worker is registered and active
- [ ] Token is stored in localStorage after login
- [ ] User data is stored in localStorage after login

---

## 🎯 Prevention Tips

To avoid auth issues in the future:

1. **Keep the PWA updated** - Accept update notifications
2. **Don't manually edit localStorage** - Unless debugging
3. **Log out properly** - Don't just close the app
4. **Good network connection** - Auth requires backend communication
5. **Report issues early** - Don't wait until completely locked out

---

**Last Updated:** October 9, 2025
**Version:** 1.0 (Post-fix)
