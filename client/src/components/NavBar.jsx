import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom'
import './NavBar.css'
import { useAuth } from '../AuthContext'
import AccountSettingsModal from './AccountSettingsModal';

function NavBar() {
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [settingsSuccess, setSettingsSuccess] = useState("");
    const [settingsSaving, setSettingsSaving] = useState(false);
    const menuRef = useRef(null);

    function handleLogout() {
        logout();
        navigate('/login');
    }

    useEffect(() => {
        if (!menuOpen) return;
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [menuOpen]);

    const initials = (user?.name || user?.email || '')
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '??';

    const handleAccountSubmit = async (payload) => {
        setSettingsError("");
        setSettingsSuccess("");
        setSettingsSaving(true);
        try {
            await updateProfile(payload);
            setSettingsSuccess("Profile updated.");
        } catch (err) {
            const msg = err?.data?.error || err?.message || 'Failed to update profile';
            setSettingsError(msg);
        } finally {
            setSettingsSaving(false);
        }
    };

    return(
        <nav className='nav-container'>
                <nav className = 'sub-nav-container'>
                    <a className='nav-brand' href="/">Library</a>
                    <div className='sub-nav-links'>
                        <NavLink to="/books" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                            Library Catalog
                        </NavLink>
                        {user && (user.role === 'student' || user.role === 'teacher') && (
                            <NavLink to="/loans" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                                Loans
                            </NavLink>
                        )}
                        <NavLink to="/rooms" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                            Rooms
                        </NavLink>
                            {/* Only show staff dashboard to staff */}
                            {user && user.role === 'staff' && (
                                <NavLink to="/staff" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                                    Staff Dashboard
                                </NavLink>
                            )}
                    </div>
                </nav>
                <nav className='util-bar-container'>
                    <div className='bar-links'>
                        {user ? (
                            <>
                                <div style={{ position: 'relative' }} ref={menuRef}>
                                    <button 
                                        className='account-chip'
                                        onClick={() => setMenuOpen(prev => !prev)}
                                        type="button"
                                    >
                                        <span className='account-chip__initials'>{initials}</span>
                                        <span>{user.name || user.email}</span>
                                    </button>
                                    {menuOpen && (
                                        <div className='account-menu'>
                                            <button type='button' onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}>
                                                Account settings
                                            </button>
                                            <button type='button' onClick={handleLogout}>Logout</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className = {({ isActive }) => (isActive? 'bar-link active' : 'bar-link')}>
                                    Log in
                                </NavLink>
                            </>
                        )}
                    </div>
                </nav>
                <AccountSettingsModal
                    open={settingsOpen}
                    onClose={() => { setSettingsOpen(false); setSettingsError(""); setSettingsSuccess(""); }}
                    onSubmit={handleAccountSubmit}
                    user={user}
                    submitting={settingsSaving}
                    error={settingsError}
                    success={settingsSuccess}
                />
        </nav>
    )
}
export default NavBar
