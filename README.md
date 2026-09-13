# ⌨️ Typing Speed Test

Um aplicativo de teste de velocidade de digitação, com feedback visual em tempo real, múltiplos níveis de dificuldade, dois modos de teste e recordes pessoais salvos entre sessões.

## ✨ Funcionalidades

- **Iniciar o teste** clicando no botão "Start Typing Test" ou clicando direto na passagem e começando a digitar.
- **3 níveis de dificuldade**: Easy, Medium e Hard, cada um com passagens de complexidade diferente.
- **2 modos de teste**:
  - **Timed (60s)** — cronômetro regressivo de 60 segundos.
  - **Passage** — cronômetro progressivo, sem limite de tempo, até o fim do texto.
- **Estatísticas em tempo real**: WPM (palavras por minuto), precisão (%) e tempo, atualizadas a cada segundo e a cada tecla.
- **Feedback visual caractere a caractere**:
  - 🟢 Verde — caractere correto
  - 🔴 Vermelho com sublinhado — caractere incorreto
  - ⬜ Fundo cinza — posição atual do cursor
- **Correção com Backspace** — o caractere volta a ficar pendente na tela, mas o erro original continua contando na precisão final.
- **Reiniciar a qualquer momento**, sorteando uma nova passagem aleatória com a dificuldade atual.
- **Tela de resultados** com WPM, precisão e contagem de caracteres corretos/incorretos.
- **Recorde pessoal (Personal Best)** salvo no `localStorage`, com mensagens diferentes para cada situação:
  - 🏁 *Baseline Established!* — primeiro teste realizado.
  - 🎉 *High Score Smashed!* — novo recorde, com animação de confete.
  - ✅ *Test Complete!* — resultado normal, sem novo recorde.
- **Totalmente responsivo**, com controles adaptados para desktop e mobile.
- **Estados de foco e hover** em todos os elementos interativos, para acessibilidade via teclado.

## 🗂️ Estrutura de arquivos

```
projeto-digitacao/
├── Index.html      # Estrutura da página
├── Style.css       # Estilos visuais e responsividade
├── Script.js       # Toda a lógica do app
├── data.json       # Banco de passagens de texto, por dificuldade
└── README.md       # Este arquivo
```

## ▶️ Como rodar o projeto

O app usa `fetch()` para carregar o `data.json`, então **não funciona abrindo o `Index.html` diretamente** (protocolo `file://`) — é preciso servir os arquivos por um servidor local.

**Opção A — VS Code Live Server (recomendado)**
1. Instale a extensão **Live Server** (autor: Ritwick Dey) no VS Code.
2. Clique com o botão direito em `Index.html` → **Open with Live Server**.

**Opção B — Terminal com Python**
```bash
python3 -m http.server 8000
```
Depois acesse `http://localhost:8000` no navegador.

## 🧠 Como a lógica funciona (resumo)

- Um objeto `state` centraliza todas as informações que mudam durante o uso (passagem atual, contadores de acertos/erros, tempo decorrido, etc).
- Cada caractere da passagem vira um `<span>` individual, permitindo colorir cada um separadamente conforme a digitação.
- Um `<input>` invisível captura o teclado de verdade (inclusive em dispositivos móveis), evitando escutar o `document` inteiro.
- Os acertos e erros são contados de forma **cumulativa** (nunca diminuem com Backspace), garantindo que a precisão final reflita todos os erros cometidos, mesmo os corrigidos depois.
- O recorde pessoal é armazenado no `localStorage` do navegador, então persiste entre sessões — mas é local a cada navegador/dispositivo.

## 🛠️ Tecnologias

- HTML5 semântico
- CSS3 (Flexbox, media queries, variáveis de estado via classes)
- JavaScript puro (Vanilla JS) — sem frameworks ou bibliotecas externas
- `localStorage` para persistência de dados

## 📌 Possíveis melhorias futuras

- Seletores de dificuldade/modo customizados (pills clicáveis) em vez do `<select>` nativo.
- Recordes separados por nível de dificuldade.
- Histórico dos últimos testes realizados.
- Suporte a múltiplos idiomas nas passagens.
