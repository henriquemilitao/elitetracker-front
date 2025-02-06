// import { useNavigate } from 'react-router-dom';

import icon from '../../assets/githubIcon.svg';
import { Button } from '../../components/button';
import { api } from '../../services/api';
import styles from './styles.module.css';

export function Login() {
  // const navigate = useNavigate();

  async function handleAuth() {
    const { data } = await api.get('/auth');

    window.location.href = data.redirectUrl;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Entre com</h1>

        <Button onClick={handleAuth}>
          <img src={icon}></img>
          Git Hub
        </Button>

        <p className={styles.bottom}>
          Ao entrar, eu concordo com os <span>Termos de Serviço</span> e{' '}
          <span>Política de Privacidade</span>
        </p>
      </div>
    </div>
  );
}
