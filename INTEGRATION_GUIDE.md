# Login & Forgot Password Integration Guide

## ✅ What's Already Integrated

I've successfully integrated the login and forgot password functionality into your hotel management system:

### 1. **Forgot Password Page Created**

- Location: `src/pages/auth/ForgotPassword.tsx`
- Features:
  - Email validation
  - Loading states
  - Success screen
  - Navigation back to login
  - Matches the same design as login page

### 2. **Updated Login Page**

- "Forgot?" link now navigates to forgot password page
- Uses proper navigation instead of anchor tag

### 3. **Added Routing**

- Route `/forgot-password` added to App.tsx
- ForgotPassword component imported

---

## 🔧 Next Steps for Full Backend Integration

### If Another Developer Provided API Files:

1. **Ask them for:**

   - API service files (e.g., `authService.ts`, `api.ts`)
   - Environment configuration (API endpoints)
   - Authentication token handling logic
   - Any middleware or interceptors

2. **Place files in:**
   ```
   src/
     services/
       authService.ts     (login, logout, forgot password APIs)
       api.ts            (axios configuration, interceptors)
     utils/
       tokenStorage.ts   (store/retrieve JWT tokens)
   ```

### To Connect Real API:

#### In `src/pages/auth/Login.tsx`:

Replace the demo login in `useAuth` hook with real API:

```typescript
// Currently using mock authentication
const success = await login(email, password, rememberMe);

// Replace with:
import { loginAPI } from "../../services/authService";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... validation code ...

  setIsLoading(true);
  try {
    const response = await loginAPI(email, password);
    const { token, user } = response.data;

    // Store token
    localStorage.setItem("authToken", token);
    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
    }

    // Update auth context
    login(user);
    navigate("/dashboard");
  } catch (error) {
    setErrors({ password: "Invalid credentials" });
  } finally {
    setIsLoading(false);
  }
};
```

#### In `src/pages/auth/ForgotPassword.tsx`:

Replace line 35-37 with real API:

```typescript
// Currently:
await new Promise((resolve) => setTimeout(resolve, 1500));

// Replace with:
import { forgotPasswordAPI } from "../../services/authService";

try {
  await forgotPasswordAPI(email);
  setIsSuccess(true);
} catch (error) {
  setErrors({ email: "Failed to send reset link. Please try again." });
}
```

---

## 📁 Create API Service File

Create `src/services/authService.ts`:

```typescript
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

export const loginAPI = async (email: string, password: string) => {
  return axios.post(`${API_URL}/auth/login`, { email, password });
};

export const forgotPasswordAPI = async (email: string) => {
  return axios.post(`${API_URL}/auth/forgot-password`, { email });
};

export const resetPasswordAPI = async (token: string, newPassword: string) => {
  return axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
};

export const logoutAPI = async () => {
  return axios.post(`${API_URL}/auth/logout`);
};
```

---

## 🔐 Environment Variables

Create `.env` file in root:

```env
REACT_APP_API_URL=https://your-backend-api.com/api
```

---

## 📧 Email Templates (Backend)

The backend should send emails for forgot password. Example structure:

**Forgot Password Email:**

- Subject: "Reset Your Password - Hotel Management"
- Include reset link: `https://yourapp.com/reset-password?token=ABC123`
- Token should expire in 1 hour

---

## 🧪 Testing

### Test Forgot Password Flow:

1. Go to `/login`
2. Click "Forgot?" link
3. Enter email: `demo@hotel.com`
4. Click "Send Reset Link"
5. Should show success screen
6. Click "Back to Login"

### Test Login Flow:

1. Go to `/login`
2. Click "Auto-fill credentials →"
3. Click "Sign In"
4. Should redirect to `/dashboard`

---

## 🎨 Customization

### Change Colors:

Both pages use Tailwind classes. To change brand colors:

```tsx
// Current blue gradient:
className = "bg-gradient-to-r from-blue-600 to-blue-700";

// Change to your brand color:
className = "bg-gradient-to-r from-purple-600 to-purple-700";
```

### Add Additional Fields:

In Login.tsx, add fields before the submit button:

```tsx
<div>
  <label>Company Code</label>
  <input type="text" />
</div>
```

---

## 🚀 Production Checklist

- [ ] Backend API endpoints are live
- [ ] Environment variables configured
- [ ] Email service configured (SendGrid, AWS SES, etc.)
- [ ] HTTPS enabled
- [ ] CORS configured on backend
- [ ] Token expiration set (JWT)
- [ ] Rate limiting on login/forgot password endpoints
- [ ] Email templates designed and tested
- [ ] Error messages user-friendly
- [ ] Forgot password token expires after use

---

## 📞 Common Issues

### "Failed to send reset link"

- Check backend API is running
- Verify email service is configured
- Check network tab for actual error

### "Invalid credentials"

- Verify backend authentication logic
- Check if password is hashed correctly
- Ensure JWT token generation works

### Redirect not working

- Check if AuthContext is properly set up
- Verify ProtectedRoute logic
- Check browser console for errors

---

## 📝 Files Modified/Created

✅ Created:

- `src/pages/auth/ForgotPassword.tsx`

✅ Modified:

- `src/pages/auth/Login.tsx` (Forgot link navigation)
- `src/App.tsx` (Added route and import)

📋 To Create (if not provided by other developer):

- `src/services/authService.ts`
- `.env`

---

Need help with any specific part? Let me know!
