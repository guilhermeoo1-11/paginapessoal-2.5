const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

let pontos = 0;


// =========================
// NAVE
// =========================

const nave = {
    x: 80,
    y: 220,
    largura: 40,
    altura: 30,
    velocidade: 5
};


// =========================
// TECLAS
// =========================

const teclas = {};

document.addEventListener("keydown", function(event) {

    teclas[event.key.toLowerCase()] = true;

    if (event.code === "Space") {
        atirar();
        event.preventDefault();
    }

});

document.addEventListener("keyup", function(event) {

    teclas[event.key.toLowerCase()] = false;

});


// =========================
// TIROS
// =========================

let tiros = [];

function atirar() {

    tiros.push({
        x: nave.x + nave.largura,
        y: nave.y + 13,
        largura: 15,
        altura: 5,
        velocidade: 9
    });

}


// =========================
// INIMIGOS
// =========================

let inimigos = [];

function criarInimigo() {

    inimigos.push({
        x: canvas.width + 20,
        y: Math.random() * (canvas.height - 40),
        largura: 35,
        altura: 30,
        velocidade: 2 + Math.random() * 2
    });

}

setInterval(criarInimigo, 1000);


// =========================
// ESTRELAS
// =========================

let estrelas = [];

for (let i = 0; i < 80; i++) {

    estrelas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        tamanho: Math.random() * 3 + 1,
        velocidade: Math.random() * 2 + 1
    });

}


// =========================
// DESENHAR ESTRELAS
// =========================

function desenharEstrelas() {

    ctx.fillStyle = "white";

    estrelas.forEach(estrela => {

        ctx.fillRect(
            estrela.x,
            estrela.y,
            estrela.tamanho,
            estrela.tamanho
        );

        estrela.x -= estrela.velocidade;

        if (estrela.x < 0) {

            estrela.x = canvas.width;
            estrela.y = Math.random() * canvas.height;

        }

    });

}


// =========================
// DESENHAR NAVE
// =========================

function desenharNave() {

    const x = nave.x;
    const y = nave.y;

    // Fogo
    ctx.fillStyle = "#ff9d00";
    ctx.fillRect(x - 10, y + 10, 10, 10);

    ctx.fillStyle = "#ffdd00";
    ctx.fillRect(x - 5, y + 13, 7, 5);

    // Corpo
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(x, y + 8, 30, 15);

    // Parte superior
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 10, y, 15, 10);

    // Ponta
    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(x + 30, y + 10, 10, 10);

    // Asa
    ctx.fillStyle = "#777777";
    ctx.fillRect(x + 8, y + 22, 20, 8);

    // Janela
    ctx.fillStyle = "#35bfff";
    ctx.fillRect(x + 18, y + 5, 7, 7);

}


// =========================
// DESENHAR INIMIGO
// =========================

function desenharInimigo(inimigo) {

    const x = inimigo.x;
    const y = inimigo.y;

    // Corpo
    ctx.fillStyle = "#d62828";
    ctx.fillRect(x + 5, y + 5, 25, 20);

    // Ponta
    ctx.fillRect(x, y + 10, 5, 10);

    // Asas
    ctx.fillStyle = "#8b0000";
    ctx.fillRect(x + 10, y, 15, 8);
    ctx.fillRect(x + 10, y + 22, 15, 8);

    // Janela
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(x + 15, y + 10, 7, 7);

}


// =========================
// ATUALIZAR NAVE
// =========================

function atualizarNave() {

    if (teclas["arrowup"] || teclas["w"]) {
        nave.y -= nave.velocidade;
    }

    if (teclas["arrowdown"] || teclas["s"]) {
        nave.y += nave.velocidade;
    }

    if (teclas["arrowleft"] || teclas["a"]) {
        nave.x -= nave.velocidade;
    }

    if (teclas["arrowright"] || teclas["d"]) {
        nave.x += nave.velocidade;
    }


    // Limites

    if (nave.x < 0) {
        nave.x = 0;
    }

    if (nave.y < 0) {
        nave.y = 0;
    }

    if (nave.x + nave.largura > canvas.width) {
        nave.x = canvas.width - nave.largura;
    }

    if (nave.y + nave.altura > canvas.height) {
        nave.y = canvas.height - nave.altura;
    }

}


// =========================
// ATUALIZAR TIROS
// =========================

function atualizarTiros() {

    tiros.forEach(tiro => {

        tiro.x += tiro.velocidade;

    });

    tiros = tiros.filter(tiro => tiro.x < canvas.width);

}


// =========================
// ATUALIZAR INIMIGOS
// =========================

function atualizarInimigos() {

    inimigos.forEach(inimigo => {

        inimigo.x -= inimigo.velocidade;

    });

    inimigos = inimigos.filter(
        inimigo => inimigo.x > -50
    );

}


// =========================
// COLISÕES
// =========================

function verificarColisoes() {

    tiros.forEach((tiro, tiroIndex) => {

        inimigos.forEach((inimigo, inimigoIndex) => {

            if (
                tiro.x < inimigo.x + inimigo.largura &&
                tiro.x + tiro.largura > inimigo.x &&
                tiro.y < inimigo.y + inimigo.altura &&
                tiro.y + tiro.altura > inimigo.y
            ) {

                tiros.splice(tiroIndex, 1);

                inimigos.splice(inimigoIndex, 1);

                pontos += 10;

                document.getElementById("pontos").textContent = pontos;

            }

        });

    });

}


// =========================
// DESENHAR TUDO
// =========================

function desenhar() {

    // Fundo
    ctx.fillStyle = "#050914";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Estrelas
    desenharEstrelas();


    // Nave
    desenharNave();


    // Tiros
    ctx.fillStyle = "#00ff66";

    tiros.forEach(tiro => {

        ctx.fillRect(
            tiro.x,
            tiro.y,
            tiro.largura,
            tiro.altura
        );

    });


    // Inimigos
    inimigos.forEach(inimigo => {

        desenharInimigo(inimigo);

    });

}


// =========================
// LOOP DO JOGO
// =========================

function loop() {

    atualizarNave();

    atualizarTiros();

    atualizarInimigos();

    verificarColisoes();

    desenhar();

    requestAnimationFrame(loop);

}

loop();