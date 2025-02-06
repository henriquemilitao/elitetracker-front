import { ClockClockwise, ListChecks, SignOut } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useUser } from '../../hooks/use-user';
import styles from './styles.module.css';

export function SideBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useUser();

  function handleLogout() {
    logout();

    navigate('/entrar');
  }

  return (
    <div className={styles.container}>
      <img src={userData.avatarUrl} alt={userData.name} />
      <div className={styles.links}>
        <Link to="/">
          <ListChecks
            className={pathname === '/' ? styles.linkActive : undefined}
          />
        </Link>
        <Link to="/foco">
          <ClockClockwise
            className={pathname === '/foco' ? styles.linkActive : undefined}
          />
        </Link>
      </div>
      <SignOut className={styles.signout} onClick={handleLogout} />
    </div>
  );
}
