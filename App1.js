// app.js 
// Objetivo: implementar Promises, async/await, encadeamento, erros, Promise.all e Promise.race (timeout)
// Dicas e TODOs estão espalhados no arquivo ;)

// --------- UTILIDADES ---------

function setStatus(el, tipo, msg){
  el.classList.remove('info','success','error');
  if (tipo) el.classList.add(tipo);
  el.textContent = msg;
}

/**
 * Cria uma Promise que rejeita se estourar o tempo (ms).
 * Para usar com Promise.race.
 */
function timeout(ms){
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Tempo limite excedido.')), ms);
  });
}

// --------- 1) BUSCAR CEP (ViaCEP) ---------
const formCep = document.getElementById('form-cep');
const cepInput = document.getElementById('cep');
const btnBuscar = document.getElementById('btnBuscar');
const statusEl = document.getElementById('status');

const logradouro = document.getElementById('logradouro');
const bairro = document.getElementById('bairro');
const localidade = document.getElementById('localidade');
const uf = document.getElementById('uf');

formCep.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cep = cepInput.value.replace(/\D/g,'');
  if (cep.length !== 8){
    setStatus(statusEl, 'error', 'CEP inválido. Use 8 dígitos.');
    return;
  }
  // TODO: implementar busca com fetch → then/json → preencher campos
  // TODO: usar try/catch para tratar erros e finally para estado de loading
  // Dica: fetch(`https://viacep.com.br/ws/${cep}/json/`)
  

  // ---- Início -  Assíncrona ----

  setStatus(statusEl, 'info', 'Buscando...');

  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json()) // Começa a busca e converte a resposta
    .then(dados => {                   //  Se a conversão der certo, lida com os dados
      if (dados.erro) {
        setStatus(statusEl, 'error', 'CEP não encontrado.');
      } else {
        logradouro.value = dados.logradouro;
        bairro.value = dados.bairro;
        localidade.value = dados.localidade;
        uf.value = dados.uf;
        setStatus(statusEl, 'success', 'Endereço encontrado!');
      }
    })
    .catch(erro => {                   // Se QUALQUER passo antes falhar, cai aqui
      console.error(erro);
      setStatus(statusEl, 'error', 'Falha na busca. Verifique sua conexão.');
    });
});

// --------- 2) SALVAR CADASTRO (simulado) ---------
const btnSalvar = document.getElementById('btnSalvar');
const statusSalvar = document.getElementById('statusSalvar');

/**
 * Simula salvamento com latência e chance de falha.
 * Retorna Promise que resolve com mensagem de sucesso ou rejeita com erro.
 */
function salvarCadastroSimulado(dados){
  return new Promise((resolve, reject) => {
    const atraso = Math.floor(Math.random()*2000) + 800; // 0.8s a 2.8s
    const falha = Math.random() < 0.25; // 25% de chance de falhar
    setTimeout(() => {
      if (falha) reject(new Error('Falha ao salvar no servidor.'));
      else resolve({ ok: true, id: Math.floor(Math.random()*10000), dados });
    }, atraso);
  });
}

btnSalvar.addEventListener('click', async () => {  // Desabilita o botão para  evitar cliques duplos
  btnSalvar.disabled = true;
  setStatus(statusEl, 'info', 'Salvando...');

  // Monta o objeto com os dados dos campos
  const endereco = {
    cep: cepInput.value,
    logradouro: logradouro.value,
    bairro: bairro.value,
    localidade: localidade.value,
    uf: uf.value,
  };

  try {
    // Chama a função que simula o salvamento e espera (await) o resultado
    const resultado = await salvarCadastroSimulado(endereco);
    console.log('Salvo com sucesso:', resultado);
    setStatus(statusEl, 'success', `Endereço salvo com sucesso! (ID: ${resultado.id})`);
  
  } catch (erro) {
    //. Se algo der errado na etapa anterior, o erro é capturado aqui
    console.error('Erro ao salvar:', erro);
    setStatus(statusEl, 'error', 'Erro ao salvar o endereço. Tente novamente.');
  
  } finally {
       // TODO: exibir mensagens e usar finally para remover loading/desabilitar botão
    //  Este bloco é executado sempre, dando certo ou errado
    btnSalvar.disabled = false;
  }
});


