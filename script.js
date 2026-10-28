
(() => {
  "use strict";

  // ==========================================
  // 1. CONFIGURAÇÃO DAS FASES
  // ==========================================

  const FASES = [
    {
      id: 1,
      nome: "Aprender",
      titulo: "Descobrindo os sons",
      emoji: "🌱",
      descricao: "Conheça as letras e ouça seus nomes."
    },
    {
      id: 2,
      nome: "Reconhecer",
      titulo: "Qual é a letra?",
      emoji: "🔎",
      descricao: "Ouça e encontre a letra certa."
    },
    {
      id: 3,
      nome: "Associar",
      titulo: "Sons e palavras",
      emoji: "🧩",
      descricao: "Encontre palavras que começam com a letra."
    },
    {
      id: 4,
      nome: "Escrever",
      titulo: "Praticando as letras",
      emoji: "✏️",
      descricao: "Identifique e digite a letra."
    },
    {
      id: 5,
      nome: "Desafio",
      titulo: "Desafio final",
      emoji: "🏆",
      descricao: "Mostre o que aprendeu sem tantas dicas."
    }
  ];

  // ==========================================
  // 2. BANCO DE PERGUNTAS
  // ==========================================

  // A voz atual fala o nome da letra.
  // O nome da letra não é necessariamente seu fonema isolado.
  // A equipe pedagógica deve revisar os áudios antes do uso avaliativo.

  const LETRAS = [
    {
      letra: "A",
      fala: "á",
      palavra: "abelha",
      emoji: "🐝",
      alternativas: ["A", "B", "M", "P"]
    },
    {
      letra: "B",
      fala: "bê",
      palavra: "bola",
      emoji: "⚽",
      alternativas: ["A", "B", "D", "P"]
    },
    {
      letra: "D",
      fala: "dê",
      palavra: "dado",
      emoji: "🎲",
      alternativas: ["B", "D", "P", "M"]
    },
    {
      letra: "F",
      fala: "efe",
      palavra: "foca",
      emoji: "🦭",
      alternativas: ["F", "S", "T", "P"]
    },
    {
      letra: "M",
      fala: "eme",
      palavra: "macaco",
      emoji: "🐒",
      alternativas: ["M", "N", "B", "P"]
    },
    {
      letra: "P",
      fala: "pê",
      palavra: "pato",
      emoji: "🦆",
      alternativas: ["B", "P", "D", "T"]
    },
    {
      letra: "S",
      fala: "esse",
      palavra: "sapo",
      emoji: "🐸",
      alternativas: ["S", "F", "C", "T"]
    },
    {
      letra: "T",
      fala: "tê",
      palavra: "tatu",
      emoji: "🦔",
      alternativas: ["T", "P", "F", "D"]
    }
  ];

  // ==========================================
  // 3. ARMAZENAMENTO
  // ==========================================

  const STORAGE_KEY = "jogoFonemasResultadosV11";
  const PROGRESS_KEY = "jogoFonemasProgressoV11";
  const NAME_KEY = "jogoFonemasNomeAlunoV11";

  const $ = (id) => document.getElementById(id);

  const screens = [
    "tela-inicial",
    "tela-como-jogar",
    "tela-selecao",
    "tela-jogo",
    "tela-resultado",
    "tela-professor"
  ];

  // ==========================================
  // 4. VARIÁVEIS DO JOGO
  // ==========================================

  let faseAtual = 1;
  let indice = 0;
  let perguntasAtuais = [];
  let selecao = null;
  let respondida = false;

  let pontosPartida = 0;
  let acertosPartida = 0;
  let errosPartida = 0;
  let sequencia = 0;
  let melhorSequencia = 0;

  let nomeAluno = localStorage.getItem(NAME_KEY) || "";

  // ==========================================
  // 5. NAVEGAÇÃO ENTRE TELAS
  // ==========================================

  function mostrarTela(id) {
    screens.forEach((screenId) => {
      $(screenId).classList.toggle(
        "hidden",
        screenId !== id
      );
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function abrirModal(titulo, texto) {
    $("modal-titulo").textContent = titulo;
    $("modal-texto").textContent = texto;

    const modal = $("modal-mensagem");

    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      alert(`${titulo}\n\n${texto}`);
    }
  }

  // ==========================================
  // 6. SISTEMA DE ÁUDIO
  // ==========================================

  function falarTexto(texto) {
    if (!("speechSynthesis" in window)) {
      abrirModal(
        "Áudio indisponível",
        "Seu navegador não oferece suporte à voz sintetizada. Tente usar uma versão atualizada do Chrome ou Edge."
      );
      return;
    }

    // Interrompe qualquer fala anterior.
    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(texto);

    fala.lang = "pt-BR";
    fala.rate = 0.78;
    fala.pitch = 1;

    const vozes = window.speechSynthesis.getVoices();

    const vozPortugues = vozes.find((voz) =>
      voz.lang &&
      voz.lang.toLowerCase().startsWith("pt-br")
    ) || vozes.find((voz) =>
      voz.lang &&
      voz.lang.toLowerCase().startsWith("pt")
    );

    if (vozPortugues) {
      fala.voice = vozPortugues;
    }

    window.speechSynthesis.speak(fala);
  }

  function reproduzirAudio(item) {
    const texto = item.fala || item.letra;

    // Se houver MP3 configurado, tenta reproduzi-lo.
    if (item.audio) {
      const audio = new Audio(item.audio);
      let fallbackUsado = false;

      function usarVozSintetizada() {
        if (fallbackUsado) return;

        fallbackUsado = true;
        falarTexto(texto);
      }

      audio.addEventListener(
        "error",
        usarVozSintetizada,
        { once: true }
      );

      audio.play().catch(usarVozSintetizada);
      return;
    }

    // Sem MP3, utiliza a voz do navegador.
    falarTexto(texto);
  }

  // ==========================================
  // 7. FUNÇÕES AUXILIARES
  // ==========================================

  function embaralhar(lista) {
    const copia = [...lista];

    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [copia[i], copia[j]] = [
        copia[j],
        copia[i]
      ];
    }

    return copia;
  }

  function lerResultados() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || [];
    } catch {
      return [];
    }
  }

  function progressoSalvo() {
    try {
      return JSON.parse(
        localStorage.getItem(PROGRESS_KEY)
      ) || {
        desbloqueada: 1,
        concluidas: []
      };
    } catch {
      return {
        desbloqueada: 1,
        concluidas: []
      };
    }
  }

  function salvarProgresso() {
    const progresso = progressoSalvo();

    if (!progresso.concluidas.includes(faseAtual)) {
      progresso.concluidas.push(faseAtual);
    }

    progresso.desbloqueada = Math.min(
      5,
      Math.max(
        progresso.desbloqueada || 1,
        faseAtual + 1
      )
    );

    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify(progresso)
    );
  }

  function escapar(texto) {
    return String(texto).replace(
      /[&<>"']/g,
      caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[caractere]
    );
  }

  // ==========================================
  // 8. SELEÇÃO E PROGRESSO DAS FASES
  // ==========================================

  function renderizarFases() {
    const progresso = progressoSalvo();

    $("progresso-jornada").innerHTML = `
      <div style="width:${
        (progresso.concluidas.length / 5) * 100
      }%"></div>
    `;

    $("lista-fases").innerHTML = FASES.map((fase) => {
      const bloqueada =
        fase.id > progresso.desbloqueada;

      const concluida =
        progresso.concluidas.includes(fase.id);

      return `
        <button
          class="phase-card ${bloqueada ? "locked" : ""}"
          data-fase="${fase.id}"
          ${bloqueada ? "disabled" : ""}
        >
          <span class="phase-emoji">
            ${bloqueada ? "🔒" : fase.emoji}
          </span>

          <h3>${fase.id}. ${fase.nome}</h3>

          <p>${fase.descricao}</p>

          <span class="phase-status">
            ${
              concluida
                ? "✓ Concluída"
                : bloqueada
                  ? "Bloqueada"
                  : "Disponível"
            }
          </span>
        </button>
      `;
    }).join("");

    $("lista-fases")
      .querySelectorAll("[data-fase]")
      .forEach((botao) => {
        botao.addEventListener("click", () => {
          iniciarFase(Number(botao.dataset.fase));
        });
      });
  }

  // ==========================================
  // 9. INICIAR UMA FASE
  // ==========================================

  function iniciarFase(id) {
    faseAtual = id;
    indice = 0;
    selecao = null;
    respondida = false;

    pontosPartida = 0;
    acertosPartida = 0;
    errosPartida = 0;
    sequencia = 0;
    melhorSequencia = 0;

    perguntasAtuais = embaralhar(LETRAS).slice(0, 5);

    mostrarTela("tela-jogo");
    renderizarPergunta();
  }

  // ==========================================
  // 10. ALTERNATIVAS DAS PERGUNTAS
  // ==========================================

  function construirAlternativas(item, tipo) {
    let alternativas;

    if (tipo === "palavra") {
      alternativas = embaralhar([
        ...LETRAS.filter(
          letra => letra.letra !== item.letra
        ).slice(0, 3),
        item
      ]);

      return `
        <div class="choices">
          ${alternativas.map((opcao) => `
            <button
              class="choice ${
                selecao === opcao.letra ? "selected" : ""
              }"
              data-resposta="${opcao.letra}"
              aria-label="${opcao.palavra}"
            >
              <span class="word-choice">
                <span class="word-picture">${opcao.emoji}</span>
                <span class="word-name">${opcao.palavra}</span>
              </span>
            </button>
          `).join("")}
        </div>
      `;
    }

    alternativas = embaralhar([
      ...new Set([
        item.letra,
        ...item.alternativas.filter(
          letra => letra !== item.letra
        ).slice(0, 3)
      ])
    ]);

    return `
      <div class="choices">
        ${alternativas.map((letra) => `
          <button
            class="choice ${
              selecao === letra ? "selected" : ""
            }"
            data-resposta="${letra}"
          >
            ${letra}
          </button>
        `).join("")}
      </div>
    `;
  }

  // ==========================================
  // 11. MOSTRAR UMA PERGUNTA
  // ==========================================

  function renderizarPergunta() {
    const item = perguntasAtuais[indice];
    const fase = FASES[faseAtual - 1];

    selecao = null;
    respondida = false;

    $("fase-atual-label").textContent =
      `${fase.emoji} ${fase.nome}`;

    $("pontos-atual").textContent = pontosPartida;

    $("pergunta-contador").textContent =
      `Atividade ${indice + 1} de ${perguntasAtuais.length}`;

    $("tentativas-label").textContent =
      faseAtual === 5
        ? "Desafio final"
        : "Pode tentar novamente";

    $("barra-progresso").style.width =
      `${(indice / perguntasAtuais.length) * 100}%`;

    $("feedback").className = "feedback hidden";
    $("feedback").textContent = "";

    $("btn-verificar").classList.remove("hidden");
    $("btn-proxima").classList.add("hidden");

    let conteudo = "";

    // FASE 1: APRENDER
    if (faseAtual === 1) {
      conteudo = `
        <span class="question-kicker">Conheça a letra</span>

        <h2 class="question-title">
          Vamos aprender esta letra?
        </h2>

        <div class="big-letter">${item.letra}</div>

        <button class="sound-button" data-ouvir-item>
          🔊 Ouvir "${item.fala}"
        </button>

        <p>Repita o áudio quantas vezes quiser.</p>

        <button class="btn btn-primary" id="btn-aprendi">
          Aprendi esta letra →
        </button>
      `;
    }

    // FASE 2: RECONHECER
    else if (faseAtual === 2 || faseAtual === 5) {
      conteudo = `
        <span class="question-kicker">
          ${faseAtual === 5 ? "Desafio final" : "Escute com atenção"}
        </span>

        <h2 class="question-title">
          ${
            faseAtual === 5
              ? "Qual letra corresponde ao som?"
              : "Qual é a letra que você ouviu?"
          }
        </h2>

        <button class="sound-button" data-ouvir-item>
          🔊 Ouvir som
        </button>

        ${construirAlternativas(item, "letra")}
      `;
    }

    // FASE 3: ASSOCIAR
    else if (faseAtual === 3) {
      conteudo = `
        <span class="question-kicker">Sons e palavras</span>

        <h2 class="question-title">
          Qual palavra começa com a letra
          <span style="color:var(--primary)">${item.letra}</span>?
        </h2>

        <div class="big-letter">${item.letra}</div>

        ${construirAlternativas(item, "palavra")}
      `;
    }

    // FASE 4: ESCREVER
    else {
      conteudo = `
        <span class="question-kicker">Pratique a escrita</span>

        <h2 class="question-title">
          Digite a letra que você ouviu.
        </h2>

        <button class="sound-button" data-ouvir-item>
          🔊 Ouvir som
        </button>

        <input
          class="write-input"
          id="resposta-digitada"
          maxlength="2"
          autocomplete="off"
          autocapitalize="characters"
          aria-label="Digite a letra"
          placeholder="?"
        />
      `;
    }

    $("conteudo-pergunta").innerHTML = conteudo;

    // Selecionar alternativas.
    $("conteudo-pergunta")
      .querySelectorAll("[data-resposta]")
      .forEach((botao) => {
        botao.addEventListener("click", () => {
          if (respondida) return;

          selecao = botao.dataset.resposta;

          $("conteudo-pergunta")
            .querySelectorAll("[data-resposta]")
            .forEach((outro) => {
              outro.classList.toggle(
                "selected",
                outro === botao
              );
            });
        });
      });

    // Botões para ouvir a letra.
    const botaoAudio = $("conteudo-pergunta")
      .querySelector("[data-ouvir-item]");

    if (botaoAudio) {
      botaoAudio.addEventListener("click", () => {
        reproduzirAudio(item);
      });
    }

    // Concluir a apresentação da letra na fase 1.
    const botaoAprendi = $("btn-aprendi");

    if (botaoAprendi) {
      botaoAprendi.addEventListener("click", () => {
        if (respondida) return;

        respondida = true;
        acertosPartida++;
        pontosPartida += 10;

        sequencia++;
        melhorSequencia = Math.max(
          melhorSequencia,
          sequencia
        );

        mostrarFeedback(
          "Muito bem! Você conheceu mais uma letra.",
          true
        );

        $("btn-verificar").classList.add("hidden");
        $("btn-proxima").classList.remove("hidden");

        atualizarPontos();
      });
    }

    // Permitir Enter no campo de escrita.
    const campo = $("resposta-digitada");

    if (campo) {
      campo.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter") {
          verificarResposta();
        }
      });

      campo.focus();
    }

    // Na fase de aprendizagem, apresenta o som automaticamente.
    if (faseAtual === 1) {
      reproduzirAudio(item);
    }
  }

  // ==========================================
  // 12. FEEDBACK E PONTUAÇÃO
  // ==========================================

  function atualizarPontos() {
    $("pontos-atual").textContent = pontosPartida;
  }

  function mostrarFeedback(texto, sucesso) {
    const caixa = $("feedback");

    caixa.textContent = texto;
    caixa.className =
      `feedback ${sucesso ? "success" : "error"}`;
  }

  function marcarAlternativa(letra, classe) {
    $("conteudo-pergunta")
      .querySelectorAll("[data-resposta]")
      .forEach((botao) => {
        if (botao.dataset.resposta === letra) {
          botao.classList.add(classe);
        }
      });
  }

  // ==========================================
  // 13. VERIFICAR RESPOSTAS
  // ==========================================

  function verificarResposta() {
    if (respondida) return;

    const item = perguntasAtuais[indice];

    let resposta = selecao;

    if (faseAtual === 4) {
      resposta = (
        $("resposta-digitada")?.value || ""
      ).trim().toUpperCase();
    }

    if (!resposta) {
      mostrarFeedback(
        faseAtual === 4
          ? "Digite uma letra antes de conferir."
          : "Escolha uma resposta para continuar.",
        false
      );

      return;
    }

    const correta = resposta === item.letra;

    if (correta) {
      respondida = true;

      acertosPartida++;
      pontosPartida += 10;
      sequencia++;

      melhorSequencia = Math.max(
        melhorSequencia,
        sequencia
      );

      const mensagens = [
        "Muito bem! Você acertou!",
        "Excelente! Continue assim!",
        "Isso mesmo! Você encontrou a letra!"
      ];

      let mensagem =
        mensagens[Math.floor(Math.random() * mensagens.length)];

      if (sequencia === 3) {
        mensagem += " Sequência de 3 acertos!";
      }

      mostrarFeedback(mensagem, true);
      marcarAlternativa(item.letra, "correct");

      $("btn-verificar").classList.add("hidden");
      $("btn-proxima").classList.remove("hidden");
    } else {
      errosPartida++;
      sequencia = 0;

      mostrarFeedback(
        "Quase! Escute novamente e tente mais uma vez.",
        false
      );

      if (faseAtual !== 4) {
        marcarAlternativa(resposta, "wrong");
      }

      reproduzirAudio(item);
    }

    atualizarPontos();
  }

  // ==========================================
  // 14. AVANÇAR PARA A PRÓXIMA PERGUNTA
  // ==========================================

  function proximaPergunta() {
    if (!respondida) return;

    indice++;

    if (indice < perguntasAtuais.length) {
      renderizarPergunta();
    } else {
      finalizarFase();
    }
  }

  // ==========================================
  // 15. FINALIZAR FASE E MOSTRAR RESULTADO
  // ==========================================

  function finalizarFase() {
    salvarProgresso();

    const totalRespostas =
      acertosPartida + errosPartida;

    const precisao = totalRespostas
      ? Math.round(
          (acertosPartida / totalRespostas) * 100
        )
      : 0;

    const resultado = {
      id: Date.now().toString(),
      nome: nomeAluno || "Sem nome",
      fase: FASES[faseAtual - 1].nome,
      faseId: faseAtual,
      acertos: acertosPartida,
      erros: errosPartida,
      pontos: pontosPartida,
      precisao,
      data: new Date().toISOString(),
      melhorSequencia
    };

    const historico = lerResultados();

    historico.unshift(resultado);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(historico)
    );

    $("resultado-titulo").textContent =
      acertosPartida === perguntasAtuais.length
        ? "Perfeito! Parabéns!"
        : "Muito bem por chegar até aqui!";

    $("resultado-mensagem").textContent =
      faseAtual === 5
        ? "Você completou o desafio final. Continue praticando!"
        : `Você concluiu a fase ${faseAtual}: ${
            FASES[faseAtual - 1].nome
          }. A próxima etapa está pronta!`;

    $("resultado-pontos").textContent = pontosPartida;
    $("resultado-acertos").textContent = acertosPartida;
    $("resultado-erros").textContent = errosPartida;
    $("resultado-percentual").textContent = `${precisao}%`;

    $("resultado-detalhe").innerHTML = `
      <h3>Resumo desta partida</h3>

      <div class="detail-row">
        <span>Atividade</span>
        <strong>${FASES[faseAtual - 1].titulo}</strong>
      </div>

      <div class="detail-row">
        <span>Questões concluídas</span>
        <strong>${perguntasAtuais.length}</strong>
      </div>

      <div class="detail-row">
        <span>Maior sequência de acertos</span>
        <strong>${melhorSequencia}</strong>
      </div>
    `;

    $("barra-progresso").style.width = "100%";

    mostrarTela("tela-resultado");
  }

  // ==========================================
  // 16. ÁREA DO PROFESSOR
  // ==========================================

  function renderizarProfessor() {
    const filtro = (
      $("filtro-aluno").value || ""
    ).trim().toLowerCase();

    const todos = lerResultados();

    const lista = todos.filter((resultado) =>
      resultado.nome.toLowerCase().includes(filtro)
    );

    const totalPontos = lista.reduce(
      (soma, resultado) => soma + resultado.pontos,
      0
    );

    const media = lista.length
      ? Math.round(
          lista.reduce(
            (soma, resultado) => soma + resultado.precisao,
            0
          ) / lista.length
        )
      : 0;

    $("resumo-professor").innerHTML = `
      <div class="summary-card">
        <small>Partidas registradas</small>
        <strong>${lista.length}</strong>
      </div>

      <div class="summary-card">
        <small>Pontos acumulados</small>
        <strong>${totalPontos}</strong>
      </div>

      <div class="summary-card">
        <small>Média de precisão</small>
        <strong>${media}%</strong>
      </div>
    `;

    if (!lista.length) {
      $("tabela-resultados").innerHTML = `
        <tr>
          <td colspan="7" class="empty-row">
            Nenhum resultado registrado ainda.
            Conclua uma atividade para começar.
          </td>
        </tr>
      `;

      return;
    }

    $("tabela-resultados").innerHTML = lista.map(
      (resultado) => `
        <tr>
          <td>${escapar(resultado.nome)}</td>
          <td>${escapar(resultado.fase)}</td>
          <td>${resultado.acertos}</td>
          <td>${resultado.erros}</td>
          <td>${resultado.pontos}</td>
          <td>${resultado.precisao}%</td>
          <td>
            ${new Date(resultado.data).toLocaleString("pt-BR")}
          </td>
        </tr>
      `
    ).join("");
  }

  // ==========================================
  // 17. EXPORTAR RESULTADOS PARA CSV
  // ==========================================

  function exportarCSV() {
    const dados = lerResultados();

    if (!dados.length) {
      abrirModal(
        "Sem resultados",
        "Ainda não existem resultados para exportar. Conclua uma atividade primeiro."
      );

      return;
    }

    const linhas = [
      [
        "Aluno",
        "Atividade",
        "Acertos",
        "Tentativas incorretas",
        "Pontos",
        "Precisao",
        "Data"
      ]
    ];

    dados.forEach((resultado) => {
      linhas.push([
        resultado.nome,
        resultado.fase,
        resultado.acertos,
        resultado.erros,
        resultado.pontos,
        `${resultado.precisao}%`,
        new Date(resultado.data).toLocaleString("pt-BR")
      ]);
    });

    const csv =
      "\uFEFF" +
      linhas.map((linha) =>
        linha.map((valor) =>
          `"${String(valor).replace(/"/g, '""')}"`
        ).join(";")
      ).join("\r\n");

    const arquivo = new Blob(
      [csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = "resultados-jogo-de-fonemas.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  // ==========================================
  // 18. EVENTOS DOS BOTÕES
  // ==========================================

  $("btn-jogar").addEventListener("click", () => {
    renderizarFases();
    mostrarTela("tela-selecao");
  });

  $("btn-como-jogar").addEventListener("click", () => {
    mostrarTela("tela-como-jogar");
  });

  $("btn-comecar-como").addEventListener("click", () => {
    renderizarFases();
    mostrarTela("tela-selecao");
  });

  $("btn-professor-topo").addEventListener("click", () => {
    renderizarProfessor();
    mostrarTela("tela-professor");
  });

  $("btn-sair-fase").addEventListener("click", () => {
    renderizarFases();
    mostrarTela("tela-selecao");
  });

  $("btn-ouvir").addEventListener("click", () => {
    if (perguntasAtuais[indice]) {
      reproduzirAudio(perguntasAtuais[indice]);
    }
  });

  $("btn-verificar").addEventListener(
    "click",
    verificarResposta
  );

  $("btn-proxima").addEventListener(
    "click",
    proximaPergunta
  );

  $("btn-voltar-fases").addEventListener("click", () => {
    renderizarFases();
    mostrarTela("tela-selecao");
  });

  $("btn-jogar-novamente").addEventListener("click", () => {
    iniciarFase(faseAtual);
  });

  $("btn-jogar-professor").addEventListener("click", () => {
    renderizarFases();
    mostrarTela("tela-selecao");
  });

  $("btn-exportar").addEventListener(
    "click",
    exportarCSV
  );

  $("filtro-aluno").addEventListener(
    "input",
    renderizarProfessor
  );

  // ==========================================
  // 19. NOME DO ALUNO
  // ==========================================

  $("form-aluno").addEventListener("submit", (evento) => {
    evento.preventDefault();

    nomeAluno = $("nome-aluno").value.trim();

    localStorage.setItem(NAME_KEY, nomeAluno);

    abrirModal(
      "Nome salvo",
      nomeAluno
        ? `As próximas partidas serão registradas como "${nomeAluno}".`
        : "As próximas partidas serão registradas sem nome."
    );
  });

  // ==========================================
  // 20. LIMPAR HISTÓRICO
  // ==========================================

  $("btn-limpar-resultados").addEventListener("click", () => {
    const confirmou = confirm(
      "Tem certeza de que deseja apagar todo o histórico deste navegador? Esta ação não pode ser desfeita."
    );

    if (confirmou) {
      localStorage.removeItem(STORAGE_KEY);
      renderizarProfessor();
    }
  });

  // ==========================================
  // 21. NAVEGAÇÃO GERAL
  // ==========================================

  $("btn-fechar-modal").addEventListener("click", () => {
    $("modal-mensagem").close();
  });

  $("brand-home").addEventListener("click", (evento) => {
    evento.preventDefault();
    mostrarTela("tela-inicial");
  });

  document.querySelectorAll("[data-go-home]").forEach((botao) => {
    botao.addEventListener("click", () => {
      mostrarTela("tela-inicial");
    });
  });

  // ==========================================
  // 22. INICIALIZAÇÃO
  // ==========================================

  $("nome-aluno").value = nomeAluno;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
  }
})();
