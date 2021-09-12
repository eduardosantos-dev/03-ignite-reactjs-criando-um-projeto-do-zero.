import { route } from 'next/dist/next-server/server/router';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';

import React from 'react';

import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <Link href="/">
          <a>
            <Image src="/images/Logo.svg" alt="logo" width="238" height="25" />
          </a>
        </Link>
      </div>
    </header>
  );
}
