// src/components/templates/Layout/UserMenu.tsx
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

interface UserMenuProps {
  user: { username: string; email: string } | null
}

export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    navigate('/login')
  }

  const getInitials = (name: string) => name.charAt(0).toUpperCase()

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-menu-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="user-avatar">{user?.username ? getInitials(user.username) : '?'}</div>
        <span className="user-name">{user?.username}</span>
        <span className="user-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-avatar-large">
              {user?.username ? getInitials(user.username) : '?'}
            </div>
            <div className="user-menu-info">
              <div className="user-menu-name">{user?.username}</div>
              <div className="user-menu-email">{user?.email}</div>
            </div>
          </div>
          <div className="user-menu-divider" />
          <button className="user-menu-item" onClick={() => { setIsOpen(false); navigate('/settings') }}>
            ⚙️ 设置
          </button>
          <button className="user-menu-item" onClick={() => { setIsOpen(false); navigate('/dashboard') }}>
            📊 仪表盘
          </button>
          <div className="user-menu-divider" />
          <button className="user-menu-item danger" onClick={handleLogout}>
            🚪 退出登录
          </button>
        </div>
      )}
    </div>
  )
}