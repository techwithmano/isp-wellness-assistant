# Firebase Manual Setup Required

After the initial setup, you need to do these **2 important things manually** in Firebase Console:

---

## 🔥 Priority 1: Create Firestore Composite Index (REQUIRED)

When students view their test history, Firebase needs a composite index for the query.

### Why?
Your app queries: `where('userEmail', '==', email) AND orderBy('createdAt', 'desc')`
This requires a composite index.

### How to Create It:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `isp-wellness-assistant`

2. **Open Firestore Database**
   - Click "Build" → "Firestore Database" in the left sidebar
   - Go to the **"Indexes"** tab at the top

3. **Create the Index**
   - Click the **"Create Index"** button
   - **Collection ID**: `testResults`
   - **Fields to index**:
     - Field: `userEmail` → Order: **Ascending**
     - Field: `createdAt` → Order: **Descending**
   - Click **"Create Index"**

4. **Wait for Index to Build** (usually 1-2 minutes)
   - You'll see it in the "Indexes" tab
   - Status will change from "Building" to "Enabled" when ready

### ⚠️ Important:
- The app will show an error link when you first try to view test history
- Click that link - it will take you directly to create the index
- Or create it now to avoid the error

---

## 🔒 Priority 2: Update Firestore Security Rules (IMPORTANT for Production)

Your Firestore is currently in **test mode** which allows all reads/writes for 30 days. After that, it will deny all access unless you update the rules.

### Current Test Mode Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 1, 20);
    }
  }
}
```

### Recommended Production Rules:

1. **Go to Firestore Database → Rules tab**

2. **Replace the rules with:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone can read (needed for email-based lookup)
      allow read: if true;
      
      // Only allow updates (not creates) - coordinators create users
      allow update: if true; // You can add admin authentication later
      allow create: if false; // Only admins/coordinators create users
      allow delete: if false;
    }
    
    // Test Results collection
    match /testResults/{testId} {
      // Users can only read their own test results
      allow read: if request.auth == null || 
                     resource.data.userEmail == request.auth.token.email;
      
      // Anyone can create test results (when students complete tests)
      allow create: if true;
      
      // No updates or deletes (tests are immutable)
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

### ⚠️ Note for Now:
- The above rules include `request.auth` which requires Firebase Authentication
- **For now, you can use simpler rules if you're not using authentication:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads (for email lookups)
    match /users/{userId} {
      allow read: if true;
      allow update: if true; // Profile updates
      allow create: if false; // Only admins create
    }
    
    // Test results - allow all reads and creates
    match /testResults/{testId} {
      allow read, create: if true;
      allow update, delete: if false;
    }
  }
}
```

3. **Click "Publish"** to save the rules

---

## 📋 Optional: Set Up Firestore Indexes Tab Monitoring

1. Go to Firestore Database → **Indexes** tab
2. Enable notifications for index build status (optional)
3. Monitor for any new index requirements

---

## ✅ Quick Checklist

- [ ] **Create composite index for testResults collection** (REQUIRED - do this now!)
  - Collection: `testResults`
  - Fields: `userEmail` (Ascending) + `createdAt` (Descending)
  
- [ ] **Update Firestore security rules** (IMPORTANT - do before 30 days)
  - Replace test mode rules with production rules
  - Consider adding Firebase Authentication later for better security

---

## 🔗 Quick Links

- **Firebase Console**: https://console.firebase.google.com/
- **Your Project**: https://console.firebase.google.com/project/isp-wellness-assistant
- **Firestore Indexes**: https://console.firebase.google.com/project/isp-wellness-assistant/firestore/indexes
- **Firestore Rules**: https://console.firebase.google.com/project/isp-wellness-assistant/firestore/rules

---

## 🆘 If You See Index Errors

When you try to view test history, if you see an error like:
> "The query requires an index. You can create it here: [link]"

Just click the link in the error message - it will take you directly to create the required index!

---

**That's it!** Once you create the composite index, everything should work smoothly. The security rules can be updated later, but the index is needed now.

