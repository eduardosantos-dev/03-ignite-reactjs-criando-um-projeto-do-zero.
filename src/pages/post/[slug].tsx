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
import { useUtterances } from '../../hooks/useUtterances';
import PreviewButton from '../../components/PreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  prevPost: Post;
  nextPost: Post;
}

export default function Post({ post, preview, prevPost, nextPost }: PostProps) {
  const [readTime, setReadTime] = useState(0);
  const router = useRouter();

  useUtterances('comments');

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
          <div className={styles.postInfoWrapper}>
            <div className={styles.postInfoContainer}>
              <div className={styles.postInfo}>
                <FiCalendar />
                <span>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
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
            {post?.last_publication_date && (
              <time className={styles.updatedAt}>
                {format(
                  new Date(post.last_publication_date),
                  "'* editado em 'dd MMM yyyy', às 'p",
                  {
                    locale: ptBR,
                  }
                )}
              </time>
            )}
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
        </article>
        <div className={styles.postPaginationContainer}>
          {prevPost && (
            <div className={`${styles.postPagination} ${styles.left}`}>
              <p>{prevPost.data.title}</p>
              <a href={`/post/${prevPost.uid}`}>Post anterior</a>
            </div>
          )}

          {nextPost && (
            <div className={`${styles.postPagination} ${styles.right}`}>
              <p>{nextPost.data.title}</p>
              <a href={`/post/${nextPost.uid}`}>Próximo post</a>
            </div>
          )}
        </div>
        <div id="comments" />
        <PreviewButton preview={preview} />
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: response.data.banner,
      content: response.data.content,
    },
  };

  const prevResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: post?.uid,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: post?.uid,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const prevPost = prevResponse?.results[0] || null;
  const nextPost = nextResponse?.results[0] || null;

  return {
    props: { post, preview, prevPost, nextPost },
    revalidate: 60 * 30, // 30 minutes
  };
};
