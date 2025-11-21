🎮 Gamepedia - Enciclopédia de Videogames

Este projeto é uma aplicação web interativa que funciona como uma enciclopédia de videogames, permitindo ao usuário explorar, buscar e favoritar jogos.

🚀 Status do Projeto (v2.1 - Migrado para RAWG)

O projeto está funcional, agora utilizando a API da RAWG.io para uma integração de frontend mais simples.

Fonte de Dados: API da RAWG.io (requer chave de API).

Funcionalidades: Busca, detalhes, favoritos, tema escuro/claro.

Páginas: Início, Resultados, Detalhes, Favoritos.

🔧 Configuração da API (Obrigatório)

Para que a aplicação funcione e busque dados reais, você deve configurar sua chave de API da RAWG.io.

Obtenha sua chave:

Crie uma conta gratuita em rawg.io/apidocs.

No seu painel, você encontrará sua "API key".

Insira a chave no código:

Abra o arquivo: assets/js/services/api.js

Substitua o valor da constante RAWG_API_KEY:

<!-- end list -->

const API_CONFIG = {
    // ...
    RAWG_API_KEY: 'COLE_SUA_CHAVE_API_DA_RAWG_AQUI'
};


Vantagens desta API

Sem CORS: A API da RAWG foi feita para funcionar direto do seu localhost ou file:///. Você não precisa de extensões de navegador ou proxies.

Chave Permanente: A chave de API não expira como os tokens da IGDB/Twitch.