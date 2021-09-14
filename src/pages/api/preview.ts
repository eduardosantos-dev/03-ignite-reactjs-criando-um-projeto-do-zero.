// preview.ts:
// Receber a requisição da API do Prismic com as query params documentID e token,
// gerar a url,
// setar as informações do documento de acordo com o Preview e redirecionar o usuário para a url gerada;

import { getPrismicClient } from '../../services/prismic';

import { Document } from '@prismicio/client/types/documents';

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export default async (req, res) => {
  const { token: ref, documentId } = req.query;
  const prismic = getPrismicClient(req);

  const redirectUrl = await prismic
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });

  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${redirectUrl}" />
      <script>window.location.href = '${redirectUrl}'</script>
      </head>`
  );
  res.end();
};
