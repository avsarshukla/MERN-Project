# Post Management System — MERN Stack Development

> **Group Project**: 4 Members  
> **Module**: **Member 1 — Authentication & User Management** (Implemented)

---

## 📌 1. Member 1 Scope & Ownership

In accordance with the project specification document (`Post_Management_System_MERN_Group_Plan.pdf`), Member 1 is exclusively responsible for the **Authentication & User Management** module:

- **MongoDB/Mongoose User Model** (with schema constraints, timestamps, role support: `user` and `admin`)
- **User Registration** with input validation and duplicate-email rejection
- **Password Security**: Bcrypt password hashing pre-save hook and verification
- **User Login**: Credential verification & JWT generation
- **JWT Authentication Middleware**: Bearer token extraction, decoding, user hydration, and protected routes
- **Admin Authorization Middleware**: Prepared for Member 4 integration
- **Current User Endpoint**: `GET /api/auth/me`
- **User Profile Endpoints**: `GET /api/users/profile` and `PUT /api/users/profile` (scoped strictly to own profile)
- **React Frontend**: Registration page, Login page, Profile page with live editing, AuthContext, ProtectedRoute mechanism, and Navigation bar

---

## 🗂️ 2. Project Architecture & Directory Structure

```
MERN/
├── Post_Management_System_MERN_Group_Plan.pdf   # Original project specification
├── package.json                                 # Root convenience runner scripts
├── .gitignore                                   # Excludes node_modules, .env, build artifacts
├── README.md                                    # Project documentation
│
├── server/                                      # Node.js + Express Backend
│   ├── .env.example                             # Environment variable template
│   ├── package.json                             # Backend dependencies & test scripts
│   ├── server.js                                # Express application entry point
│   ├── config/
│   │   └── db.js                                # Mongoose MongoDB connection
│   ├── models/
│   │   └── User.js                              # User Mongoose model
│   ├── controllers/
│   │   ├── authController.js                    # Register, Login, GetMe
│   │   └── userController.js                    # GetProfile, UpdateProfile
│   ├── middleware/
│   │   └── authMiddleware.js                    # Protect (JWT) & Admin middlewares
│   ├── routes/
│   │   ├── authRoutes.js                        # /api/auth endpoints
│   │   └── userRoutes.js                        # /api/users endpoints
│   ├── utils/
│   │   └── generateToken.js                     # JWT token generator
│   └── tests/
│       └── auth.test.js                         # Automated test suite (34 assertions)
│
└── client/                                      # React + Vite Frontend
    ├── .env.example                             # Frontend environment template
    ├── package.json                             # Frontend dependencies
    ├── vite.config.js                           # Vite bundler & backend proxy config
    ├── index.html                               # HTML template
    └── src/
        ├── main.jsx                             # React root entry
        ├── App.jsx                              # Route definitions & layout
        ├── index.css                            # Modern glassmorphism & responsive CSS
        ├── components/
        │   ├── Navbar.jsx                       # Navigation with live auth status
        │   └── ProtectedRoute.jsx               # Route guard for logged-in users
        ├── pages/
        │   ├── Home.jsx                         # Landing page with module status
        │   ├── Login.jsx                        # User login form
        │   ├── Register.jsx                     # Account registration form
        │   └── Profile.jsx                      # User profile view & edit form
        ├── context/
        │   └── AuthContext.jsx                  # Global React authentication provider
        ├── hooks/
        │   └── useAuth.js                       # Custom hook for consuming AuthContext
        └── services/
            ├── api.js                           # Axios instance with auth interceptor
            └── authService.js                   # Client-side API calls
```

---

## 🔌 3. API Specification (Member 1 Endpoints)

| Module | Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Public | Register new user account |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| **Auth** | `GET` | `/api/auth/me` | Protected | Retrieve authenticated user details |
| **Users** | `GET` | `/api/users/profile` | Protected | Retrieve current user's profile |
| **Users** | `PUT` | `/api/users/profile` | Protected | Update current user's own profile |

### Request & Response Examples

#### 1. Register User
`POST /api/auth/register`
```json
// Request Body
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "role": "user"
}

// 201 Created Response
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6732a...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "profileImage": "",
      "createdAt": "2026-10-07T18:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. User Login
`POST /api/auth/login`
```json
// Request Body
{
  "email": "jane@example.com",
  "password": "securepassword123"
}

// 200 OK Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "6732a...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "profileImage": "",
      "createdAt": "2026-10-07T18:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Get Current User / Profile
`GET /api/auth/me` or `GET /api/users/profile`
```http
Authorization: Bearer <JWT_TOKEN>
```
```json
// 200 OK Response
{
  "success": true,
  "message": "Current authenticated user retrieved",
  "data": {
    "user": {
      "_id": "6732a...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "profileImage": "",
      "createdAt": "2026-10-07T18:00:00.000Z"
    }
  }
}
```

---

## 🚀 4. How to Run the Project

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB (running locally or MongoDB Atlas URI)

### Setup Environment
1. In `server/`:
   ```bash
   cp .env.example .env
   ```
   Configure `PORT`, `MONGO_URI`, and `JWT_SECRET`.
2. In `client/`:
   ```bash
   cp .env.example .env
   ```

### Running Backend
```bash
# From repository root
npm run server

# Or directly in server/
cd server
npm run dev
```

### Running Frontend
```bash
# From repository root
npm run client

# Or directly in client/
cd client
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Automated Test Suite
```bash
# From repository root
npm run test:server

# Or inside server/
cd server
npm test
```
The test suite utilizes `mongodb-memory-server` and `supertest`, executing all 34 assertions verifying registration, login, duplicate-email rejection, password hashing, JWT authentication, protected routes, and profile updates.

---

## 🔒 5. Security & Viva Notes

1. **Password Hashing**: Plaintext passwords never enter the database. A Mongoose pre-save hook invokes `bcrypt.genSalt(10)` and `bcrypt.hash()`.
2. **Password Leak Prevention**: `User.toSafeObject()` strips `password` and `__v` before sending responses, and query projections use `.select('-password')`.
3. **Stateless Authorization**: Protected endpoints verify JWT signature via `jwt.verify(token, process.env.JWT_SECRET)`.
4. **Ownership Protection**: The user profile controller updates only `req.user._id`, ensuring users cannot mutate other users' accounts.
5. **Team Integration**: Designed with zero coupling to unimplemented modules (Member 2 Posts, Member 3 Comments, Member 4 Dashboard), providing ready-to-use `AuthContext` and `protect` middleware for teammate branches.
