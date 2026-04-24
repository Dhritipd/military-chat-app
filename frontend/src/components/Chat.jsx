import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getRandomCoverImage, hideACKInImage } from '../lib/stego';

const API_URL = 'http://localhost:8000';

function Chat({ currentUser, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [timerOption, setTimerOption] = useState(0);
  const [showMembers, setShowMembers] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const messagesEndRef = useRef(null);
  const destroyingMessagesRef = useRef(new Set());

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${currentUser.id}`);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const fetchHistory = async () => {
    if (!activeProject) return;
    try {
      const response = await axios.get(`${API_URL}/projects/${activeProject.id}/messages?user_id=${currentUser.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch project history', error);
    }
  };

  useEffect(() => {
    fetchHistory();
    setShowMembers(false);
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [activeProject]);
  
  const fetchProjectMembers = async () => {
    if (!activeProject || activeProject.user_role !== 'commander') return;
    try {
      const response = await axios.get(`${API_URL}/projects/${activeProject.id}/members?user_id=${currentUser.id}`);
      setProjectMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members', error);
    }
  };

  useEffect(() => {
    if (showMembers) {
      fetchProjectMembers();
    }
  }, [showMembers, activeProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeProject]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let shouldUpdateState = false;
    const activeMessages = messages.filter(msg => {
      if (msg.self_destruct_time && !msg.is_destroyed) {
        // Ensure the string is treated as UTC by appending Z if needed
        const timeStr = msg.self_destruct_time.endsWith('Z') ? msg.self_destruct_time : msg.self_destruct_time + 'Z';
        const expiry = new Date(timeStr).getTime();
        
        if (expiry <= currentTime) {
          if (!destroyingMessagesRef.current.has(msg.id)) {
            destroyingMessagesRef.current.add(msg.id);
            (async () => {
              try {
                const coverBlob = await getRandomCoverImage();
                const stegoFile = await hideACKInImage(msg.id, coverBlob);
                const formData = new FormData();
                formData.append('file', stegoFile);
                await axios.post(`${API_URL}/messages/${msg.id}/destroy`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log(`Message ${msg.id} destroyed via steganography`);
              } catch (err) {
                console.error("Failed to destroy message via stego:", err);
                // Optionally remove from ref to retry, though it's already removed from UI
              }
            })();
            shouldUpdateState = true;
          }
          return false; // Remove from list
        }
      }
      return true;
    });

    if (shouldUpdateState) {
      setMessages(activeMessages);
    }
  }, [currentTime, messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeProject) return;

    try {
      const payload = { content: inputMessage.trim() };
      if (timerOption > 0) {
        payload.self_destruct_seconds = timerOption;
      }
      await axios.post(`${API_URL}/projects/${activeProject.id}/messages?sender_id=${currentUser.id}`, payload);
      setInputMessage('');
      fetchHistory();
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      await axios.post(`${API_URL}/projects/?creator_id=${currentUser.id}`, {
        name: newProjectName.trim(),
        description: 'Classified Operation'
      });
      setNewProjectName('');
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!newMemberUsername.trim() || !activeProject) return;
    
    try {
      const usersRes = await axios.get(`${API_URL}/users/`);
      const user = usersRes.data.find(u => u.username === newMemberUsername.trim());
      if (!user) {
        alert('Operator not found');
        return;
      }

      await axios.post(`${API_URL}/projects/${activeProject.id}/members?user_id=${currentUser.id}`, {
        user_id: user.id
      });
      setNewMemberUsername('');
      alert('Operator added to operation.');
      if (showMembers) fetchProjectMembers();
      fetchProjects();
    } catch (error) {
      console.error('Failed to add member', error);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar" style={{ borderRight: '1px solid var(--accent-color)' }}>
        <div className="sidebar-header" style={{ borderBottom: '1px solid var(--accent-color)' }}>
          <h2 style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Active Operations</h2>
          <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
            OP: {currentUser.username} | <a href="#" onClick={(e) => {e.preventDefault(); onLogout();}} style={{color: 'var(--accent-color)', textDecoration: 'none'}}>[DISCONNECT]</a>
          </span>
        </div>
        
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <form onSubmit={createProject} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="New Op Name" 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              style={{ padding: '0.5rem', fontSize: '0.8rem' }}
            />
            <button type="submit" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>INIT</button>
          </form>
        </div>

        <div className="user-list">
          {projects.length === 0 ? (
            <p style={{color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem'}}>No active operations.</p>
          ) : (
            projects.map(project => (
              <div 
                key={project.id} 
                className={`user-item ${activeProject?.id === project.id ? 'active' : ''}`}
                onClick={() => setActiveProject(project)}
                style={activeProject?.id === project.id ? { borderColor: 'var(--accent-color)' } : {}}
              >
                <div className="avatar" style={{ borderRadius: '4px', background: 'var(--bg-panel)', border: '1px solid var(--accent-color)' }}>
                  OP
                </div>
                <div>{project.name} {project.user_role === 'commander' && project.member_count ? <span style={{fontSize: '0.7em', color: 'var(--text-secondary)'}}>({project.member_count} ops)</span> : ''}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-area">
        {activeProject ? (
          <>
            <div className="chat-header" style={{ borderBottom: '1px solid var(--accent-color)', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ textTransform: 'uppercase' }}>{activeProject.name}</h3>
                {activeProject.user_role === 'commander' && (
                  <button onClick={() => setShowMembers(!showMembers)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
                    {showMembers ? 'HIDE MEMBERS' : 'SHOW MEMBERS'}
                  </button>
                )}
              </div>
              
              {activeProject.user_role === 'commander' && (
                <form onSubmit={addMember} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Operator ID" 
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', width: '150px' }}
                  />
                  <button type="submit" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>ADD</button>
                </form>
              )}
            </div>

            {showMembers && activeProject.user_role === 'commander' && (
              <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--accent-color)' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>OPERATORS: </strong>
                <span style={{ fontSize: '0.8rem' }}>
                  {projectMembers.map(m => m.username).join(', ')}
                </span>
              </div>
            )}
            
            <div className="messages-container">
              {messages.map((msg, index) => {
                const isSentByMe = msg.sender_id === currentUser.id;
                const messageTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                let remainingText = null;
                let isExpiringSoon = false;
                if (msg.self_destruct_time) {
                  const timeStr = msg.self_destruct_time.endsWith('Z') ? msg.self_destruct_time : msg.self_destruct_time + 'Z';
                  const expiry = new Date(timeStr).getTime();
                  const diff = Math.floor((expiry - currentTime) / 1000);
                  if (diff > 0) {
                    remainingText = `⏱️ ${diff}s`;
                    if (diff <= 10) isExpiringSoon = true;
                  }
                }

                return (
                  <div key={msg.id || index} className={`message ${isSentByMe ? 'message-sent' : 'message-received'} ${isExpiringSoon ? 'pulse-red' : ''}`} style={{ borderRadius: '0', borderLeft: isSentByMe ? 'none' : '2px solid var(--accent-color)', borderRight: isSentByMe ? '2px solid var(--accent-color)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: isExpiringSoon ? '#ef4444' : 'var(--accent-color)', marginBottom: '0.2rem' }}>
                       <span>{msg.sender?.username || 'OP'} [{messageTime}]</span>
                       {remainingText && <span>{remainingText}</span>}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage} style={{ borderTop: '1px solid var(--accent-color)', alignItems: 'center' }}>
              <select 
                value={timerOption} 
                onChange={(e) => setTimerOption(Number(e.target.value))}
                style={{ padding: '1rem', background: 'rgba(0,0,0,0.5)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <option value={0}>TIMER: OFF</option>
                <option value={30}>30 SEC</option>
                <option value={60}>1 MIN</option>
                <option value={300}>5 MIN</option>
                <option value={3600}>1 HR</option>
              </select>
              <input
                type="text"
                placeholder="Transmit message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                autoFocus
                style={{ fontFamily: 'inherit' }}
              />
              <button type="submit" disabled={!inputMessage.trim()}>SEND</button>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <h2 style={{ textTransform: 'uppercase', color: 'var(--accent-color)', letterSpacing: '2px' }}>Awaiting Assignment</h2>
            <p>Select an operation from the panel to begin transmission.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
