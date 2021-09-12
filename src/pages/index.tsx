import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import Link from 'next/link';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const posts = postsPagination.results;

  const handleLoadMorePosts = async () => {
    const { next_page } = postsPagination;
    fetch(next_page).then(res =>
      res.json().then(data => {
        console.log(data);
      })
    );
  };

  return (
    <main className={commonStyles.container}>
      {posts &&
        posts.map(post => (
          <Link href={`/post/${post.uid}`}>
            <a>
              <div className={styles.post}>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.footer}>
                  <div className={styles.postInfo}>
                    <FiCalendar />
                    <span>{post.first_publication_date}</span>
                  </div>
                  <div className={styles.postInfo}>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </div>
            </a>
          </Link>
        ))}
      {postsPagination.next_page && (
        <a
          className={styles.loadMorePosts}
          href=""
          onClick={handleLoadMorePosts}
        >
          Carregar mais posts
        </a>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 2,
    }
  );

  const formattedPosts = postsResponse.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
    };
  });

  const formattedPostPagination = {
    ...postsResponse,
    results: formattedPosts,
  };

  return {
    props: { postsPagination: formattedPostPagination },
  };
};
