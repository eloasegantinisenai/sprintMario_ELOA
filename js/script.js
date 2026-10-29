document.addEventListener('DOMContentLoaded', () => {
    // Elementos do Jogo
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const coin = document.querySelector('.coin');
    const gameBoard = document.getElementById('game-board');
    const hudPlayerName = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-display');
    const livesDisplay = document.getElementById('lives-display'); // Elemento das vidas
    const jumpTip = document.getElementById('jump-tip');

    // Modais e Telas
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const btnViewRanking = document.getElementById('btn-view-ranking');

    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('save-status-msg');
    const rankingBody = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');

    // Variáveis de Estado
    let currentPlayer = '';
    let score = 0;
    let lives = 3;
    let isInvincible = false;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;
    let selectedCharacter = 'mario';

    // Recupera último nome utilizado caso exista
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    /**
     * Inicia uma nova rodada
     */
    function startGame() {
        // Limpa loops anteriores se existirem
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        // Reseta posições e visuais
        resetElements();

        isPlaying = true;
        score = 0;
        lives = 3;
        isInvincible = false;

        scoreDisplay.textContent = '0';
        if (livesDisplay) {
            livesDisplay.textContent = '❤️ ❤️ ❤️';
        }
        hudPlayerName.textContent = currentPlayer || 'Jogador';

        // Ativa animações CSS do jogo
        gameBoard.classList.add('running');

        // Variável para guardar o nível de velocidade atual
        let currentSpeedLevel = 0;

        scoreLoop = setInterval(() => {
            if (isPlaying) {
                score += 1;
                scoreDisplay.textContent = score;

                // Determina a nova duração de acordo com a pontuação
                let newDuration = '1.8s';
                let newLevel = 0;

                if (score >= 700) {
                    newDuration = '0.7s';
                    newLevel = 6;
                } else if (score >= 500) {
                    newDuration = '0.8s';
                    newLevel = 5;
                } else if (score >= 300) {
                    newDuration = '0.9s';
                    newLevel = 4;
                } else if (score >= 200) {
                    newDuration = '1.0s';
                    newLevel = 3;
                } else if (score >= 100) {
                    newDuration = '1.2s';
                    newLevel = 2;
                } else if (score >= 60) {
                    newDuration = '1.4s';
                    newLevel = 1;
                }

                // Só altera quando realmente mudar de nível/faixa de pontos
                if (newLevel !== currentSpeedLevel) {
                    currentSpeedLevel = newLevel;
                    updatePipeSpeed(newDuration);
                }

                // Mudanças visuais de cenário por pontuação
                if (score >= 150 && score < 300) {
                    gameBoard.classList.add('night');
                    gameBoard.classList.remove('deep-night');
                } else if (score >= 400) {
                    gameBoard.classList.remove('night');
                    gameBoard.classList.add('deep-night');
                }
            }
        }, 100);

        // Loop de colisão
        gameLoop = setInterval(checkCollision, 10);
    }

    function resetElements() {
        pipe.classList.remove('fast');
        gameBoard.classList.remove('night');
        gameBoard.classList.remove('deep-night');
        gameBoard.style.backgroundImage = '';
        currentSpeedLevel = 0;
        pipe.style.animation = '';
        pipe.style.animationDuration = '';
        pipe.style.left = '';

        if (coin) {
            coin.style.display = '';
        }

        const selectedChar = document.querySelector('input[name="character"]:checked')?.value || 'mario';

        mario.classList.remove('sonic-active', 'luigi-active');

        pipe.style.removeProperty('--pipe-speed');


        if (selectedChar === 'sonic') {
            mario.src = 'assets/soniccc.gif';
            mario.classList.add('sonic-active');
        } else if (selectedChar === 'luigi') {
            mario.src = 'assets/luigi.gif';
            mario.classList.add('luigi-active');
        } else {
            mario.src = 'assets/mario.gif';
        }



        mario.style.animation = '';
        mario.style.bottom = '0px';
        mario.style.marginLeft = '';
        mario.style.opacity = '1';
        mario.classList.remove('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '1';
        }
    }

    function jump() {
        if (!isPlaying) return;
        if (mario.classList.contains('jump')) return;

        mario.classList.add('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '0';
        }

        setTimeout(() => {
            mario.classList.remove('jump');
        }, 500);
    }

    function checkCollision() {
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');
        const coinPosition = coin.offsetLeft;

        // 1. COLISÃO COM O CANO (SISTEMA DE VIDAS)
        if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {
            if (isInvincible) return;

            lives -= 1;
            isInvincible = true;
            
            const lifeEffect = document.getElementById('life-lost-effect');
            const livesBox = document.querySelector('.lives-info');

            if (lifeEffect) {
                lifeEffect.classList.remove('show');
                void lifeEffect.offsetWidth; // Força o reflow do browser para reiniciar a animação
                lifeEffect.classList.add('show');
            }

            if (livesBox) {
                livesBox.classList.add('damage');
                setTimeout(() => livesBox.classList.remove('damage'), 400);
            }

            if (livesDisplay) {
                if (lives === 2) livesDisplay.textContent = '❤️ ❤️ 🖤';
                else if (lives === 1) livesDisplay.textContent = '❤️ 🖤 🖤';
                else if (lives <= 0) livesDisplay.textContent = '🖤 🖤 🖤';
            }

            if (lives <= 0) {
                triggerGameOver(pipePosition, marioPosition);
                return;
            }

            setTimeout(() => {
                isInvincible = false;
            }, 1000);
        }

        // 2. PEGAR MOEDA (+10 PONTOS)
        if (coinPosition <= 130 && coinPosition >= 40 && marioPosition >= 50 && coin.style.display !== 'none') {
            score += 10;
            scoreDisplay.textContent = score;
            coin.style.display = 'none';

            setTimeout(() => {
                if (isPlaying) {
                    coin.style.display = 'block';
                }
            }, 1200);
        }
    }

    function triggerGameOver(pipePosition, marioPosition) {
        isPlaying = false;
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        gameBoard.classList.remove('running');

        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;

        if (selectedCharacter === 'sonic') {
            mario.src = 'assets/game-over-sonic.png';
        } else if (selectedCharacter === 'luigi') {
            mario.src = 'assets/luigi-game-overr.png'; // Ou mantenha 'assets/luigi.gif' caso não tenha a imagem de game over dele
        } else {
            mario.src = 'assets/game-over.png';
        }

        mario.style.width = '75px';
        mario.style.marginLeft = '50px';

        finalScoreValue.textContent = score;
        saveStatusMsg.textContent = 'Salvando pontuação no banco...';
        saveStatusMsg.style.color = '#ffcc00';

        gameoverModal.classList.add('active');

        saveScore(currentPlayer, score);
    }

    function saveScore(playerName, finalScore) {
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: playerName,
                pontos: finalScore
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                saveStatusMsg.style.color = '#10b981';
                if (data.ranking) {
                    renderRanking(data.ranking, playerName, finalScore);
                }
            } else {
                saveStatusMsg.textContent = '⚠️ ' + (data.message || 'Erro ao registrar.');
                saveStatusMsg.style.color = '#ef4444';
            }
        })
        .catch(err => {
            console.error('Erro na requisição:', err);
            saveStatusMsg.textContent = '⚠️ Erro ao conectar ao servidor Laragon.';
            saveStatusMsg.style.color = '#ef4444';
        });
    }

    function fetchRanking() {
        fetch('obter_ranking.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.ranking) {
                    renderRanking(data.ranking);
                }
            })
            .catch(err => console.error('Erro ao buscar ranking:', err));
    }

    function renderRanking(list, highlightName = null, highlightScore = null) {
        if (!rankingBody) return;
        rankingBody.innerHTML = '';

        if (!list || list.length === 0) {
            rankingBody.innerHTML = '<tr><td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda. Jogue para ser o 1º!</td></tr>';
            return;
        }

        let highlighted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            if (!highlighted && highlightName && item.nome === highlightName && parseInt(item.pontos, 10) === highlightScore) {
                tr.classList.add('highlight-current');
                highlighted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Submit do Formulário de Início
    startForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameValue = playerInput.value.trim();
        if (!nameValue) {
            playerInput.focus();
            return;
        }

        const charInput = document.querySelector('input[name="character"]:checked');
        if (charInput) {
            selectedCharacter = charInput.value;
        }
        currentPlayer = nameValue;
        localStorage.setItem('mario_jump_player', currentPlayer);

        startModal.classList.remove('active');
        startGame();
    });

    btnViewRanking.addEventListener('click', () => {
        fetchRanking();
        finalScoreValue.textContent = '---';
        saveStatusMsg.textContent = '';
        startModal.classList.remove('active');
        gameoverModal.classList.add('active');
    });

    btnRestart.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        if (!currentPlayer) {
            startModal.classList.add('active');
            playerInput.focus();
        } else {
            startGame();
        }
    });

    btnChangePlayer.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        resetElements();
        startModal.classList.add('active');
        playerInput.value = '';
        playerInput.focus();
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
            if (isPlaying) {
                e.preventDefault();
                jump();
            }
        }
    });

    function updatePipeSpeed(newDuration) {
        const currentLeft = pipe.getBoundingClientRect().left;
        const boardLeft = gameBoard.getBoundingClientRect().left;
        const offset = currentLeft - boardLeft;

        // Ajusta a animação para a nova duração preservando a posição do cano
        pipe.style.animation = 'none';
        pipe.style.left = `${offset}px`;

        // Força o reflow do navegador
        void pipe.offsetWidth;

        pipe.style.left = '';
        pipe.style.animation = `pipe-animation ${newDuration} infinite linear`;
    }
});
