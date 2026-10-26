import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

const HORARIOS_DELIVERY = {
  0: { abertura: '18:30', fechamento: '22:30' }, // Domingo
  1: null, // Segunda-feira: fechado
  2: { abertura: '18:30', fechamento: '22:30' }, // Terça-feira
  3: { abertura: '18:30', fechamento: '22:30' }, // Quarta-feira
  4: { abertura: '18:30', fechamento: '22:30' }, // Quinta-feira
  5: { abertura: '18:30', fechamento: '23:30' }, // Sexta-feira
  6: { abertura: '15:00', fechamento: '23:30' }, // Sábado
}

const NOMES_DIAS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]

function obterStatusDelivery(data = new Date()) {
  const dia = data.getDay()
  const horario = HORARIOS_DELIVERY[dia]

  if (!horario) {
    return {
      aberto: false,
      mensagem: 'Delivery fechado hoje.',
      proximaAbertura: obterProximaAbertura(data),
    }
  }

  const [horaAbertura, minutoAbertura] = horario.abertura.split(':').map(Number)
  const [horaFechamento, minutoFechamento] = horario.fechamento.split(':').map(Number)
  const minutosAgora = data.getHours() * 60 + data.getMinutes()
  const minutosAbertura = horaAbertura * 60 + minutoAbertura
  const minutosFechamento = horaFechamento * 60 + minutoFechamento
  const aberto = minutosAgora >= minutosAbertura && minutosAgora < minutosFechamento

  return {
    aberto,
    mensagem: aberto
      ? `Delivery aberto até às ${horario.fechamento}.`
      : `Delivery fechado no momento. Hoje atendemos das ${horario.abertura} às ${horario.fechamento}.`,
    proximaAbertura: aberto ? null : obterProximaAbertura(data),
  }
}

function obterProximaAbertura(data = new Date()) {
  for (let diasAdiante = 0; diasAdiante < 8; diasAdiante += 1) {
    const dataCandidata = new Date(data)
    dataCandidata.setDate(data.getDate() + diasAdiante)

    const horario = HORARIOS_DELIVERY[dataCandidata.getDay()]
    if (!horario) continue

    const [hora, minuto] = horario.abertura.split(':').map(Number)
    dataCandidata.setHours(hora, minuto, 0, 0)

    if (dataCandidata.getTime() > data.getTime()) {
      const diaTexto =
        diasAdiante === 0
          ? 'hoje'
          : diasAdiante === 1
            ? 'amanhã'
            : NOMES_DIAS[dataCandidata.getDay()]

      return `${diaTexto}, às ${horario.abertura}`
    }
  }

  return 'consulte nossos horários de atendimento'
}

