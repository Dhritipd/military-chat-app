import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function Chat({ currentUser, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const messagesEndRef = useRef(null);

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
      const response = await axios.get(`${API_URL}/projects/${activeProject.id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch project history', error);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [activeProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeProject]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeProject) return;

    try {
      await axios.post(`${API_URL}/projects/${activeProject.id}/messages?sender_id=${currentUser.id}`, {
        content: inputMessage.trim()
      });
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

      await axios.post(`${API_URL}/projects/${activeProject.id}/members`, {
        user_id: user.id
      });
      setNewMemberUsername('');
      alert('Operator added to operation.');
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
                <div>{project.name}</div>
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
              </div>
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
            </div>
            
            <div className="messages-container">
              {messages.map((msg, index) => {
                const isSentByMe = msg.sender_id === currentUser.id;
                const messageTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                return (
                  <div key={msg.id || index} className={`message ${isSentByMe ? 'message-sent' : 'message-received'}`} style={{ borderRadius: '0', borderLeft: isSentByMe ? 'none' : '2px solid var(--accent-color)', borderRight: isSentByMe ? '2px solid var(--accent-color)' : 'none' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', marginBottom: '0.2rem' }}>
                       {msg.sender?.username || 'OP'} [{messageTime}]
                    </div>
                    <div>{msg.content}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage} style={{ borderTop: '1px solid var(--accent-color)' }}>
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
