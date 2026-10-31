# Post Management System — MERN Stack Development

> **Group Project**: Complete 4-Member Full-Stack MERN Implementation  
> **Architecture**: MongoDB, Express.js, React (Vite), Node.js  
> **Status**: **Fully Integrated & Production-Ready (199 Automated Tests Passing, 0 Failures)**

---

## 📌 1. Four-Member Architectural Division & Ownership

In accordance with the official project plan (`Post_Management_System_MERN_Group_Plan.pdf`):

### Member 1: Authentication & User Management
- **MongoDB User Schema**: Constraints, timestamps, and role support (`user` vs `admin`).
- **Registration**: Input validation, password length constraints, and duplicate-email normalization and rejection.
- **Password Security**: Pre-save bcrypt hashing hooks and password comparison method.
- **Login & JWT**: Stateless JWT token generation and verification.
- **Authentication Middleware**: Bearer token extraction, decoding, user hydration (`protect`), and role enforcement (`admin`).
- **Profile Management**: `GET /api/auth/me`, `GET /api/users/profile`, and `PUT /api/users/profile`.
- **Frontend**: Registration, Login, Profile editor, global `AuthContext`, and `ProtectedRoute`.

### Member 2: Post Management & Core CRUD
- **MongoDB Post Schema**: `title`, `content`, `category`, `image`, `author` (ref: `User`), `likes`, and timestamps.
- **Post CRUD Endpoints**:
  - `POST /api/posts`: Create post (Protected; author strictly bound from JWT `req.user._id`).
  - `GET /api/posts`: Public paginated browsing with keyword search, category filter, and sorting.
  - `GET /api/posts/my` & `GET /api/posts/my-posts`: Retrieve authenticated user's own posts.
  - `GET /api/posts/:id`: Retrieve single post with populated author details.
  - `PUT /api/posts/:id`: Update post with strict ownership check (Owner or Admin).
  - `DELETE /api/posts/:id`: Delete post with strict ownership check (Owner or Admin).
- **Post Security & Ownership**: Prevention of author spoofing, rejection of unauthenticated writes (401), non-owner mutation protection (403), and safe ObjectId validation.
- **Frontend Pages**: Home / Feed (`/`), Post Details (`/posts/:id`), Create Post (`/posts/create`), Edit Post (`/posts/:id/edit`), and My Posts (`/my-posts`).

### Member 3: Likes, Comments & Social Interaction
- **MongoDB Comment Schema**: `content` (1–1000 characters, trimmed, non-whitespace), `author` (ref: `User`), `post` (ref: `Post`), timestamps, and compound indexes.
- **Like / Unlike Endpoints**:
  - `POST /api/posts/:id/like`: Atomically likes post using `$addToSet`, preventing duplicate likes.
  - `DELETE /api/posts/:id/like`: Atomically unlikes post using `$pull`.
  - `PUT /api/posts/:id/like`: Toggle like status endpoint.
- **Comment Endpoints**:
  - `GET /api/posts/:postId/comments`: Public retrieval of comments, sorted newest first.
  - `POST /api/posts/:postId/comments`: Protected comment authoring with length validation.
  - `PUT /api/comments/:id`: Protected comment editing (restricted to author or admin).
  - `DELETE /api/comments/:id`: Protected comment deletion (restricted to author or admin).
- **Cascade Deletion**: Deleting a post cascades and removes all related comments, preventing database pollution.
- **Frontend Components**: `LikeButton` with optimistic UI and rollback, `CommentList` discussion thread, `CommentItem` with inline editing, and `CommentForm`.

### Member 4: Dashboard, Administrator Panel & Integration Lead
- **User Dashboard (`/dashboard`)**:
  - `GET /api/dashboard/stats`: Real-time user metrics including posts authored, total likes received across posts, comments written, comments received, global community scale, and recent activity streams (recent posts and comments).
- **Administrator Panel (`/admin`)**:
  - `GET /api/admin/stats`: Global platform analytics (total users, total posts, total comments, total likes, role breakdown, and posts by category).
  - `GET /api/admin/users`: User management with search, role filter (`user` vs `admin`), and pagination.
  - `DELETE /api/admin/users/:id`: Safe account deletion with complete cascade cleanup (purges user posts, post comments, authored comments, and like references). Self-deletion prevented (400).
  - `PATCH /api/admin/users/:id/role`: Role toggle (`user` <-> `admin`) with self-demotion prevention (400).
  - `GET /api/admin/posts` & `DELETE /api/admin/posts/:id`: Global post moderation and deletion.
  - `GET /api/admin/comments` & `DELETE /api/admin/comments/:id`: Global comment moderation and deletion.
- **System Integration & Polish**:
  - Universal navigation (`Navbar`) with dynamic dashboard and admin links.
  - `ProtectedRoute` supporting both general user authentication and `adminOnly={true}` route guarding.
  - Safe initial administrator provisioning script (`npm run seed:admin`).
  - Unified automated test suite with **199 assertions**.

---

## 🗂️ 2. Complete Project Architecture & Directory Structure

