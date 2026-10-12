/* ==================================================
   JOGO DE FONEMAS - VERSÃO 1
================================================== */


/* ==================================================
   CONFIGURAÇÃO DAS PERGUNTAS
================================================== */

const perguntas = [

    {
        som: "A",
        audio: "audio/a.mp3",
        fala:"á",
        alternativas: ["A", "B", "M"],
        resposta: "A"
    },

    {
        som: "B",
        audio: "audio/b.mp3",
        fala:"bê",
        alternativas: ["A", "B", "P"],
        resposta: "B"
    },

    {
        som: "M",
        audio: "audio/m.mp3",
        alternativas: ["M", "P", "B"],
        resposta: "M"
    },

    {
        som: "P",
        audio: "audio/p.mp3",
        alternativas: ["B", "P", "A"],
        resposta: "P"
    },

    {
        som: "A",
        audio: "audio/a.mp3",
        alternativas: ["M", "A", "P"],
        resposta: "A"
    }

];


/* ==================================================
   VARIÁVEIS DO JOGO
================================================== */

let perguntaAtual = 0;

let pontos = 0;

let acertos = 0;

let erros = 0;

let respondeu = false;


/* ==================================================
   ELEMENTOS HTML
================================================== */

const telaInicial =
    document.getElementById("tela-inicial");

const telaJogo =
    document.getElementById("tela-jogo");

const telaResultado =
    document.getElementById("tela-resultado");


const btnIniciar =
    document.getElementById("btn-iniciar");

const btnAudio =
    document.getElementById("btn-audio");

const btnProxima =
    document.getElementById("btn-proxima");

const btnReiniciar =
    document.getElementById("btn-reiniciar");


const alternativas =
    document.getElementById("alternativas");

const feedback =
    document.getElementById("feedback");

const contador =
    document.getElementById("contador");

const pontuacao =
    document.getElementById("pontuacao");

const statusAudio =
    document.getElementById("status-audio");


/* ==================================================
   INICIAR JOGO
================================================== */

btnIniciar.addEventListener("click", iniciarJogo);


function iniciarJogo() {

    perguntaAtual = 0;

    pontos = 0;

    acertos = 0;

    erros = 0;

    telaInicial.classList.remove("ativa");

    telaResultado.classList.remove("ativa");

    telaJogo.classList.add("ativa");

    carregarPergunta();
}


/* ==================================================
   CARREGAR PERGUNTA
================================================== */

function carregarPergunta() {

    respondeu = false;

    const pergunta =
        perguntas[perguntaAtual];


    /* CONTADOR */

    contador.textContent =
        `Questão ${perguntaAtual + 1} de ${perguntas.length}`;


    /* PONTUAÇÃO */

    pontuacao.textContent =
        `Pontos: ${pontos}`;


    /* FEEDBACK */

    feedback.textContent = "";

    feedback.className = "feedback";


    /* BOTÃO PRÓXIMA */

    btnProxima.style.display = "none";


    /* STATUS DO ÁUDIO */

    statusAudio.textContent =
        "Clique no botão para ouvir.";


    /* LIMPAR ALTERNATIVAS */

    alternativas.innerHTML = "";


    /* CRIAR ALTERNATIVAS */

    pergunta.alternativas.forEach(letra => {

        const botao =
            document.createElement("button");

        botao.classList.add("alternativa");

        botao.textContent = letra;

        botao.addEventListener(
            "click",
            () => verificarResposta(letra, botao)
        );

        alternativas.appendChild(botao);

    });

}


/* ==================================================
   REPRODUZIR ÁUDIO
================================================== */

btnAudio.addEventListener("click", tocarAudio);


function tocarAudio() {

    const pergunta =
        perguntas[perguntaAtual];


    /*
       O navegador tentará carregar
       o arquivo correspondente.
    */

    reproduzirAudio(pergunta);

}


/* ==================================================
   VERIFICAR RESPOSTA
================================================== */

function verificarResposta(letra, botaoClicado) {

    /*
       Impede que a criança responda
       várias vezes à mesma questão.
    */

    if (respondeu) {
        return;
    }


    respondeu = true;


    const pergunta =
        perguntas[perguntaAtual];


    /* DESABILITAR TODAS AS ALTERNATIVAS */

    const botoes =
        document.querySelectorAll(".alternativa");


    botoes.forEach(botao => {

        botao.disabled = true;

    });


    /* VERIFICAR */

    if (letra === pergunta.resposta) {

        /* ACERTO */

        pontos += 10;

        acertos++;

        botaoClicado.classList.add("correta");

        feedback.textContent =
            "⭐ Muito bem! Você acertou!";

        feedback.classList.add("acerto");


    } else {

        /* ERRO */

        erros++;

        botaoClicado.classList.add("errada");

        feedback.textContent =
            `🤔 Quase! A resposta era ${pergunta.resposta}.`;

        feedback.classList.add("erro");


        /*
           Destacar a resposta correta
        */

        botoes.forEach(botao => {

            if (
                botao.textContent ===
                pergunta.resposta
            ) {

                botao.classList.add("correta");

            }

        });

    }


    /* ATUALIZAR PONTUAÇÃO */

    pontuacao.textContent =
        `Pontos: ${pontos}`;


    /* MOSTRAR BOTÃO PRÓXIMA */

    btnProxima.style.display =
        "inline-block";

}


/* ==================================================
   PRÓXIMA PERGUNTA
================================================== */

btnProxima.addEventListener(
    "click",
    proximaPergunta
);


function proximaPergunta() {

    perguntaAtual++;

    if (
        perguntaAtual >=
        perguntas.length
    ) {

        finalizarJogo();

        return;
    }


    carregarPergunta();

}


/* ==================================================
   FINALIZAR JOGO
================================================== */

function finalizarJogo() {

    telaJogo.classList.remove("ativa");

    telaResultado.classList.add("ativa");


    document.getElementById(
        "resultado-acertos"
    ).textContent = acertos;


    document.getElementById(
        "resultado-erros"
    ).textContent = erros;


    document.getElementById(
        "resultado-pontos"
    ).textContent = pontos;

}


/* ==================================================
   REINICIAR
================================================== */

btnReiniciar.addEventListener(
    "click",
    iniciarJogo
);


function reproduzirAudio(pergunta) {
    const texto = pergunta.fala || pergunta.letra;

    if (!texto) {
        console.warn("Esta pergunta não possui texto para reprodução.");
        return;
    }

    // Tenta usar o MP3 quando ele estiver disponível.
    if (pergunta.audio) {
        const audio = new Audio(pergunta.audio);
        let fallbackExecutado = false;

        function usarVozSintetizada() {
            if (fallbackExecutado) return;
            fallbackExecutado = true;
            falarTexto(texto);
        }

        audio.addEventListener("error", usarVozSintetizada, { once: true });

        audio.play().catch(() => {
            usarVozSintetizada();
        });

        return;
    }

    // Sem arquivo de áudio: usa a voz do navegador.
    falarTexto(texto);
}

function falarTexto(texto) {
    if (!("speechSynthesis" in window)) {
        alert("Seu navegador não oferece suporte à reprodução de voz.");
        return;
    }

    // Interrompe a fala anterior para evitar sobreposição.
    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 0.8;
    fala.pitch = 1;

    window.speechSynthesis.speak(fala);
}
