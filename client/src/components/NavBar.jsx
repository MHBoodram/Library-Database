import { NavLink } from 'react-router-dom'
import './NavBar.css'

function NavBar() {
    return(
        <nav className='nav-container'>
            <nav className='util-bar-container'>
                <div className='bar-links'>
                    <NavLink to="/help" className = {({ isActive }) => (isActive? 'bar-link active' : 'bar-link')}>
                        ? Help
                    </NavLink>
                    <NavLink to="/login" className = {({ isActive }) => (isActive? 'bar-link active' : 'bar-link')}>
                        ~ Log-in
                    </NavLink>
                </div>
            </nav>
            <nav className = 'sub-nav-container'>
                <a className='nav-brand' href="/">🏠Library</a>
                <div className='sub-nav-links'>
                    <NavLink to="/example" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                        Example
                    </NavLink>
                    <NavLink to="/example2" className = {({ isActive }) => (isActive? 'sub-nav-link active' : 'sub-nav-link')}>
                        Example2
                    </NavLink>
                </div>
            </nav>
        </nav>
    )
}
export default NavBar