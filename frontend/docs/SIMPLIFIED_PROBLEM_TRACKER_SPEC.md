# 🎯 **New Feature: Simplified LeetCode Problem Tracker**

## **Core Philosophy:**
- **Zero Manual Work**: Backend fetches user's solved problems automatically
- **Minimal Data Storage**: Only essential problem info (name + URL)
- **Focus on Review**: Simple reminder system for spaced repetition
- **Clean UX**: One-click setup, easy management

---

## 📋 **Complete Feature Specification**

### **Database Schema (Simplified)**

#### 1. **Problems Collection (Minimal)**
```javascript
{
  _id: ObjectId,
  leetcodeId: String, // LeetCode problem slug/ID
  title: String, // Problem name only
  url: String, // LeetCode problem URL (if available)
  difficulty: String, // "Easy", "Medium", "Hard" (optional)
  
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **UserSolvedProblems Collection (Wrapper)**
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User
  problemId: ObjectId, // Reference to Problems collection
  
  // User data
  notes: String, // 20-30 character limit
  isImportant: Boolean,
  hasReminder: Boolean,
  reminderInterval: Number, // days (1, 3, 7, 14, 30)
  nextReminderAt: Date,
  
  // Metadata
  addedAt: Date, // When user started tracking this
  lastReviewedAt: Date,
  reviewCount: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **Reminders Collection (Simple Queue)**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  userSolvedProblemId: ObjectId,
  
  scheduledAt: Date,
  status: String, // "pending", "completed", "cancelled"
  
  createdAt: Date
}
```

---

## 🔄 **User Flow & Features**

### **First-Time Experience:**
1. User clicks "Track Solved Problems" tab
2. **Onboarding Modal** appears explaining:
   - "We'll fetch your recent LeetCode solutions"
   - "Set reminders to review problems"
   - "Add notes to remember your approach"
3. User clicks "Get My Problems" button
4. Backend fetches last 10 solved problems from LeetCode GraphQL
5. Problems appear on the page instantly

### **Main Interface:**
```
┌─────────────────────────────────────────┐
│ Track Solved Problems                   │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Refresh Problems│ │ Set Reminders   │ │
│ └─────────────────┘ └─────────────────┘ │
│                                         │
│ ☐ Select All                           │
│                                         │
│ ☐ Two Sum                    [⭐] [🗑️] │
│   Notes: [Array + HashMap___________]   │
│   Next reminder: 3 days                 │
│                                         │
│ ☐ Add Two Numbers            [⭐] [🗑️] │
│   Notes: [Linked list simulation___]   │
│   No reminder set                       │
│                                         │
└─────────────────────────────────────────┘
```

### **Key Actions:**
- **Refresh Problems**: Fetch latest 10 solved problems
- **Set Reminders**: Bulk action for selected problems
- **Individual Actions**: Star (important), Delete (remove wrapper)
- **Notes**: Inline editing, 30 character limit
- **Reminder Options**: 1, 3, 7, 14, 30 days

---

## 🛠 **Technical Implementation**

### **Backend API Endpoints:**
```
GET /api/solved-problems/:userId
- Get user's tracked problems

POST /api/solved-problems/:userId/fetch
- Fetch recent problems from LeetCode GraphQL
- Create Problem objects if not exist
- Create UserSolvedProblem wrappers

PUT /api/solved-problems/:userId/:userSolvedProblemId
- Update notes, importance, reminders

DELETE /api/solved-problems/:userId/:userSolvedProblemId
- Remove wrapper (keep Problem object)

POST /api/solved-problems/:userId/bulk-reminders
- Set reminders for multiple problems
- Body: { userSolvedProblemIds, reminderInterval }
```

### **LeetCode GraphQL Integration:**
```javascript
// Fetch user's recent submissions
const query = `
  query recentSubmissions($username: String!, $limit: Int!) {
    recentSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
      url
    }
  }
`;
```

### **Frontend Components:**
```
src/pages/SolvedProblemsPage.jsx
src/components/SolvedProblems/
  ├── OnboardingModal.jsx
  ├── ProblemList.jsx
  ├── ProblemCard.jsx
  ├── BulkActions.jsx
  └── ReminderModal.jsx
```

---

## 🎨 **UI/UX Requirements**

### **Onboarding Modal:**
- Friendly explanation of the feature
- "Get My Problems" CTA button
- Loading state while fetching

### **Problem List:**
- Checkbox selection for bulk actions
- Inline notes editing (30 char limit)
- Star toggle for importance
- Delete button (removes wrapper only)
- Reminder status indicator

### **Bulk Actions Bar:**
- Appears when problems selected
- "Set Reminder" dropdown (1,3,7,14,30 days)
- "Mark Important" toggle
- "Remove Selected" action

### **Reminder System:**
- Simple notification system
- Mark as reviewed updates next reminder
- Automatic scheduling based on spaced repetition

---

## 📱 **Notification System**

### **Dashboard Integration:**
- Show count of due problems
- Quick access to review problems
- "Mark as Reviewed" action

### **Reminder Logic:**
- Simple intervals: 1, 3, 7, 14, 30 days
- Reset to 1 day if user struggles
- Extend interval if user finds it easy

---

## 🔧 **Context for Implementation**

### **Existing Codebase Integration:**
- Use existing User model and authentication
- Follow existing API patterns and error handling
- Integrate with existing UI components and styling
- Use existing navigation and layout structure

### **LeetCode Integration:**
- Leverage existing LeetCode services if available
- Add GraphQL client for recent submissions
- Handle rate limiting and errors gracefully

### **Database:**
- Use existing MongoDB connection
- Follow existing model patterns
- Add proper indexes for performance

### **Frontend:**
- Use existing UI component library
- Follow existing routing patterns
- Integrate with existing dashboard
- Match existing design system

---

## 🚀 **Success Criteria**

### **User Experience:**
- One-click setup (fetch problems automatically)
- Zero manual data entry required
- Simple reminder management
- Clean, intuitive interface

### **Technical:**
- Fast problem fetching (< 3 seconds)
- Reliable reminder notifications
- Efficient database queries
- Proper error handling

---

## 📋 **Implementation Checklist**

When implementing this feature, I'll need:

1. **Current codebase structure** (to understand existing patterns)
2. **Existing LeetCode integration** (to build upon)
3. **UI component library** (to maintain consistency)
4. **Database models** (to follow existing patterns)
5. **Authentication system** (to integrate properly)
6. **Routing structure** (to add new pages correctly)

---

## 🎯 **Key Differences from Previous Implementation**

### **Simplified Approach:**
- ✅ Auto-fetch from LeetCode (no manual entry)
- ✅ Minimal data storage (just problem name + URL)
- ✅ Simple wrapper objects for user data
- ✅ Basic reminder intervals (no complex SM-2 algorithm)
- ✅ Focus on ease of use over advanced features

### **User Benefits:**
- Zero setup friction
- Automatic problem discovery
- Simple reminder management
- Clean, focused interface
- No complex configuration needed

This simplified approach will be much more user-friendly and easier to maintain! 🎯