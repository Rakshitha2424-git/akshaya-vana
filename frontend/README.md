# Akshaya Vana – Environmental Project Tracker

An environmental project management and tree survival monitoring web application developed for **Akshaya Vana Climate Ventures Private Limited**.

The application helps organizations manage environmental projects, monitor plantation progress, record tree survival inspections, and understand project performance through a centralized dashboard.

## Features

### 1. Dashboard
- View environmental project statistics.
- Monitor total target trees and planted trees.
- Track project progress.
- Display project information and relevant statistics.

### 2. Project Management
- Create environmental projects.
- View project details and project listings.
- Update project information.
- Delete projects (admin only).
- Track target trees, planted trees, location, planting date and project status.

### 3. Tree Survival Monitoring
- Record tree survival inspections.
- Track surviving, dead, missing and replaced trees.
- Monitor inspection dates and notes.
- View tree survival statistics.
- Generate inspection schedules (admin only).

### 4. Authentication and Authorization
- User registration and login.
- JWT-based authentication using HTTP-only cookies.
- Role-based access control.
- Admin users can manage projects.
- Viewer users can access permitted project information without administrative modification privileges.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| UI | Bootstrap, CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT, Passlib, bcrypt |
| API communication | Axios |
| Deployment | Render |
| Version control | Git and GitHub |

## Application Architecture

The application follows a frontend–backend–database architecture.

1. The React frontend provides the user interface.
2. Axios sends HTTP requests to the FastAPI backend.
3. FastAPI validates requests, checks authentication and permissions, and processes application logic.
4. SQLAlchemy communicates with PostgreSQL.
5. The backend returns responses to the frontend.
6. Dashboard statistics are calculated using stored project and inspection data.

## Project Structure

```text
akshaya-vana/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth_routes.py
│   │   │   ├── project_routes.py
│   │   │   └── survival_routes.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── auth.py
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
└── README.md
```

## Database and Project Progress

Project information is stored in PostgreSQL rather than being maintained as hardcoded dashboard values.

For example, consider a project with:
- Target trees: 1,000
- Initially planted trees: 600

The progress is calculated as:

```text
Progress = (Planted Trees / Target Trees) × 100

Progress = (600 / 1000) × 100
         = 60%
```

If an administrator updates the planted tree count to 850, the updated progress becomes:

```text
Progress = (850 / 1000) × 100
         = 85%
```

The updated value is stored in the database and should be reflected in the project listing and dashboard when the relevant data is refreshed.

## Access Permissions

| Functionality | Admin | Viewer |
|---|---|---|
| View dashboard | Yes | Yes |
| View projects | Yes | Yes |
| Create projects | Yes | No |
| Update projects | Yes | No |
| Delete projects | Yes | No |
| View tree survival information | Yes | Yes |
| Generate inspection schedules | Yes | No |

Permissions are enforced by the backend APIs, not only by hiding frontend controls.

## API Endpoints

The following are the main application endpoints. See the live API documentation for the complete request and response schemas.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Log in |
| GET | `/auth/me` | Get the current user |
| POST | `/auth/logout` | Log out |

### Project Management

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/projects/` | Retrieve projects |
| POST | `/projects/` | Create a project |
| PUT/PATCH | `/projects/{project_id}` | Update a project |
| DELETE | `/projects/{project_id}` | Delete a project (admin only) |

### Health Checks

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check backend health |
| GET | `/health/db` | Check database connectivity |

### API Documentation

Open the deployed backend's `/docs` endpoint to explore and test the APIs.

## Running the Project Locally

### Prerequisites

- Python
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Rakshitha2424-git/akshaya-vana.git

cd akshaya-vana
```

### 2. Configure the backend

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\myvenv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the backend directory:

```env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Use your own PostgreSQL connection string and a secure secret key. Do not commit `.env` to GitHub.

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend local address:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure the API base URL in the frontend API service to point to your local backend.

Start the frontend:

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

## Deployment

The application is deployed using Render.

- Frontend: [Add your deployed frontend URL]
- Backend: https://akshaya-vana.onrender.com
- API documentation: https://akshaya-vana.onrender.com/docs

The backend uses environment variables configured in Render for database connectivity and authentication secrets.

## Testing

Important scenarios to test include:

- User registration and login.
- Admin and viewer access permissions.
- Creating, viewing, updating and deleting projects.
- Updating planted tree counts and checking progress calculations.
- Recording tree survival inspections.
- Handling invalid input and nonexistent project IDs.
- Preventing viewers from performing administrator-only operations.
- Verifying that application records persist in PostgreSQL.

## Future Improvements

- Add downloadable project reports.
- Add location-based project mapping.
- Add more detailed historical tree survival analytics.
- Introduce project activity logs and audit trails.
- Add automated testing for backend APIs.
- Improve dashboard visualizations and reporting.

## AI Assistance Disclosure

AI-assisted development tools were used for learning, debugging, code suggestions and documentation support. The application code and technical decisions were reviewed and integrated as part of the individual development work.

## Assignment Information

**Organization:** Akshaya Vana Climate Ventures Private Limited  
**Position:** Technical Assistant Intern  
**Assignment:** Design, Develop and Deploy a Web Application  
**Project:** Environmental Project Tracker