function App() {
  const [busca, setBusca] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos')
  const [marcaSelecionada, setMarcaSelecionada] = useState('')
  const [carrinho, setCarrinho] = useState([])
  const [produtoAdicionado, setProdutoAdicionado] = useState(null)

  // Produtos carregados do Supabase
  const [produtos, setProdutos] = useState([])
  const [carregandoProdutos, setCarregandoProdutos] = useState(true)

  // Cadastro e edição de produtos
  const [mostrarFormularioProduto, setMostrarFormularioProduto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [nomeProduto, setNomeProduto] = useState('')
  const [marcaProduto, setMarcaProduto] = useState('')
  const [descricaoProduto, setDescricaoProduto] = useState('')
  const [precoProduto, setPrecoProduto] = useState('')
  const [categoriaProduto, setCategoriaProduto] = useState('Essência')
  const [emojiProduto, setEmojiProduto] = useState('📦')
  const [imagemUrlProduto, setImagemUrlProduto] = useState('')
  const [produtoFotoEditando, setProdutoFotoEditando] = useState(null)
  const [novaImagemUrl, setNovaImagemUrl] = useState('')

  const [nomeCliente, setNomeCliente] = useState('')
  const [telefoneCliente, setTelefoneCliente] = useState('')
  const [enderecoCliente, setEnderecoCliente] = useState('')
  const [numeroCasa, setNumeroCasa] = useState('')
  const [bairroCliente, setBairroCliente] = useState('')
  const [pagamento, setPagamento] = useState('Pix')
  const [valorTroco, setValorTroco] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [mostrarCheckout, setMostrarCheckout] = useState(false)

  const [pedidos, setPedidos] = useState(() => {
    return JSON.parse(localStorage.getItem('pedidosHookah29') || '[]')
  })

  const [mostrarAdmin, setMostrarAdmin] = useState(
    window.location.pathname === '/admin'
  )
  const [senhaAdmin, setSenhaAdmin] = useState('')
  const [emailAdmin, setEmailAdmin] = useState('')
  const [adminAutenticado, setAdminAutenticado] = useState(false)

  const [agora, setAgora] = useState(new Date())
  const statusDelivery = obterStatusDelivery(agora)

  // Atualiza o status do delivery automaticamente a cada 30 segundos.
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(new Date()), 30000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminAutenticado(!!session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setAdminAutenticado(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const categorias = ['Essência', 'Carvão', 'Alumínio', 'Todos']

  // Carregar produtos ativos do Supabase
  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('Erro ao carregar produtos:', error)
        alert('Não foi possível carregar os produtos. Verifique a conexão com o banco.')
        setCarregandoProdutos(false)
        return
      }

      setProdutos(
        (data || []).map((produto) => ({
          ...produto,
          preco: Number(produto.preco),
        }))
      )

      setCarregandoProdutos(false)
    }

    carregarProdutos()
  }, [])

  const produtosFiltrados = produtos.filter((produto) => {
    const correspondeBusca = `${produto.nome} ${produto.marca || ''}`
      .toLowerCase()
      .includes(busca.toLowerCase())

    const correspondeCategoria =
      categoriaSelecionada === 'Todos' ||
      produto.categoria === categoriaSelecionada

    return correspondeBusca && correspondeCategoria
  })

  const marcasEssencias = [
    ...new Set(
      produtos
        .filter(
          (produto) =>
            produto.categoria === 'Essência' &&
            produto.marca &&
            produto.marca.trim() !== ''
        )
        .map((produto) => produto.marca.trim())
    ),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const produtosDaMarca = produtosFiltrados.filter(
    (produto) =>
      produto.categoria === 'Essência' &&
      produto.marca?.trim() === marcaSelecionada
  )

  async function salvarFotoProduto(produto) {
    const url = novaImagemUrl.trim()

    if (!url) {
      alert('Cole o endereço da foto primeiro.')
      return
    }

    const { data, error } = await supabase
      .from('produtos')
      .update({ imagem_url: url })
      .eq('id', produto.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar foto:', error)
      alert('Não foi possível salvar a foto. Tente novamente.')
      return
    }

    setProdutos((atuais) =>
      atuais.map((item) =>
        item.id === produto.id
          ? { ...item, ...data, preco: Number(data.preco) }
          : item
      )
    )

    setNovaImagemUrl('')
    setProdutoFotoEditando(null)
    alert('Foto do produto atualizada com sucesso!')
  }

  function limparFormularioProduto() {
    setProdutoEditando(null)
    setNomeProduto('')
    setMarcaProduto('')
    setDescricaoProduto('')
    setPrecoProduto('')
    setCategoriaProduto('Essência')
    setEmojiProduto('📦')
    setImagemUrlProduto('')
    setMostrarFormularioProduto(false)
  }

  function iniciarEdicaoProduto(produto) {
    setProdutoEditando(produto.id)
    setNomeProduto(produto.nome || '')
    setMarcaProduto(produto.marca || '')
    setDescricaoProduto(produto.descricao || '')
    setPrecoProduto(String(produto.preco ?? ''))
    setCategoriaProduto(produto.categoria || 'Essência')
    setEmojiProduto(produto.emoji || '📦')
    setImagemUrlProduto(produto.imagem_url || '')
    setMostrarFormularioProduto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

 async function alternarDisponibilidade(produto) {
  const novoStatus = !produto.ativo

  try {
    const { data, error } = await supabase
      .from('produtos')
      .update({ ativo: novoStatus })
      .eq('id', produto.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Erro ao alterar disponibilidade:', error)

      alert(
        `Erro ao alterar disponibilidade:\n\n${error.message}\n\nCódigo: ${error.code || 'Não informado'}`
      )
      return
    }

    if (!data) {
      alert(
        'Nenhum produto foi atualizado. Verifique se você está conectado ao painel administrativo e se tem permissão para editar este produto.'
      )
      return
    }

    setProdutos((atuais) =>
      atuais.map((item) =>
        item.id === produto.id
          ? { ...item, ...data, preco: Number(data.preco) }
          : item
      )
    )

    alert(
      novoStatus
        ? 'Produto reativado com sucesso!'
        : 'Produto marcado como indisponível.'
    )
  } catch (erro) {
    console.error('Erro inesperado:', erro)
    alert(`Erro inesperado: ${erro.message}`)
  }
}
  function adicionarAoCarrinho(produto) {
    if (!produto.ativo) {
      alert('Este produto está indisponível no momento.')
      return
    }
  setCarrinho((carrinhoAtual) => {
    const itemExistente = carrinhoAtual.find(
      (item) => item.id === produto.id
    )

    if (itemExistente) {
      return carrinhoAtual.map((item) =>
        item.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      )
    }

    return [...carrinhoAtual, { ...produto, quantidade: 1 }]
  })

  setProdutoAdicionado(produto.id)

  setTimeout(() => {
    setProdutoAdicionado(null)
  }, 800)
}

  function alterarQuantidade(id, variacao) {
    setCarrinho((carrinhoAtual) =>
      carrinhoAtual
        .map((item) =>
          item.id === id
            ? { ...item, quantidade: item.quantidade + variacao }
            : item
        )
        .filter((item) => item.quantidade > 0)
    )
  }

  const totalItens = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  )

  const valorTotal = carrinho.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0
  )

  function formatarPreco(valor) {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  function enviarPedidoWhatsApp(evento) {
    evento.preventDefault()

    // Confere novamente o horário no momento do envio.
    const statusAtual = obterStatusDelivery(new Date())
    if (!statusAtual.aberto) {
      setAgora(new Date())
      alert(
        `O delivery está fechado neste momento. Nosso próximo atendimento será ${statusAtual.proximaAbertura}.`
      )
      return
    }

    if (valorTotal < 15) {
      alert(
        `O pedido mínimo para entrega é R$ 15,00. Seu pedido está em ${formatarPreco(valorTotal)}. Adicione mais produtos para continuar.`
      )
      return
    }

    const novoPedido = {
      id: Date.now(),
      nome: nomeCliente,
      telefone: telefoneCliente,
      endereco: enderecoCliente,
      numero: numeroCasa,
      bairro: bairroCliente,
      pagamento,
      observacoes,
      itens: carrinho.map((item) => ({ ...item })),
      total: valorTotal,
      data: new Date().toLocaleString('pt-BR'),
    }

    const pedidosAtualizados = [...pedidos, novoPedido]
    setPedidos(pedidosAtualizados)
    localStorage.setItem('pedidosHookah29', JSON.stringify(pedidosAtualizados))

    const numeroWhatsAppLoja = '5541996463720'
    const mensagem = `
*NOVO PEDIDO - HOOKAH29*

*CLIENTE*
Nome: ${nomeCliente}
Telefone: ${telefoneCliente}

*ENDEREÇO DE ENTREGA*
Rua: ${enderecoCliente}
Número: ${numeroCasa}
Bairro: ${bairroCliente}

*PEDIDO*
${carrinho.map((item) => `${item.quantidade}x ${item.nome} - ${formatarPreco(item.preco * item.quantidade)}`).join('\n')}

*TOTAL: ${formatarPreco(valorTotal)}*

*PAGAMENTO*
Forma: ${pagamento}
${pagamento === 'Dinheiro' ? `Troco para: ${valorTroco || 'Não informado'}` : ''}

*OBSERVAÇÕES*
${observacoes || 'Nenhuma'}
`

    const link = `https://wa.me/${numeroWhatsAppLoja}?text=${encodeURIComponent(mensagem)}`
    window.open(link, '_blank')
  }

  return (
    <div className="app">
      {!mostrarAdmin && (
        <header className="topo">
          <div className="logo">
            <img
src="/logo-hookah29.png"
  alt="Logo HOOKAH29"
  className="logo-imagem"
/>

            <div>
              <h1>HOOKAH29</h1>
              <p>Delivery rápido e fácil</p>
            </div>
          </div>

          <a className="atalho-carrinho" href="#carrinho">
            🛒 Carrinho ({totalItens})
          </a>
        </header>
      )}

      <main>
        {mostrarAdmin && !adminAutenticado && (
          <section className="painel-admin">
            <h2>Acesso administrativo</h2>
            <p>Digite seu e-mail e senha para acessar os pedidos.</p>

            <form
              onSubmit={async (evento) => {
                evento.preventDefault()

                const { error } = await supabase.auth.signInWithPassword({
                  email: emailAdmin,
                  password: senhaAdmin,
                })

                if (error) {
                  alert('E-mail ou senha incorretos.')
                  return
                }

                setAdminAutenticado(true)
                setSenhaAdmin('')
                setEmailAdmin('')
              }}
            >
              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={emailAdmin}
                onChange={(evento) => setEmailAdmin(evento.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Digite sua senha"
                value={senhaAdmin}
                onChange={(evento) => setSenhaAdmin(evento.target.value)}
                required
              />
              <button type="submit">Entrar</button>
            </form>
          </section>
        )}

        {mostrarAdmin && adminAutenticado && (
          <section className="painel-admin">
            <h2>Painel Administrativo — HOOKAH29</h2>
            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut()

                if (error) {
                  alert('Não foi possível sair. Tente novamente.')
                  return
                }

                setAdminAutenticado(false)
                setMostrarAdmin(false)
              }}
            >
              Sair do painel
            </button>

            <div className="resumo-carrinho">
              <span>Total de pedidos registrados</span>
              <strong>{pedidos.length}</strong>
            </div>
            <div className="resumo-carrinho">
              <span>Pedidos pendentes</span>
              <strong>
                {pedidos.filter((pedido) => (pedido.status || 'Pendente') === 'Pendente').length}
              </strong>
            </div>
            <div className="resumo-carrinho">
              <span>Pedidos em preparo</span>
              <strong>{pedidos.filter((pedido) => pedido.status === 'Em preparo').length}</strong>
            </div>
            <div className="resumo-carrinho">
              <span>Total em vendas registradas</span>
              <strong>
                {formatarPreco(pedidos.reduce((soma, pedido) => soma + Number(pedido.total || 0), 0))}
              </strong>
            </div>

            {pedidos.length === 0 ? (
              <p>Ainda não há pedidos registrados neste navegador.</p>
            ) : (
              pedidos.map((pedido) => (
                <div className="resumo-carrinho" key={pedido.id}>
                  <div>
                    <h3>Pedido de {pedido.nome}</h3>
                    <p><strong>Status:</strong> {pedido.status || 'Pendente'}</p>
                    <label>
                      Alterar status:{' '}
                      <select
                        value={pedido.status || 'Pendente'}
                        onChange={(evento) => {
                          const pedidosAtualizados = pedidos.map((item) =>
                            item.id === pedido.id
                              ? { ...item, status: evento.target.value }
                              : item
                          )
                          setPedidos(pedidosAtualizados)
                          localStorage.setItem('pedidosHookah29', JSON.stringify(pedidosAtualizados))
                        }}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em preparo">Em preparo</option>
                        <option value="Saiu para entrega">Saiu para entrega</option>
                        <option value="Entregue">Entregue</option>
                      </select>
                    </label>
                    <p>Telefone: {pedido.telefone}</p>
                    <p>Endereço: {pedido.endereco}, {pedido.numero}</p>
                    <p>Bairro: {pedido.bairro}</p>
                    <p>Pagamento: {pedido.pagamento}</p>
                    <p>Data: {pedido.data}</p>
                    <strong>Produtos:</strong>
                    {pedido.itens.map((item, indice) => (
                      <p key={indice}>{item.quantidade}x {item.nome}</p>
                    ))}
                  </div>
                  <strong>{formatarPreco(pedido.total)}</strong>
                </div>
              ))
            )}

            <div className="gerenciar-produtos">
              <h2>Cadastro de produtos</h2>
              <p>Cadastre seus produtos e organize as essências por marca.</p>

              <form
                onSubmit={async (evento) => {
                  evento.preventDefault()

                  const dadosProduto = {
                    nome: nomeProduto.trim(),
                    marca: marcaProduto.trim(),
                    descricao: descricaoProduto.trim(),
                    preco: Number(precoProduto),
                    categoria: categoriaProduto,
                    emoji: emojiProduto.trim() || '📦',
                    imagem_url: imagemUrlProduto.trim(),
                  }

                  const resultado = produtoEditando
                    ? await supabase
                        .from('produtos')
                        .update(dadosProduto)
                        .eq('id', produtoEditando)
                        .select()
                        .single()
                    : await supabase
                        .from('produtos')
                        .insert([{ ...dadosProduto, ativo: true }])
                        .select()
                        .single()

                  const { data, error } = resultado

                  if (error) {
                    console.error('Erro ao salvar produto:', error)
                    alert('Não foi possível salvar o produto. Verifique o acesso ao Supabase.')
                    return
                  }

                  setProdutos((atuais) =>
                    produtoEditando
                      ? atuais.map((item) =>
                          item.id === data.id
                            ? { ...item, ...data, preco: Number(data.preco) }
                            : item
                        )
                      : [...atuais, { ...data, preco: Number(data.preco) }]
                  )

                  limparFormularioProduto()
                  alert(produtoEditando ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!')
                }}
              >
                <label>Marca</label>
                <input
                  type="text"
                  placeholder="Ex.: Zomo"
                  value={marcaProduto}
                  onChange={(evento) => setMarcaProduto(evento.target.value)}
                  required
                />

                <label>Nome do sabor ou produto</label>
                <input
                  type="text"
                  placeholder="Ex.: Blueberry"
                  value={nomeProduto}
                  onChange={(evento) => setNomeProduto(evento.target.value)}
                  required
                />

                <label>Preço (R$)</label>
                <input
                  type="number"
                  placeholder="Ex.: 25.00"
                  min="0"
                  step="0.01"
                  value={precoProduto}
                  onChange={(evento) => setPrecoProduto(evento.target.value)}
                  required
                />

                <label>Categoria</label>
                <select
                  value={categoriaProduto}
                  onChange={(evento) => setCategoriaProduto(evento.target.value)}
                  required
                >
                  <option value="Essência">Essência</option>
                  <option value="Carvão">Carvão</option>
                  <option value="Alumínio">Alumínio</option>
                </select>

                <label>Descrição</label>
                <textarea
                  placeholder="Descreva o produto (opcional)"
                  value={descricaoProduto}
                  onChange={(evento) => setDescricaoProduto(evento.target.value)}
                  rows="3"
                />

                <label>Emoji</label>
                <input
                  type="text"
                  placeholder="Ex.: 🍇"
                  value={emojiProduto}
                  onChange={(evento) => setEmojiProduto(evento.target.value)}
                />

                <label>Endereço da foto (URL)</label>
                <input
                  type="url"
                  placeholder="Cole aqui o endereço da imagem"
                  value={imagemUrlProduto}
                  onChange={(evento) => setImagemUrlProduto(evento.target.value)}
                />

                <button type="submit">{produtoEditando ? 'Salvar alterações' : 'Cadastrar produto'}</button>
                {produtoEditando && (
                  <button type="button" onClick={limparFormularioProduto}>
                    Cancelar edição
                  </button>
                )}
              </form>

              <h3>Produtos cadastrados</h3>
              <div className="editar-fotos-produtos">
                <h3>Adicionar ou alterar fotos</h3>
                <p>Escolha um produto e informe o endereço da foto.</p>

                {produtos.map((produto) => (
                  <div key={produto.id} className="resumo-carrinho">
                    <div>
                      <strong>{produto.marca || 'Sem marca'} — {produto.nome}</strong>
                      <p>{produto.imagem_url ? 'Foto cadastrada' : 'Sem foto cadastrada'}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProdutoFotoEditando(produto.id)
                        setNovaImagemUrl(produto.imagem_url || '')
                      }}
                    >
                      {produto.imagem_url ? 'Alterar foto' : 'Adicionar foto'}
                    </button>

                    {produtoFotoEditando === produto.id && (
                      <div>
                        <label>Endereço da foto (URL)</label>
                        <input
                          type="url"
                          placeholder="Cole aqui o endereço da imagem"
                          value={novaImagemUrl}
                          onChange={(evento) => setNovaImagemUrl(evento.target.value)}
                        />
                        <button type="button" onClick={() => salvarFotoProduto(produto)}>Salvar foto</button>
                        <button
                          type="button"
                          onClick={() => {
                            setProdutoFotoEditando(null)
                            setNovaImagemUrl('')
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {produtos.length === 0 ? (
                <p>Nenhum produto cadastrado ainda.</p>
              ) : (
                produtos.map((produto) => (
                  <div className="resumo-carrinho" key={produto.id}>
                    <div>
                      <strong>{produto.marca || 'Sem marca'} — {produto.nome}</strong>
                      <p>Categoria: {produto.categoria}</p>
                      <p><strong>Status:</strong> {produto.ativo ? 'Disponível' : 'INDISPONÍVEL'}</p>
                    </div>
                    <div className="acoes-produto-admin">
                      <strong>{formatarPreco(produto.preco)}</strong>
                      <button type="button" onClick={() => iniciarEdicaoProduto(produto)}>
                        Editar produto
                      </button>
                      <button type="button" 
                      onClick={() => alternarDisponibilidade(produto)}>
                      
                        {produto.ativo ? 'Marcar indisponível' : 'Reativar produto'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {!mostrarAdmin && (
          <>
            <section className={`aviso-delivery ${statusDelivery.aberto ? 'delivery-aberto' : 'delivery-fechado'}`}>
              <strong>
                {statusDelivery.aberto ? '🟢 DELIVERY ABERTO!' : '🔴 DELIVERY FECHADO NO MOMENTO'}
              </strong>
              <p>{statusDelivery.mensagem}</p>
              {!statusDelivery.aberto && statusDelivery.proximaAbertura && (
                <p><strong>Próxima abertura:</strong> {statusDelivery.proximaAbertura}.</p>
              )}
            </section>

            <section className="banner">
              <span className="banner-etiqueta">DELIVERY</span>
              <h2>Seu pedido,<br />do seu jeito.</h2>
              <p>Escolha seus produtos e faça seu pedido.</p>
            </section>

            <section className="catalogo">
              <div className="titulo-secao">
                <div>
                  <h2>Nossos produtos</h2>
                  <p>Confira nossos produtos</p>
                </div>
              </div>

              <input
                className="campo-busca"
                type="text"
                placeholder="🔎  Buscar produto..."
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
              />

              <div className="categorias">
                {categorias.map((categoria) => (
                  <button
                    key={categoria}
                    className={categoriaSelecionada === categoria ? 'categoria ativa' : 'categoria'}
                    onClick={() => {
                      setCategoriaSelecionada(categoria)
                      setMarcaSelecionada('')
                    }}
                  >
                    {categoria}
                  </button>
                ))}
              </div>

              {carregandoProdutos && <p>Carregando produtos...</p>}

              {categoriaSelecionada === 'Essência' && !marcaSelecionada ? (
                <div className="grade-produtos">
                  {marcasEssencias.length === 0 ? (
                    <p>Nenhuma marca de essência cadastrada ainda.</p>
                  ) : (
                    marcasEssencias.map((marca) => (
                      <button
                        key={marca}
                        type="button"
                        className="categoria"
                        onClick={() => setMarcaSelecionada(marca)}
                      >
                        {marca}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <>
                  {categoriaSelecionada === 'Essência' && marcaSelecionada && (
                    <button type="button" className="botao-voltar" onClick={() => setMarcaSelecionada('')}>
                      ← Voltar para as marcas
                    </button>
                  )}

                  <div className="grade-produtos">
                    {(categoriaSelecionada === 'Essência' ? produtosDaMarca : produtosFiltrados).map((produto) => (
                      <article className="produto" key={produto.id}>
                        <div className="produto-imagem">
                          {produto.imagem_url ? (
                            <img src={produto.imagem_url} alt={produto.nome} className="produto-foto" />
                          ) : (
                            <span>{produto.emoji}</span>
                          )}
                          {!produto.ativo && (
                            <span className="produto-indisponivel">INDISPONÍVEL</span>
                          )}
                        </div>

                        <div className="produto-info">
                          <span className="produto-categoria">{produto.categoria}</span>
                          {produto.categoria === 'Essência' && <p className="produto-marca">{produto.marca}</p>}
                          <h3>{produto.nome}</h3>
                          <p>{produto.descricao}</p>

                          <div className="produto-rodape">
                            <strong>{formatarPreco(produto.preco)}</strong>
                            <button
                              className={`botao-adicionar ${
                                produtoAdicionado === produto.id ? 'produto-adicionado' : ''
                              }`}
                              onClick={() => adicionarAoCarrinho(produto)}
                              disabled={!produto.ativo}
                              aria-label={produto.ativo ? `Adicionar ${produto.nome} ao carrinho` : `${produto.nome} indisponível`}
                              title={
                                !produto.ativo
                                  ? 'Produto indisponível'
                                  : produtoAdicionado === produto.id
                                    ? 'Produto adicionado!'
                                    : `Adicionar ${produto.nome} ao carrinho`
                              }
                            >
                              {!produto.ativo ? '×' : produtoAdicionado === produto.id ? '✓' : '+'}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {produtosFiltrados.length === 0 && (
                <p className="sem-produtos">Nenhum produto encontrado.</p>
              )}
            </section>

            <section className="carrinho" id="carrinho">
              <div className="titulo-secao">
                <h2>🛒 Seu carrinho</h2>
                <p>
                  {totalItens === 0
                    ? 'Seu carrinho está vazio.'
                    : `${totalItens} produto(s) no carrinho.`}
                </p>
              </div>

              {carrinho.map((item) => (
                <div className="item-carrinho" key={item.id}>
                  <div className="item-detalhes">
                    <strong>{item.nome}</strong>
                    <span>{formatarPreco(item.preco)} cada</span>
                  </div>

                  <div className="controle-quantidade">
                    <button onClick={() => alterarQuantidade(item.id, -1)} aria-label={`Diminuir quantidade de ${item.nome}`}>−</button>
                    <span>{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(item.id, 1)} aria-label={`Aumentar quantidade de ${item.nome}`}>+</button>
                  </div>

                  <strong className="subtotal">{formatarPreco(item.preco * item.quantidade)}</strong>
                </div>
              ))}

              {carrinho.length > 0 && (
                <div className="resumo-carrinho">
                  <span>Total dos produtos</span>
                  <strong>{formatarPreco(valorTotal)}</strong>
                </div>
              )}

              {carrinho.length > 0 && !mostrarCheckout && (
                <button
                  className="botao-finalizar"
                  onClick={() => {
                    const statusAtual = obterStatusDelivery(new Date())
                    setAgora(new Date())
                    if (!statusAtual.aberto) {
                      alert(`O delivery está fechado. Você poderá enviar seu pedido ${statusAtual.proximaAbertura}.`)
                      return
                    }
                    setMostrarCheckout(true)
                  }}
                >
                  Continuar pedido
                </button>
              )}

              {mostrarCheckout && (
                <form className="formulario-pedido" onSubmit={enviarPedidoWhatsApp}>
                  <h2>Finalizar pedido</h2>
                  <p>Preencha seus dados para receber seu pedido da HOOKAH29.</p>

                  {!statusDelivery.aberto && (
                    <p role="alert">
                      O delivery fechou. Não será possível enviar o pedido agora.
                      Próxima abertura: {statusDelivery.proximaAbertura}.
                    </p>
                  )}

                  <label>Nome completo *</label>
                  <input type="text" value={nomeCliente} onChange={(evento) => setNomeCliente(evento.target.value)} required placeholder="Seu nome" />

                  <label>Telefone com DDD *</label>
                  <input type="tel" value={telefoneCliente} onChange={(evento) => setTelefoneCliente(evento.target.value)} required placeholder="Ex.: (41) 99999-9999" />

                  <label>Endereço de entrega *</label>
                  <input type="text" value={enderecoCliente} onChange={(evento) => setEnderecoCliente(evento.target.value)} required placeholder="Nome da rua" />

                  <label>Número da casa *</label>
                  <input type="text" value={numeroCasa} onChange={(evento) => setNumeroCasa(evento.target.value)} required placeholder="Número ou S/N" />

                  <label>Bairro *</label>
                  <input type="text" value={bairroCliente} onChange={(evento) => setBairroCliente(evento.target.value)} required placeholder="Seu bairro" />

                  <label>Forma de pagamento *</label>
                  <select value={pagamento} onChange={(evento) => setPagamento(evento.target.value)} required>
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão na entrega">Cartão na entrega</option>
                  </select>

                  {pagamento === 'Dinheiro' && (
                    <>
                      <label>Vai precisar de troco para quanto?</label>
                      <input type="number" min="0" step="0.01" value={valorTroco} onChange={(evento) => setValorTroco(evento.target.value)} placeholder="Ex.: 50,00" />
                    </>
                  )}

                  <label>Observações do pedido</label>
                  <textarea value={observacoes} onChange={(evento) => setObservacoes(evento.target.value)} placeholder="Complemento, referência ou outras informações" rows="3" />

                  <div className="resumo-carrinho">
                    <span>Total dos produtos</span>
                    <strong>{formatarPreco(valorTotal)}</strong>
                  </div>

                  <button className="botao-finalizar" type="submit" disabled={!statusDelivery.aberto}>
                    Enviar pedido pelo WhatsApp
                  </button>

                  <button className="botao-voltar" type="button" onClick={() => setMostrarCheckout(false)}>
                    Voltar ao carrinho
                  </button>
                </form>
              )}
            </section>
          </>
        )}
      </main>

      {!mostrarAdmin && (
        <footer className="rodape">
          <p>© 2026 HOOKAH29 — Todos os direitos reservados.</p>
        </footer>
      )}
    </div>
  )
}

export default App
