import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  time_to_read: number;
  data: {
    title: string;
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
  return (
    <>
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
              <span>{post?.first_publication_date}</span>
            </div>
            <div className={styles.postInfo}>
              <FiUser />

              <span>{post?.data?.author}</span>
            </div>
            <div className={styles.postInfo}>
              <FiClock />
              <span>{post?.time_to_read} min</span>
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

  let text;
  response.data.content.map(content => {
    text += content.title;
    text += RichText.asText(content.body).split(/<.+?>(.+?)<\/.+?>/g);
  });

  const time_to_read = Math.ceil(text.split(' ').length / 200);

  const post: Post = {
    first_publication_date: format(new Date(), 'dd MMM yyyy', { locale: ptBR }),
    time_to_read: time_to_read ?? 0,
    data: {
      ...response.data,
      title: response.data.title,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: { post },
    revalidate: 60 * 30, // 30 minutes
  };
};
