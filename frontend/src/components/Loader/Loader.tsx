import styles from './Loader.module.css'

interface LoaderProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
}

function Loader({ size = 'medium', message }: LoaderProps) {
  return (
    <div className={styles.loaderContainer}>
      <div className={`${styles.loader} ${styles[size]}`} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}

export default Loader
