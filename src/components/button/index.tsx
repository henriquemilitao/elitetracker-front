import clsx from 'clsx';
import { ComponentProps } from 'react';

import styles from './styles.module.css';

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'error' | 'info';
};

export function Button({
  children,
  variant = 'info',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        styles.container,
        variant === 'error' && styles.error,
        disabled && styles.disabled,
      )}
    >
      {children}
    </button>
  );
}
