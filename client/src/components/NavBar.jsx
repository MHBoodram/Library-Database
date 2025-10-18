import { NavLink } from 'react-router-dom'
import './NavBar.css'

function NavBar() {
    return(
        <nav className='nav-container'>
            <a className='nav-brand' href="/">Library</a>
            <div className='nav-links'>
                <NavLink to="/example" className = {({ isActive }) => (isActive? 'nav-link active' : 'nav-link')}>
                    Example
                </NavLink>
                <NavLink to="/example2" className = {({ isActive }) => (isActive? 'nav-link active' : 'nav-link')}>
                    Example2
                </NavLink>
            </div>
        </nav>
    )
}
export default NavBar