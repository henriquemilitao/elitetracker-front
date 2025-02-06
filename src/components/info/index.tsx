import styles from './styles.module.css';

type InfoProps = {
  value: string;
  label: string;
};

export function Info({ value, label }: InfoProps) {
  return (
    <div className={styles.container}>
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}
