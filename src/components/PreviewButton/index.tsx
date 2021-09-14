import Link from 'next/link';
import React from 'react';

import styles from './preview-button.module.scss';

interface PreviewButtonProps {
  preview;
}

export default function PreviewButton({ preview }: PreviewButtonProps) {
  return (
    <>
      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a className={styles.exitPreview}>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}