```
MERN/
├── Post_Management_System_MERN_Group_Plan.pdf   # Original project specification
├── package.json                                 # Root runner scripts (server, client, tests, seed)
├── .gitignore                                   # Excludes node_modules, .env, build artifacts
├── README.md                                    # Comprehensive system documentation
│
├── server/                                      # Node.js + Express Backend
│   ├── .env.example                             # Environment variable template
│   ├── package.json                             # Backend dependencies & test script
│   ├── server.js                                # Express application entry point
│   ├── config/
│   │   └── db.js                                # Mongoose MongoDB connection
│   ├── models/
│   │   ├── User.js                              # User Mongoose model (Member 1)
│   │   ├── Post.js                              # Post Mongoose model (Member 2)
│   │   └── Comment.js                           # Comment Mongoose model (Member 3)
│   ├── controllers/
│   │   ├── authController.js                    # Auth & current user (Member 1)
│   │   ├── userController.js                    # User profile management (Member 1)
│   │   ├── postController.js                    # Post CRUD & Likes (Members 2 & 3)
│   │   ├── commentController.js                 # Comment CRUD (Member 3)
│   │   ├── dashboardController.js               # Personal dashboard metrics (Member 4)
│   │   └── adminController.js                   # Platform moderation & admin (Member 4)
│   ├── middleware/
│   │   └── authMiddleware.js                    # Protect (JWT) & Admin authorization
│   ├── routes/
│   │   ├── authRoutes.js                        # /api/auth endpoints
│   │   ├── userRoutes.js                        # /api/users endpoints
│   │   ├── postRoutes.js                        # /api/posts endpoints
│   │   ├── commentRoutes.js                     # /api/comments endpoints
│   │   ├── dashboardRoutes.js                   # /api/dashboard endpoints (Member 4)
│   │   └── adminRoutes.js                       # /api/admin endpoints (Member 4)
│   ├── utils/
│   │   ├── generateToken.js                     # JWT token generator
│   │   └── seedAdmin.js                         # Secure administrator seeding script
│   └── tests/
│       ├── auth.test.js                         # Member 1 Auth test suite (34 assertions)
│       ├── post.test.js                         # Member 2 Post test suite (49 assertions)
│       ├── interaction.test.js                  # Member 3 Likes/Comments test suite (59 assertions)
│       └── admin.test.js                        # Member 4 Dashboard/Admin test suite (57 assertions)
│
└── client/                                      # React + Vite Frontend
    ├── .env.example                             # Frontend environment template
    ├── package.json                             # Frontend dependencies
    ├── vite.config.js                           # Vite bundler & backend proxy config
    ├── index.html                               # HTML template
    └── src/
        ├── main.jsx                             # React root entry
        ├── App.jsx                              # Route definitions & shared layout
        ├── index.css                            # Modern glassmorphism & responsive CSS
        ├── components/
        │   ├── Navbar.jsx                       # Navigation with live auth, dashboard & admin links
        │   ├── ProtectedRoute.jsx               # Route guard for logged-in and admin-only routes
        │   ├── PostCard.jsx                     # Post summary card with LikeButton & comment counter
        │   ├── PostForm.jsx                     # Reusable post creation/editing form
        │   ├── LikeButton.jsx                   # Interactive like button with optimistic update
        │   ├── CommentList.jsx                  # Post discussion thread container
        │   ├── CommentItem.jsx                  # Individual comment card with inline edit/delete
        │   ├── CommentForm.jsx                  # Comment authoring form with validation
        │   ├── Pagination.jsx                   # Numbered pagination component
        │   └── ConfirmationModal.jsx            # Accessible delete confirmation modal
        ├── pages/
        │   ├── Home.jsx                         # Real post feed with search & filtering
        │   ├── PostDetails.jsx                  # Full post view with Likes & Comments
        │   ├── CreatePost.jsx                   # New post form page
        │   ├── EditPost.jsx                     # Post update page with ownership validation
        │   ├── MyPosts.jsx                      # Current user's posts dashboard
        │   ├── Dashboard.jsx                    # User personal dashboard (Member 4)
        │   ├── AdminDashboard.jsx               # Administrator control panel (Member 4)
        │   ├── Login.jsx                        # User login form
        │   ├── Register.jsx                     # Account registration form
        │   └── Profile.jsx                      # User profile view & edit form
        ├── context/
        │   └── AuthContext.jsx                  # Global React authentication provider
        ├── hooks/
        │   └── useAuth.js                       # Custom hook for consuming AuthContext
        └── services/
            ├── api.js                           # Axios instance with auth interceptor
            ├── authService.js                   # Client-side Auth API calls
            ├── postService.js                   # Client-side Post & Like API calls
            ├── commentService.js                # Client-side Comment API calls
            ├── dashboardService.js              # Client-side User Dashboard API calls
            └── adminService.js                  # Client-side Admin API calls
```

---

## 🔌 3. Complete API Specification

### Authentication & Users (Member 1)
| Module | Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Public | Register new user account |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| **Auth** | `GET` | `/api/auth/me` | Protected | Retrieve authenticated user details |
| **Users** | `GET` | `/api/users/profile` | Protected | Retrieve current user's profile |
| **Users** | `PUT` | `/api/users/profile` | Protected | Update current user's own profile |

