# Business Feedback & Testimonials - Implementation Guide

## UX/UI Improvements

### 1. **Minimize interview repetition & reduce space**
- **Issue**: Interview is repetitive and takes too much screen space
- **Implementation**:
  - Add `max_questions` parameter to interviewer agent and set it to 3

### 2. **Change INPUT to TEXTAREA for business description**
- **Issue**: No space on screen for long text input
- **Implementation**:
  - In `index.html`: Change `<input id="business-description">` to `<textarea rows="4">`
  - Update CSS: `.form-group textarea { min-height: 80px; resize: vertical; }`
  - Keep 85% font-size (see #6)

### 3. **Download options with QR code**
- **Issue**: Need ability to download all results or just 2020s approach
- **Implementation**:
  - Add download buttons per presentation style in results section
  - New endpoint: `GET /api/presentations/:sessionId/pdf?style=2020s`
  - Use `pdfkit` or `puppeteer` to generate PDF with QR code pointing to web version
  - QR code: Use `qrcode` npm package, fixes link: `https://bizprez.bresleveloper.ai/`

### 4. **Button click emphasis (tooltip)**
- **Issue**: Users don't notice button clicks
- **Implementation**:
  - once interviewer is done, show tooltip on "create presentation" button
  - Add CSS animation on button click: `@keyframes pulse { ... }`
  - Show tooltip for 3s after click: "אפשר ליצור הצגה עצמית!"
  - Use CSS `::after` pseudo-element or simple `<span class="tooltip">`

### 5. **Username validation (English letters + numbers only)**
- **Issue**: Allow only alphanumeric usernames
- **Implementation**:
  - Client-side: Add pattern validation `<input pattern="[a-zA-Z0-9]+" required>`
  - Add `validateUsername()` in app.js: `return /^[a-zA-Z0-9]+$/.test(username)`
  - Server-side: Add validation in router.js auth endpoints before Supabase call

### 6. **Reduce all text to 85% size**
- **Issue**: Text too large
- **Implementation**:
  - In `styles.css` adjust all fonts to 85% of current value (whole numbers only)
  - Test on mobile to ensure readability

## Backend & Database Changes

### 7. **User history & session persistence**
- **Issue**: Lost conversation when leaving app, need to save user history
- **Implementation**:
  - **New Supabase tables**:
    ```sql
    CREATE TABLE user_sessions (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id),
      session_id UUID NOT NULL,
      business_profile JSONB,
      conversation JSONB,
      presentations JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
    ```
  - [created by user]
  - **API changes**:
    - On login: `GET /api/user/sessions` returns list of past sessions
    - Add "Load Previous Session" dropdown after login
    - `POST /api/session/reset` clears current session but keeps history
  - **Migration**: Move from file-based storage.js to Supabase for user data
  - Keep localStorage sessionId, add userId association

### 8. **Rating system (1-5 stars)**
- **Issue**: Let users rate results
- **Implementation**:
  - **New table**:
    ```sql
    CREATE TABLE presentation_ratings (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id),
      session_id UUID NOT NULL,
      style TEXT CHECK (style IN ('1980s', '2000s', '2020s')),
      rating INTEGER CHECK (rating BETWEEN 1 AND 5),
      feedback TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    ```
  - [created by user]
  - **UI**: Add star rating component under each presentation result
  - **Endpoint**: `POST /api/presentations/:sessionId/rate { style, rating, feedback? }`
  - Store in DB, display "תודה על הדירוג!" after submission

### 9. **Default to signup tab (not login)**
- **Issue**: Default should be signup for new users
- **Implementation**:
  - In `index.html`: Change `#tab-signup` to have `class="auth-tab active"`
  - Remove `active` from `#tab-login`
  - Show `#signup-form`, hide `#login-form` on page load
  - Update app.js initialization logic
  - save last login in browser for auto-login

## Future Features

### 10. **Payment integration (Cardcom)**
- **Research**: Cardcom REST API documentation
- **Implementation**:
  - New endpoint: `POST /api/payments/purchase-credits { amount, credits }`
  - Integrate Cardcom payment flow
  - On success callback: Update `user_credits` table
  - Add pricing page/modal


## Technical Notes

- All Hebrew text, maintain RTL layout
- Test on mobile after text size changes
- QR code should be high-contrast for scanning reliability
- add at end of footer version number, new version now is 0.0.2.0