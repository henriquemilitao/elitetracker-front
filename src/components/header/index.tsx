import styles from './styles.module.css';

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  return (
    <div className={styles.container}>
      <h1>{title}</h1>
      <span>
        {` Hoje, ${new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'long',
          timeZone: 'America/Manaus',
        }).format(new Date())}`}
      </span>
    </div>
  );
}
