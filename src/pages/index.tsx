import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/Head';

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
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleLoadMorePosts = async e => {
    e.preventDefault();

    if (!nextPage) return;

    fetch(nextPage).then(res =>
      res.json().then(data => {
        const postsResponse = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              author: post.data.author,
              subtitle: post.data.subtitle,
              title: post.data.title,
            },
          };
        });

        setPosts([...posts, ...postsResponse]);
        setNextPage(data.next_page);
      })
    );
  };

  return (
    <>
      <Head>
        <title>Spacetraveling | Home </title>
      </Head>

      <main className={commonStyles.container}>
        {posts &&
          posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <div className={styles.post}>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <div className={styles.footer}>
                    <div className={styles.postInfo}>
                      <FiCalendar />
                      <span>
                        {format(
                          new Date(post.first_publication_date),
                          'dd MMM yyyy',
                          { locale: ptBR }
                        )}
                      </span>
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
        {nextPage && (
          <span className={styles.loadMorePosts} onClick={handleLoadMorePosts}>
            Carregar mais posts
          </span>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      fetch: ['post.title', 'post.content'],
      pageSize: 5,
    }
  );

  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: { next_page: response.next_page, results: posts },
    },
    revalidate: 60 * 60 * 2, // 2 hours
  };
};
