(function(){
  const COLORS = [
    { name: 'Azul',    value: 'rgba(43, 220, 205, 1)' },
    { name: 'Vermelho',value: '#e03131' },
    { name: 'Roxo',    value: 'rgba(173, 95, 168, 1)' },
    { name: 'Amarelo', value: '#f9fe59ff' }
  ];

  const COLS = 7, ROWS = 6;
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const startBtn = document.getElementById('start');
  const resetBtn = document.getElementById('reset');
  const changeColorsBtn = document.getElementById('changeColors');
  const pickersEl = document.getElementById('pickers');

  let board = [];               // matriz ROWS x COLS (null | 'p1' | 'p2')
  let current = 'p1';           // jogador atual
  let gameOver = false;
  let selected = { p1: null, p2: null }; // cores escolhidas

  // ---------- Construção do tabuleiro ----------
  
  //---Criar o tabuleiro aqui ---///
  function buildBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  boardEl.innerHTML = '';

  for (let r = ROWS - 1; r >= 0; r--) {  // inverter a ordem das linhas
  const row = document.createElement('div');
  row.className = 'row';
  for (let c = 0; c < COLS; c++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.r = r;
    cell.dataset.c = c;

    const disc = document.createElement('div');
    disc.className = 'disc';
    cell.appendChild(disc);

    cell.addEventListener('click', () => dropInColumn(c));

    row.appendChild(cell);
  }
  boardEl.appendChild(row);  // adiciona cada linha do topo para a base
}

  }


  // ---------- Seletores de cores ----------
  function buildColorPickers(){
    const p1 = document.querySelector('.colors[data-player="1"]');
    const p2 = document.querySelector('.colors[data-player="2"]');
    p1.innerHTML = ''; p2.innerHTML = '';

    COLORS.forEach(({name, value}, idx) => {
      const b1 = document.createElement('button');
      b1.className = 'color-btn';
      b1.title = name;
      b1.style.background = value;
      b1.addEventListener('click', () => selectColor('p1', idx));

      const b2 = document.createElement('button');
      b2.className = 'color-btn';
      b2.title = name;
      b2.style.background = value;
      b2.addEventListener('click', () => selectColor('p2', idx));

      p1.appendChild(b1);
      p2.appendChild(b2);
    });

    applyPickerState();
  }

  function selectColor(player, idx){
    selected[player] = idx;
    // impedir duplicidade
    if (selected.p1 !== null && selected.p1 === selected.p2){
      // se escolheu igual, “desmarca” o outro jogador
      const other = player === 'p1' ? 'p2' : 'p1';
      selected[other] = null;
    }
    applyPickerState();
    statusEl.textContent = 'Cores escolhidas? Clique em "Começar".';
  }

  function applyPickerState(){
    // UI: marcar selecionados e desabilitar cor do outro
    const groups = document.querySelectorAll('.colors');
    groups.forEach(group => {
      const player = group.dataset.player;
      const other = player === '1' ? 'p2' : 'p1';
      const buttons = [...group.querySelectorAll('.color-btn')];
      buttons.forEach((btn, i) => {
        btn.disabled = (selected['p'+other] === i); // cor já escolhida pelo outro
        btn.classList.toggle('selected', selected['p'+player] === i);
      });
    });
  }

  function colorOf(player){
    const idx = selected[player];
    if (idx === null) return '#eaeaea';
    return COLORS[idx].value;
  }

  // ---------- Jogo ----------
  function dropInColumn(c){
    if (gameOver) return;
    if (selected.p1 === null || selected.p2 === null){
      statusEl.textContent = 'Escolha as cores dos dois jogadores e clique em "Começar".';
      return;
    }
    // encontra a linha mais baixa vazia nessa coluna
    for (let r = ROWS - 1; r >= 0; r--){
      if (board[r][c] === null){
        board[r][c] = current;
        paintCell(r, c, colorOf(current));
        if (checkWin(r, c)){
          gameOver = true;
          statusEl.textContent = `Vitória do ${current === 'p1' ? 'Jogador 1' : 'Jogador 2'}! 🎉`;
        } else if (isDraw()){
          gameOver = true;
          statusEl.textContent = 'Empate! 🤝';
        } else {
          togglePlayer();
        }
        return;
      }
    }
    // coluna cheia
    statusEl.textContent = 'Coluna cheia. Escolha outra coluna.';
  }

  function paintCell(r, c, color){
    const cell = getCell(r, c);
    const disc = cell.querySelector('.disc');
    disc.style.background = color;
  }

  function getCell(r, c){
    return boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  }

  function togglePlayer(){
    current = (current === 'p1') ? 'p2' : 'p1';
    statusEl.textContent = `Vez do ${current === 'p1' ? 'Jogador 1' : 'Jogador 2'}.`;
  }

  function isDraw(){
    return board.every(row => row.every(x => x !== null));
  }

  // checagem de vitória (4 seguidas) a partir da última jogada (r,c)
  function checkWin(r, c){
    const player = board[r][c];
    const dirs = [
      [0,1],  // horizontal
      [1,0],  // vertical
      [1,1],  // diagonal down-right
      [1,-1], // diagonal down-left
    ];
    for (const [dr, dc] of dirs){
      const cells = [[r,c]];
      // para frente
      let rr=r+dr, cc=c+dc;
      while (inBounds(rr,cc) && board[rr][cc]===player) { cells.push([rr,cc]); rr+=dr; cc+=dc; }
      // para trás
      rr=r-dr; cc=c-dc;
      while (inBounds(rr,cc) && board[rr][cc]===player) { cells.unshift([rr,cc]); rr-=dr; cc-=dc; }
      if (cells.length >= 4){
        // destacar 4 primeiros em sequência
        const four = cells.slice(0,4);
        four.forEach(([r0,c0]) => getCell(r0,c0).classList.add('win'));
        return true;
      }
    }
    return false;
  }

  function inBounds(r,c){ return r>=0 && r<ROWS && c>=0 && c<COLS; }

  // ---------- Botões ----------
  startBtn.addEventListener('click', () => {
    if (selected.p1 === null || selected.p2 === null) {
      statusEl.textContent = 'Escolha as cores dos dois jogadores antes de começar.';
      return;
    }
    if (selected.p1 === selected.p2) {
      statusEl.textContent = 'As cores devem ser diferentes.';
      return;
    }
    gameOver = false;
    current = 'p1';
    statusEl.textContent = 'Jogo iniciado! Vez do Jogador 1.';
    // travar a troca de cores durante o jogo
    [...document.querySelectorAll('.color-btn')].forEach(b => b.disabled = true);
  });

  //--Criar a função para resetar o jogo --//
  resetBtn.addEventListener('click', () => {
    buildBoard();
    gameOver = false;
    current = 'p1';
    statusEl.textContent = 'Tabuleiro resetado! Escolha as cores e clique em "Começar".';
    // libera novamente os botões de cor
    [...document.querySelectorAll('.color-btn')].forEach(b => b.disabled = false);
  });


  changeColorsBtn.addEventListener('click', () => {
    // permite re-escolher cores
    selected = { p1: null, p2: null };
    buildColorPickers();
    statusEl.textContent = 'Escolha as cores novamente e clique em "Começar".';
    // limpa o tabuleiro também
    buildBoard();
    gameOver = false;
  });

  // ---------- Inicialização ----------
  buildBoard();
  buildColorPickers();
  statusEl.textContent = 'Cada jogador escolha uma cor diferente e clique em "Começar".';

})();