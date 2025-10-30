import { NavLink, useNavigate } from 'react-router-dom'
import './NavBar.css'
import { useAuth } from '../AuthContext'

function NavBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return(
        <nav className='nav-container'>
                <nav className = 'sub-nav-container'>
                    <a className='nav-brand' href="/">Library</a>
                    <div className='sub-nav-links'>
                        <NavLink to="/books" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                            Books
                        </NavLink>
                        <NavLink to="/loans" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                            Loans
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
                                <span className='bar-link' style={{ cursor: 'default' }}>
                                    {user.name} ({user.role})
                                </span>
                                <button 
                                    onClick={handleLogout}
                                    className='bar-link'
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className = {({ isActive }) => (isActive? 'bar-link active' : 'bar-link')}>
                                    Log in
                                </NavLink>
                                <NavLink to="/register" className = {({ isActive }) => (isActive? 'bar-link active' : 'bar-link')}>
                                    Register
                                </NavLink>
                            </>
                        )}
                    </div>
                </nav>
        </nav>
    )
}
export default NavBar
