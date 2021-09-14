// exit-preview.ts: Limpar as informações de Preview e redirecionar o usuário para a página principal.
export default async (_, res) => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
};