### Post Management (Member 2)
| Module | Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Posts** | `GET` | `/api/posts` | Public | Browse paginated posts with search & filter |
| **Posts** | `GET` | `/api/posts/:id` | Public | Retrieve single post by ID with author details |
| **Posts** | `GET` | `/api/posts/my` | Protected | Retrieve authenticated user's own posts |
| **Posts** | `GET` | `/api/posts/my-posts`| Protected | Alias for user's own posts |
| **Posts** | `POST` | `/api/posts` | Protected | Create a new post (author derived from JWT) |
| **Posts** | `PUT` | `/api/posts/:id` | Owner / Admin | Update title, content, category, or image |
| **Posts** | `DELETE`| `/api/posts/:id` | Owner / Admin | Delete post (cascades to delete comments) |

### Likes & Comments Interaction (Member 3)
| Module | Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Likes** | `POST` | `/api/posts/:id/like` | Protected | Like a post (duplicate-like prevention) |
| **Likes** | `DELETE`| `/api/posts/:id/like` | Protected | Unlike a post |
| **Likes** | `PUT` | `/api/posts/:id/like` | Protected | Toggle like/unlike status |
| **Comments**| `GET` | `/api/posts/:postId/comments` | Public | Fetch all comments for a post |
| **Comments**| `POST`| `/api/posts/:postId/comments` | Protected | Add a new comment to a post |
| **Comments**| `PUT` | `/api/comments/:id` | Owner / Admin | Update an existing comment |
| **Comments**| `DELETE`| `/api/comments/:id` | Owner / Admin | Delete a comment |

### Dashboard & Administration (Member 4)
| Module | Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard**| `GET` | `/api/dashboard/stats` | Protected | Retrieve personal statistics and activity |
| **Admin** | `GET` | `/api/admin/stats` | Admin Only | Platform-wide metrics and category breakdown |
| **Admin** | `GET` | `/api/admin/users` | Admin Only | List users with pagination, search, & role filter |
| **Admin** | `DELETE`| `/api/admin/users/:id` | Admin Only | Delete user with cascade cleanup (no self-delete) |
| **Admin** | `PATCH` | `/api/admin/users/:id/role`| Admin Only | Toggle user role (`user` <-> `admin`) |
| **Admin** | `GET` | `/api/admin/posts` | Admin Only | List all posts across platform |
| **Admin** | `DELETE`| `/api/admin/posts/:id` | Admin Only | Moderate and delete any post |
| **Admin** | `GET` | `/api/admin/comments` | Admin Only | List all comments across platform |
| **Admin** | `DELETE`| `/api/admin/comments/:id`| Admin Only | Moderate and delete any comment |

---

## 🚀 4. How to Run the Project

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (running locally on port 27017, or MongoDB Atlas connection string)

### Environment Configuration
1. Backend (`server/.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/post_management_system
   JWT_SECRET=super_secret_jwt_key_change_in_production
   CLIENT_URL=http://localhost:5173
   ```
2. Frontend (`client/.env`):
   ```env
   VITE_API_URL=/api
   ```

### Quick Start Commands

#### Windows 11 (PowerShell / Command Prompt)
```powershell
# 1. From root directory, install dependencies if needed
npm install
npm --prefix server install
npm --prefix client install

# 2. Run all backend automated test suites (199 assertions)
npm run test:server

# 3. (Optional) Provision an initial administrator account
npm run seed:admin

# 4. Start Backend API Server (runs on http://localhost:5000)
npm run server

# 5. In a second terminal, start Frontend Development Server (runs on http://localhost:5173)
npm run client
```

#### Ubuntu / WSL
```bash
# 1. Install dependencies
npm install && npm --prefix server install && npm --prefix client install

# 2. Execute automated test suite
npm run test:server

# 3. (Optional) Provision initial administrator account
npm run seed:admin

# 4. Launch backend and frontend
npm run server
# In another terminal:
npm run client
```

---

## 🔒 5. Administrator Setup & Security Rules

1. **No Public Admin Registration**: Regular registration on `/register` always creates standard `user` accounts. The frontend never accepts or submits an unverified role.
2. **Safe Admin Provisioning**: Use the built-in seeding tool:
   ```bash
   npm run seed:admin
   # Or customize parameters:
   node server/utils/seedAdmin.js admin@posthub.com "Platform Admin" "StrongPassword123"
   ```
3. **Self-Preservation Safeguards**:
   - Administrators cannot delete their own account (`DELETE /api/admin/users/:id` returns 400).
   - Administrators cannot revoke their own administrator role (`PATCH /api/admin/users/:id/role` returns 400).
4. **Complete Cascade Cleanups**: When an admin deletes a user, MongoDB cleans up:
   - All posts authored by that user.
   - All comments on those posts.
   - All comments authored by that user across other posts.
   - All like references from that user across all posts.
   - Zero orphaned references remain in the database.
5. **Backend Authorization Verification**: All admin endpoints enforce `protect` (verifying token validity and user identity) followed by `admin` (`req.user.role === 'admin'`). Client requests without admin role receive HTTP `403 Forbidden`.
