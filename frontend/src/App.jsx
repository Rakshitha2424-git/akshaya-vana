import { useEffect, useState } from 'react'
import api from './services/api'

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activePage, setActivePage] = useState('Dashboard')

  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [survivalStats, setSurvivalStats] = useState(null)
  const [survivalProjects, setSurvivalProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [inspections, setInspections] = useState([])
  const [survivalLoading, setSurvivalLoading] = useState(false)
  const [survivalMessage, setSurvivalMessage] = useState('')
  const [survivalError, setSurvivalError] = useState('')
  const [editingProject, setEditingProject] = useState(null)

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    location: '',
    target_trees: '',
    planted_trees: '',
    planting_date: '',
    status: 'Active'
    })

    const [isRegistering, setIsRegistering] = useState(false)

    const [registerForm, setRegisterForm] = useState({
      email: '',
      password: '',
      confirmPassword: '',
    })
    const handleEditProject = (project) => {
      setEditingProject(project)
    
      setEditForm({
        title: project.title || '',
        description: project.description || '',
        location: project.location || '',
        target_trees: project.target_trees ?? '',
        planted_trees: project.planted_trees ?? '',
        planting_date: project.planting_date || '',
        status: project.status || 'Active'
      })
    
      setActivePage('Edit Project')
    }
    const handleUpdateProject = async (e) => {
      e.preventDefault()
    
      try {
        const updateData = {
          ...editForm,
          target_trees: Number(editForm.target_trees),
          planted_trees: Number(editForm.planted_trees),
          planting_date: editForm.planting_date || null
        }
    
        await api.put(
          `/projects/${editingProject.id}`,
          updateData
        )
    
        const response = await api.get('/projects/')
        setProjects(response.data)
    
        setSuccess('Project updated successfully!')
        setError('')
        setEditingProject(null)
        setActivePage('Projects')
    
      } catch (err) {
        console.error('Update error:', err.response?.data)
    
        setError(
          err.response?.data?.detail
            ? JSON.stringify(err.response.data.detail)
            : 'Unable to update project.'
        )
      }
    }
  const [inspectionForm, setInspectionForm] = useState({
    inspection_date: '',
    surviving_trees: '',
    dead_trees: '',
    missing_trees: '',
    replaced_trees: '0',
    notes: '',
  })

  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    location: '',
    target_trees: '',
    planted_trees: '',
    initial_trees_planted: '',
    planting_date: '',
    status: 'planning',
  })

  // Check existing login session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data)
      } catch {
        setUser(null)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (user && activePage === 'Tree Survival') {
      loadSurvivalData()
    }
  }, [user, activePage])
  // Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      setUser(response.data.user)
      setPassword('')
      setActivePage('Dashboard')
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }
  

  const handleRegister = async (e) => {
    e.preventDefault()
  
    setError('')
    setSuccess('')
  
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
  
    if (registerForm.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }
  
    setLoading(true)
  
    try {
      await api.post('/auth/register', {
        email: registerForm.email,
        password: registerForm.password,
      })
  
      setSuccess('Registration successful! Please log in.')
  
      setEmail(registerForm.email)
      setPassword('')
  
      setRegisterForm({
        email: '',
        password: '',
        confirmPassword: '',
      })
  
      setIsRegistering(false)
  
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }
  // Logout
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      setStats(null)
      setProjects([])
      setActivePage('Dashboard')
    }
  }

  // Fetch dashboard data
  useEffect(() => {
    if (!user || activePage !== 'Dashboard') return

    const fetchDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/projects/dashboard/stats')
        setStats(response.data)
      } catch (err) {
        setError(
          err.response?.data?.detail || 'Unable to load dashboard.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [user, activePage])

  // Fetch all projects
  useEffect(() => {
    if (!user || activePage !== 'Projects') return

    const fetchProjects = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/projects/')
        setProjects(response.data)
      } catch (err) {
        setError(
          err.response?.data?.detail || 'Unable to load projects.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [user, activePage])

  // Create project
  const handleCreateProject = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const payload = {
        ...projectForm,
        target_trees: Number(projectForm.target_trees),
        planted_trees: Number(projectForm.planted_trees),
        initial_trees_planted: projectForm.initial_trees_planted
          ? Number(projectForm.initial_trees_planted)
          : Number(projectForm.planted_trees),
        location: projectForm.location || null,
        planting_date: projectForm.planting_date || null,
      }

      await api.post('/projects/', payload)

      setSuccess('Project created successfully!')

      setProjectForm({
        title: '',
        description: '',
        location: '',
        target_trees: '',
        planted_trees: '',
        initial_trees_planted: '',
        planting_date: '',
        status: 'planning',
      })

      setActivePage('Dashboard')
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Unable to create project.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Helpers
  const formatNumber = (number) =>
    Number(number || 0).toLocaleString()

  const getProgress = (planted, target) =>
    target > 0
      ? Math.round((planted / target) * 100)
      : 0

  // Session loading
  if (checkingSession) {
    return (
      <div className="container mt-5">
        Checking login session...
      </div>
    )
  }

  // Login screen
 // Login and Registration screens
if (!user) {
  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="card shadow p-4"
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <div className="text-center mb-4">
          <div style={{ fontSize: '48px' }}>🌳</div>
          <h2>Akshaya Vana</h2>
          <p className="text-muted">
            Environmental Project Tracker
          </p>
        </div>

        <h4 className="mb-3">
          {isRegistering ? 'Create Your Account' : 'Welcome Back'}
        </h4>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {isRegistering ? (

          // REGISTRATION FORM
          <form onSubmit={handleRegister}>

            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    email: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Create a password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    password: e.target.value,
                  })
                }
                minLength={8}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm your password"
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    confirmPassword: e.target.value,
                  })
                }
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-success w-100"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>

            <p className="text-center mt-3 mb-0">
              Already have an account?{' '}
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => {
                  setIsRegistering(false)
                  setError('')
                  setSuccess('')
                }}
              >
                Login
              </button>
            </p>

          </form>

        ) : (

          // LOGIN FORM
          <form onSubmit={handleLogin}>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-success w-100"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="text-center mt-3 mb-0">
              New to Akshaya Vana?{' '}
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => {
                  setIsRegistering(true)
                  setError('')
                  setSuccess('')
                }}
              >
                Create Account
              </button>
            </p>

          </form>
        )}
      </div>
    </div>
  )
}

  // Sidebar menu
  const menuItems = [
    'Dashboard',
    'Projects',
    'Tree Survival',
    ...(user.role === 'admin' ? ['Add Project'] : []),
  ]

  const loadSurvivalData = async () => {
    setSurvivalLoading(true)
    setSurvivalError('')
  
    // Fetch projects independently
    try {
      const projectsResponse = await api.get('/projects/')
      setSurvivalProjects(projectsResponse.data)
    } catch (err) {
      console.error('Projects loading error:', err)
      setSurvivalError(
        err.response?.data?.detail || 'Unable to load projects.'
      )
    }
  
    // Fetch survival dashboard independently
    try {
      const dashboardResponse = await api.get('/survival/dashboard')
      setSurvivalStats(dashboardResponse.data)
    } catch (err) {
      console.error('Survival dashboard error:', err)
      setSurvivalError(
        err.response?.data?.detail || 'Unable to load survival dashboard.'
      )
    }
  
    setSurvivalLoading(false)
  }
  
  const loadInspections = async (projectId) => {
    if (!projectId) {
      setInspections([])
      return
    }
  
    try {
      const response = await api.get(
        `/survival/projects/${projectId}/inspections`
      )
      setInspections(response.data)
    } catch (err) {
      setSurvivalError(
        err.response?.data?.detail || 'Unable to load inspections.'
      )
    }
  }
  
  const generateSchedule = async () => {
    if (!selectedProject) {
      setSurvivalError('Please select a project.')
      return
    }
  
    setSurvivalError('')
    setSurvivalMessage('')
  
    try {
      const response = await api.post(
        `/survival/projects/${selectedProject}/schedule`
      )
  
      setSurvivalMessage(response.data.message)
      await loadInspections(selectedProject)
      await loadSurvivalData()
    } catch (err) {
      setSurvivalError(
        err.response?.data?.detail || 'Unable to generate schedule.'
      )
    }
  }
  
  const recordInspection = async (e, inspectionId) => {
    e.preventDefault()
    setSurvivalError('')
    setSurvivalMessage('')
  
    try {
      const payload = {
        ...inspectionForm,
        surviving_trees: Number(inspectionForm.surviving_trees),
        dead_trees: Number(inspectionForm.dead_trees),
        missing_trees: Number(inspectionForm.missing_trees),
        replaced_trees: Number(inspectionForm.replaced_trees || 0),
      }
  
      const response = await api.post(
        `/survival/inspections/${inspectionId}/record`,
        payload
      )
  
      setSurvivalMessage('Inspection recorded successfully!')
  
      setInspectionForm({
        inspection_date: '',
        surviving_trees: '',
        dead_trees: '',
        missing_trees: '',
        replaced_trees: '0',
        notes: '',
      })
  
      await loadInspections(selectedProject)
      await loadSurvivalData()
    } catch (err) {
      setSurvivalError(
        err.response?.data?.detail || 'Unable to record inspection.'
      )
    }
  }

  return (
    <div className="app-layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🌳</span>
          <div>
            <h4>Akshaya Vana</h4>
            <small>Environmental Tracker</small>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        {menuItems.map((item) => (
          <button
            key={item}
            className={`menu-item ${
              activePage === item ? 'active' : ''
            }`}
            onClick={() => {
              setError('')
              setSuccess('')
              setActivePage(item)
            }}
          >
            {item === 'Dashboard' && '▦'}
            {item === 'Projects' && '🌱'}
            {item === 'Tree Survival' && '🌴'}
            {item === 'Add Project' && '+'}
            <span>{item}</span>
          </button>
        ))}

        <div className="sidebar-footer">
          🌍 Growing a greener future
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">

        {/* Header */}
        <header className="topbar">
          <div>
            <h5>{activePage}</h5>
            <small>Environmental Project Management</small>
          </div>

          <div className="user-profile">
            <span>{user.email}</span>
            <span className="badge bg-success">
              {user.role}
            </span>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dashboard */}
        {activePage === 'Dashboard' && (
          <>
            <section className="welcome-section">
              <h2>Welcome to Akshaya Vana 🌿</h2>
              <p>
                Track projects, monitor plantation progress,
                and build a greener tomorrow.
              </p>
            </section>

            {loading && <p>Loading dashboard...</p>}

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            {!loading && !error && stats && (
              <>
                <section className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-icon">🌳</span>
                    <p>Total Trees Planted</p>
                    <h2>
                      {formatNumber(stats.planted_trees)}
                    </h2>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon">🎯</span>
                    <p>Target Trees</p>
                    <h2>
                      {formatNumber(stats.target_trees)}
                    </h2>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon">📁</span>
                    <p>Total Projects</p>
                    <h2>
                      {formatNumber(stats.total_projects)}
                    </h2>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon">📈</span>
                    <p>Overall Progress</p>
                    <h2>{stats.overall_progress}%</h2>
                  </div>
                </section>

                <section className="projects-section">
                  <div className="section-heading">
                    <h4>Recent Projects</h4>
                    <button
                      className="view-button"
                      onClick={() => setActivePage('Projects')}
                    >
                      View All →
                    </button>
                  </div>

                  {stats.recent_projects.length === 0 ? (
                    <p>No projects available yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>PROJECT NAME</th>
                            <th>TARGET TREES</th>
                            <th>PLANTED</th>
                            <th>PROGRESS</th>
                            <th>STATUS</th>
                          </tr>
                        </thead>

                        <tbody>
                          {stats.recent_projects.map((project) => (
                            <tr key={project.id}>
                              <td>{project.title}</td>
                              <td>{formatNumber(project.target_trees)}</td>
                              <td>{formatNumber(project.planted_trees)}</td>
                              <td>
                                {getProgress(
                                  project.planted_trees,
                                  project.target_trees
                                )}%
                              </td>
                              <td>{project.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}

        {/* Projects page */}
        {activePage === 'Projects' && (
          <section className="projects-section">
            <h4>All Projects</h4>

            {loading && <p>Loading projects...</p>}

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            {!loading && !error && projects.length === 0 && (
              <p>No projects found.</p>
            )}

            {!loading && !error && projects.length > 0 && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>PROJECT NAME</th>
                      <th>TARGET TREES</th>
                      <th>PLANTED</th>
                      <th>PROGRESS</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>

                  
<tbody>
  {projects.map((project) => (
    <tr key={project.id}>
      <td>{project.title}</td>

      <td>{formatNumber(project.target_trees)}</td>

      <td>{formatNumber(project.planted_trees)}</td>

      <td>
        {getProgress(
          project.planted_trees,
          project.target_trees
        )}%
      </td>

      <td>{project.status}</td>

      <td>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => handleEditProject(project)}
        >
          Edit
        </button>
      </td>
    </tr>
  ))}
</tbody>

                </table>
              </div>
            )}
          </section>
        )}
  {activePage === 'Tree Survival' && (
  <section className="projects-section">
    <h4>🌳Tree Survival Intelligence</h4>
    <p>Monitor plantation health and record scheduled inspections.</p>

    {survivalLoading && <p>Loading survival data...</p>}

    {survivalError && (
      <div className="alert alert-danger">{survivalError}</div>
    )}

    {survivalMessage && (
      <div className="alert alert-success">{survivalMessage}</div>
    )}

    {survivalStats && (
      <div className="stats-grid">
        <div className="stat-card">
          <p>Projects Monitored</p>
          <h2>{survivalStats.total_projects_monitored}</h2>
        </div>

        <div className="stat-card">
          <p>Trees Planted</p>
          <h2>{formatNumber(survivalStats.total_trees_planted)}</h2>
        </div>

        <div className="stat-card">
          <p>Trees Surviving</p>
          <h2>{formatNumber(survivalStats.total_trees_surviving)}</h2>
        </div>

        <div className="stat-card">
          <p>Survival Rate</p>
          <h2>{survivalStats.overall_survival_rate}%</h2>
        </div>

        <div className="stat-card">
          <p>Overdue Inspections</p>
          <h2>{survivalStats.overdue_inspections}</h2>
        </div>
      </div>
    )}
    {String(user?.role).toLowerCase() === 'admin' && (
    <div className="card shadow-sm p-4 mt-4">
      <h5>Generate Inspection Schedule</h5>

      <label className="form-label">Select Plantation Project</label>

      <select
        className="form-select mb-3"
        value={selectedProject}
        onChange={async (e) => {
          const id = e.target.value
          setSelectedProject(id)
          setSurvivalError('')
          await loadInspections(id)
        }}
      >
        <option value="">Choose a project</option>

        {survivalProjects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>

      <button
        className="btn btn-success"
        onClick={generateSchedule}
        disabled={!selectedProject}
      >
        Generate 30 / 90 / 180 / 365-Day Schedule
      </button>
    </div>)}

    {inspections.length > 0 && (
      <div className="card shadow-sm p-4 mt-4">
        <h5>Inspection Milestones</h5>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Scheduled Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {inspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td>{inspection.milestone_days} Days</td>
                  <td>{inspection.scheduled_date}</td>
                  <td>
                    {inspection.inspection_date ? (
                      <span className="badge bg-success">Completed</span>
                    ) : (
                      <span className="badge bg-warning text-dark">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h5 className="mt-3">Record an Inspection</h5>

        {inspections.filter((item) => !item.inspection_date).length === 0 ? (
          <p>All scheduled inspections are completed.</p>
        ) : (
          <form
            onSubmit={(e) => {
              const pending = inspections.find(
                (item) => !item.inspection_date
              )
              if (pending) recordInspection(e, pending.id)
            }}
          >
            <div className="mb-3">
              <label className="form-label">Inspection Date</label>
              <input
                type="date"
                className="form-control"
                value={inspectionForm.inspection_date}
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    inspection_date: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="row">
              {[
                ['surviving_trees', 'Surviving Trees'],
                ['dead_trees', 'Dead Trees'],
                ['missing_trees', 'Missing Trees'],
                ['replaced_trees', 'Replaced Trees'],
              ].map(([field, label]) => (
                <div className="col-md-6 mb-3" key={field}>
                  <label className="form-label">{label}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={inspectionForm[field]}
                    onChange={(e) =>
                      setInspectionForm({
                        ...inspectionForm,
                        [field]: e.target.value,
                      })
                    }
                    required={field !== 'replaced_trees'}
                  />
                </div>
              ))}
            </div>

            <div className="mb-3">
              <label className="form-label">Inspection Notes</label>
              <textarea
                className="form-control"
                rows="3"
                value={inspectionForm.notes}
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            <button
              className="btn btn-success"
              type="submit"
            >
              Save Inspection
            </button>
          </form>
        )}
      </div>
    )}
  </section>
)}
  {activePage === 'Edit Project' && editingProject && (
  <div className="container-fluid">
    <h2 className="mb-4">Edit Project</h2>

    <form onSubmit={handleUpdateProject}>
      <div className="row">

        <div className="col-md-6 mb-3">
          <label className="form-label">Project Title</label>
          <input
            className="form-control"
            value={editForm.title}
            onChange={(e) =>
              setEditForm({...editForm, title: e.target.value})
            }
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Location</label>
          <input
            className="form-control"
            value={editForm.location}
            onChange={(e) =>
              setEditForm({...editForm, location: e.target.value})
            }
          />
        </div>

        <div className="col-md-12 mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({...editForm, description: e.target.value})
            }
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Target Trees</label>
          <input
            type="number"
            min="0"
            className="form-control"
            value={editForm.target_trees}
            onChange={(e) =>
              setEditForm({...editForm, target_trees: e.target.value})
            }
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Planted Trees</label>
          <input
            type="number"
            min="0"
            className="form-control"
            value={editForm.planted_trees}
            onChange={(e) =>
              setEditForm({...editForm, planted_trees: e.target.value})
            }
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Planting Date</label>
          <input
            type="date"
            className="form-control"
            value={editForm.planting_date}
            onChange={(e) =>
              setEditForm({...editForm, planting_date: e.target.value})
            }
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Project Status</label>
          <select
  className="form-select"
  value={editForm.status}
  onChange={(e) =>
    setEditForm({...editForm, status: e.target.value})
  }
>
  <option value="planning">Planning</option>
  <option value="in-progress">In Progress</option>
  <option value="completed">Completed</option>
</select>
        </div>

      </div>

      <button type="submit" className="btn btn-success me-2">
        Save Changes
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          setEditingProject(null)
          setActivePage('Projects')
        }}
      >
        Cancel
      </button>
    </form>
  </div>
)}
        {/* Add Project page */}
        {activePage === 'Add Project' && (
          <section className="projects-section">
            <h4>Add New Environmental Project</h4>
            <p>Enter the details of the plantation initiative.</p>

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            {success && (
              <div className="alert alert-success">{success}</div>
            )}

            <form onSubmit={handleCreateProject}>

              <div className="mb-3">
                <label className="form-label">Project Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter project title"
                  value={projectForm.title}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      title: e.target.value,
                    })
                  }
                  minLength={3}
                  maxLength={255}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describe the environmental project"
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Plantation Location
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter plantation location"
                  value={projectForm.location}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      location: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Planting Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={projectForm.planting_date}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      planting_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Initial Trees Planted
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Enter original number of trees"
                  value={projectForm.initial_trees_planted}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      initial_trees_planted: e.target.value,
                    })
                  }
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Target Trees</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={projectForm.target_trees}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        target_trees: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Already Planted</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={projectForm.planted_trees}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        planted_trees: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Project Status</label>
                <select
                  className="form-select"
                  value={projectForm.status}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? 'Creating Project...' : 'Create Project'}
              </button>

            </form>
          </section>
        )}

      </main>
    </div>
  )
}

export default App
