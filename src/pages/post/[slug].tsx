import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/Head';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const [readTime, setReadTime] = useState(0);
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function getReadTime(post: Post) {
    let text;
    post.data.content.map(content => {
      text += content.heading;
      text += RichText.asText(content.body).split(/<.+?>(.+?)<\/.+?>/g);
    });

    setReadTime(Math.ceil(text.split(' ').length / 200));
  }

  useEffect(() => {
    getReadTime(post);
  }, []);

  return (
    <>
      <Head>
        <title>Spacetraveling | {post?.data?.title} </title>
      </Head>
      <div
        className={styles.hero}
        style={{ backgroundImage: `url(${post?.data?.banner?.url})` }}
        title=""
      ></div>
      <main className={styles.postContainer}>
        <header>
          <h1>{post?.data?.title}</h1>
          <div className={styles.postInfoContainer}>
            <div className={styles.postInfo}>
              <FiCalendar />
              <span>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
            </div>
            <div className={styles.postInfo}>
              <FiUser />

              <span>{post?.data?.author}</span>
            </div>
            <div className={styles.postInfo}>
              <FiClock />
              <span>{readTime} min</span>
            </div>
          </div>
        </header>
        <article className={styles.postContent}>
          {post.data.content.map((content, index) => (
            <div className={styles.paragraph} key={index}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              ></div>
            </div>
          ))}
          <div></div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      fetch: ['post.uid'],
      pageSize: 20,
    }
  );

  const postPaths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: postPaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: response.data.banner,
      content: response.data.content,
    },
  };

  return {
    props: { post },
    revalidate: 60 * 30, // 30 minutes
  };
};
