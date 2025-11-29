import React, { useState, useEffect } from 'react';
import AnimatedBackground from './AnimatedBackground';

function Website() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Dashboard State - Initialize as empty array
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ company: '', title: '', status: 'Applied', jobLink: '' });
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = view === 'login' ? '/login' : '/register';
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (view === 'login') {
          setUser(data.user); // Fix: use data.user instead of data
        } else { 
          setView('login'); 
          alert("Registered! Please log in."); 
        }
      } else { 
        alert(data.error); 
      }
    } catch (err) { 
      alert("Connection Error"); 
    }
  };

  const fetchJobs = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []); // Ensure it's an array
      } else {
        console.error('Failed to fetch jobs');
        setJobs([]); // Set empty array on error
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]); // Set empty array on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
          // UPDATE Existing Job
          await fetch(`${API_URL}/jobs/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form)
          });
          setEditingId(null);
      } else {
          // CREATE New Job
          const formData = new FormData();
          formData.append('company', form.company);
          formData.append('title', form.title);
          formData.append('status', form.status);
          formData.append('jobLink', form.jobLink);
          if (file) formData.append('resume', file);

          await fetch(`${API_URL}/jobs`, { method: 'POST', body: formData });
      }

      setForm({ company: '', title: '', status: 'Applied', jobLink: '' });
      setFile(null);
      fetchJobs();
    } catch (err) {
      console.error('Error submitting job:', err);
      alert('Failed to save job');
    }
  };

  const handleEdit = (job) => {
    setForm({ 
        company: job.company, 
        title: job.title, 
        status: job.status, 
        jobLink: job.job_link || '' 
    });
    setEditingId(job.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await fetch(`${API_URL}/jobs/${id}`, { method: 'DELETE' });
      fetchJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    }
  };

  // --- STYLES ---
  const styles = {
    container: { fontFamily: 'Segoe UI, sans-serif', maxWidth: '1000px', margin: '40px auto', padding: '20px', color: '#333' },
    authBox: { maxWidth: '400px', margin: '100px auto', padding: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', borderRadius: '8px', textAlign: 'center' },
    input: { width: '100%', padding: '10px', margin: '5px 0', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    link: { color: '#007bff', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px', display: 'block' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    th: { background: '#333', color: 'white', padding: '12px', textAlign: 'left' },
    td: { padding: '12px', borderBottom: '1px solid #eee', verticalAlign: 'middle' },
    editBtn: { background: '#ffc107', color: 'black', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' }
  };

  if (!user) {
    return (
      <>
      <AnimatedBackground />
      <div style={styles.authBox}>
        <h2>{view === 'login' ? 'Job Tracker Login' : 'Create Account'}</h2>
        <form onSubmit={handleAuth}>
          <input style={styles.input} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={styles.btn} type="submit">{view === 'login' ? 'Enter' : 'Register'}</button>
        </form>
        <span style={styles.link} onClick={() => setView(view === 'login' ? 'register' : 'login')}>
          {view === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
        </span>
      </div>
      </>
    );
  }

  return (
      <>
    <AnimatedBackground />
    <div style={styles.container}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
        <h1>💼 My Job Applications</h1>
        <button onClick={() => setUser(null)} style={{...styles.btn, width:'auto', background:'#6c757d'}}>Logout {user.username}</button>
      </div>

      <form onSubmit={handleSubmit} style={{background:'#f8f9fa', padding:'20px', borderRadius:'8px', display:'grid', gap:'15px', gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
        <input style={styles.input} placeholder="Company" value={form.company} onChange={e => setForm({...form, company: e.target.value})} required />
        <input style={styles.input} placeholder="Role" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        <select style={styles.input} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
          <option>Applied</option><option>Interview</option><option>Offer</option><option>Rejected</option>
        </select>
        <input style={styles.input} placeholder="Job Post Link (https://...)" value={form.jobLink} onChange={e => setForm({...form, jobLink: e.target.value})} />
        
        {!editingId && <input type="file" style={{gridColumn: 'span 2'}} onChange={e => setFile(e.target.files[0])} />}
        
        <div style={{gridColumn: editingId ? 'span 4' : 'span 2', display: 'flex', gap: '10px'}}>
            <button style={styles.btn} type="submit">{editingId ? 'Update Job' : 'Add Application'}</button>
            {editingId && <button type="button" style={{...styles.btn, background: '#6c757d'}} onClick={() => { setEditingId(null); setForm({ company: '', title: '', status: 'Applied', jobLink: '' }); }}>Cancel</button>}
        </div>
      </form>

      <table style={styles.table}>
        <thead><tr><th style={styles.th}>Company</th><th style={styles.th}>Role</th><th style={styles.th}>Status</th><th style={styles.th}>Link</th><th style={styles.th}>Resume</th><th style={styles.th}>Actions</th></tr></thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr><td colSpan="6" style={{...styles.td, textAlign: 'center', color: '#999'}}>No applications yet. Add your first one above!</td></tr>
          ) : (
            jobs.map(job => (
              <tr key={job.id}>
                <td style={styles.td}><strong>{job.company}</strong></td>
                <td style={styles.td}>{job.title}</td>
                <td style={styles.td}>{job.status}</td>
                <td style={styles.td}>
                  {job.job_link && <a href={job.job_link} target="_blank" rel="noopener noreferrer" style={{color: '#007bff'}}>🔗 Link</a>}
                </td>
                <td style={styles.td}>
                  {job.resume_name && <button style={{...styles.editBtn, background:'#17a2b8', color:'white'}} onClick={() => window.open(`${API_URL}/jobs/${job.id}/resume`)}>📄</button>}
                </td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(job)} style={styles.editBtn}>✎ Edit</button>
                  <button onClick={() => handleDelete(job.id)} style={{...styles.editBtn, background:'#dc3545', color:'white'}}>🗑</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </>
  );
}

export default Website;