// --------- 3) PROMISE.ALL — Buscar múltiplos CEPs ---------
const cepsLista = document.getElementById('cepsLista');
const btnBuscarMultiplos = document.getElementById('btnBuscarMultiplos');
const tbodyResultados = document.getElementById('tbodyResultados');
const statusMultiplos = document.getElementById('statusMultiplos');

btnBuscarMultiplos.addEventListener('click', async () => {
  // TODO: ler ceps separados por vírgula → array
  // TODO: mapear para array de Promises de fetch/json
  // TODO: usar Promise.all e preencher a tabela
  // TODO: tratar erros (um CEP inválido deve causar erro? discuta com a turma)
 
  // Limpa a tabela e o status antes de começar
  tbodyResultados.innerHTML = '';
  setStatus(statusMultiplos, 'info', 'Buscando todos os CEPs...');
  btnBuscarMultiplos.disabled = true;

  //  Pega a string de CEPs e transforma em um array limpo
  const ceps = cepsLista.value
    .split(',') // Quebra a string pela vírgula
    .map(cep => cep.trim().replace(/\D/g, '')) // Remove espaços e não-números de cada CEP
    .filter(cep => cep.length === 8); // Remove CEPs que não têm 8 dígitos

  if (ceps.length === 0) {
    setStatus(statusMultiplos, 'error', 'Nenhum CEP válido para buscar.');
    btnBuscarMultiplos.disabled = false;
    return;
  }
  
  // Cria uma lista  array de Promises. Cada promise é uma busca de CEP.
  const arrayDePromises = ceps.map(cep => 
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(response => response.json())
  );

  try {
    // Espera TODAS as promises do array serem resolvidas
    const resultados = await Promise.all(arrayDePromises);

    // Se todas deram certo, preenche a tabela
    resultados.forEach(dados => {
      if (!dados.erro) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${dados.cep}</td>
          <td>${dados.logradouro}</td>
          <td>${dados.bairro}</td>
          <td>${dados.localidade}</td>
          <td>${dados.uf}</td>
        `;
        tbodyResultados.appendChild(tr);
      }
    });
    setStatus(statusMultiplos, 'success', 'Busca concluída!');

  } catch (erro) {
    // Se UMA promise que seja der erro (ex: rede caiu), cai aqui
    console.error('Erro no Promise.all:', erro);
    setStatus(statusMultiplos, 'error', 'Houve um erro ao buscar os CEPs. Verifique sua conexão.');
  
  } finally {
    btnBuscarMultiplos.disabled = false;
  }
});


// --------- 4) PROMISE.RACE — Timeout de busca ---------
const cepTimeout = document.getElementById('cepTimeout');
const btnBuscarTimeout = document.getElementById('btnBuscarTimeout');
const statusTimeout = document.getElementById('statusTimeout');

btnBuscarTimeout.addEventListener('click', async () => {
  // TODO: Promise.race([fetch(...), timeout(2000)])
  // TODO: tratar erro de timeout no catch

  const cep = cepTimeout.value.replace(/\D/g, '');
  if (cep.length !== 8) {
    setStatus(statusTimeout, 'error', 'CEP inválido. Use 8 dígitos.');
    return;
  }

  setStatus(statusTimeout, 'info', 'Buscando CEP com limite de 2 segundos...');
  btnBuscarTimeout.disabled = true;

  // Prepara os "corredores"
  const busca = fetch(`https://viacep.com.br/ws/${cep}/json/`)
                  .then(response => response.json());
  
  const limiteDeTempo = timeout(2000); //  = 2 segundos

  try {
    // Inicia a corrida!
    const resultado = await Promise.race([busca, limiteDeTempo]);

    // Se chegar aqui, a 'busca' ganha
    if (resultado.erro) {
      setStatus(statusTimeout, 'error', 'CEP não encontrado.');
    } else {
      setStatus(statusTimeout, 'success', `CEP encontrado: ${resultado.logradouro}`);
    }

  } catch (erro) {
    // Se chegar aqui, o 'limiteDeTempo' ganha ou houve outro erro
    console.error('Erro no Promise.race:', erro);
    setStatus(statusTimeout, 'error', 'A busca demorou demais (timeout). Tente novamente.');
  
  } finally {
    btnBuscarTimeout.disabled = false;
  }
});

