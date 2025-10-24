import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './NavBar.css'

function NavBar() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    }

    return(
        <nav className='nav-container'>
            <nav className='util-bar-container'>
                <div className='bar-links'>
                    {user ? (
                        <>
                            <span className='bar-link' style={{ cursor: 'default' }}>
                                👤 {user.name} ({user.role})
                            </span>
                            <button 
                                onClick={handleLogout}
                                className='bar-link'
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                🚪 Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/register" className = {({ isActive }) => (isActive? 'bar-link active' : 'bar-link')}>
                                ➕ Register
                            </NavLink>
                            <NavLink to="/login" className = {({ isActive }) => (isActive? 'bar-link active' : 'bar-link')}>
                                ~ Log-in
                            </NavLink>
                        </>
                    )}
                </div>
            </nav>
            <nav className = 'sub-nav-container'>
                <a className='nav-brand' href="/">🏠Library</a>
                <div className='sub-nav-links'>
                    <NavLink to="/books" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                        Books
                    </NavLink>
                    <NavLink to="/loans" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                        Loans
                    </NavLink>
                        {/* Only show Reports to staff */}
                        {user && user.role === 'staff' && (
                            <NavLink to="/reports" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                                Reports
                            </NavLink>
                        )}
                </div>
            </nav>
        </nav>
    )
}
export default NavBar