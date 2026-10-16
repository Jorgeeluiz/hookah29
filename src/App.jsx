 import { useState, useEffect } from 'react'
 import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [busca, setBusca] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos')
  const [marcaSelecionada, setMarcaSelecionada] = useState('')
  const [carrinho, setCarrinho] = useState([])
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
const salvarFotoProduto = async (produto) => {
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

const [mostrarAdmin, setMostrarAdmin] = useState(false)
const [senhaAdmin, setSenhaAdmin] = useState('')
const [emailAdmin, setEmailAdmin] = useState('')
const [adminAutenticado, setAdminAutenticado] = useState(false)
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

 const categorias = [
  'Essência',
  'Carvão',
  'Alumínio',
  'Todos'
]

    // Carregar produtos ativos do Supabase
  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
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
  const correspondeBusca =
    `${produto.nome} ${produto.marca || ''}`
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

  function adicionarAoCarrinho(produto) {
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
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function enviarPedidoWhatsApp(evento) {
    evento.preventDefault()

    if (valorTotal < 15) {
  alert(
    `O pedido mínimo para entrega é R$ 15,00. ` +
    `Seu pedido está em ${formatarPreco(valorTotal)}. ` +
    `Adicione mais produtos para continuar.`
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
  pagamento: pagamento,
  observacoes: observacoes,
  itens: carrinho.map((item) => ({ ...item })),
  total: valorTotal,
  data: new Date().toLocaleString('pt-BR')
}

const pedidosAtualizados = [...pedidos, novoPedido]

setPedidos(pedidosAtualizados)

localStorage.setItem(
  'pedidosHookah29',
  JSON.stringify(pedidosAtualizados)
)
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
${carrinho.map((item) =>
  `${item.quantidade}x ${item.nome} - ${formatarPreco(item.preco * item.quantidade)}`
).join('\n')}

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
      <header className="topo">
        <div className="logo">
          <span className="logo-icone">◆</span>
          <div>
            <h1>HOOKAH29</h1>
            <p>Delivery rápido e fácil</p>
          </div>
        </div>

<button
  className="botao-admin"
  onClick={() => {
    if (adminAutenticado) {
      setMostrarAdmin(!mostrarAdmin)
    } else {
      setMostrarAdmin(true)
    }
  }}
>
  {mostrarAdmin ? 'Voltar à loja' : 'Painel Administrativo'}
</button>

        <a className="atalho-carrinho" href="#carrinho">
          🛒 Carrinho ({totalItens})
        </a>
      </header>
      <main>
       {mostrarAdmin && !adminAutenticado && (
  <section className="painel-admin">
    <h2>Acesso administrativo</h2>
    <p>Digite sua senha para acessar os pedidos.</p>

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
    {
      pedidos.filter(
        (pedido) => (pedido.status || 'Pendente') === 'Pendente'
      ).length
    }
  </strong>
</div>
<div className="resumo-carrinho">
  <span>Pedidos em preparo</span>
  <strong>
    {
      pedidos.filter(
        (pedido) => pedido.status === 'Em preparo'
      ).length
    }
  </strong>
</div>

    <div className="resumo-carrinho">
      <span>Total em vendas registradas</span>
      <strong>
        {formatarPreco(
          pedidos.reduce((soma, pedido) => soma + pedido.total, 0)
        )}
      </strong>
    </div>

    {pedidos.length === 0 ? (
      <p>Ainda não há pedidos registrados.</p>
    ) : (
      pedidos.map((pedido) => (
        <div className="resumo-carrinho" key={pedido.id}>
          <div>
            <h3>Pedido de {pedido.nome}</h3>
            <p>
  <strong>Status:</strong> {pedido.status || 'Pendente'}
</p>
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

      localStorage.setItem(
        'pedidosHookah29',
        JSON.stringify(pedidosAtualizados)
      )
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
              <p key={indice}>
                {item.quantidade}x {item.nome}
              </p>
            ))}
          </div>

          <strong>{formatarPreco(pedido.total)}</strong>
        </div>
      ))
    )}
      {/* Cadastro de produtos */}
    <div className="gerenciar-produtos">
      <h2>Cadastro de produtos</h2>
      <p>Cadastre seus produtos e organize as essências por marca.</p>

      <form
        onSubmit={async (evento) => {
          evento.preventDefault()

          const novoProduto = {
            nome: nomeProduto.trim(),
            marca: marcaProduto.trim(),
            descricao: descricaoProduto.trim(),
            preco: Number(precoProduto),
            categoria: categoriaProduto,
            emoji: emojiProduto.trim() || '📦',
            imagem_url: imagemUrlProduto.trim(),
            ativo: true,
          }

          const { data, error } = await supabase
            .from('produtos')
            .insert([novoProduto])
            .select()
            .single()

          if (error) {
            console.error('Erro ao cadastrar produto:', error)
            alert('Não foi possível cadastrar o produto. Verifique o acesso ao Supabase.')
            return
          }

          setProdutos((atuais) => [
            ...atuais,
            {
              ...data,
              preco: Number(data.preco),
            },
          ])

          setNomeProduto('')
          setMarcaProduto('')
          setDescricaoProduto('')
          setPrecoProduto('')
          setCategoriaProduto('Essência')
          setEmojiProduto('📦')
          setImagemUrlProduto('')

          alert('Produto cadastrado com sucesso!')
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
        <button type="submit">
          Cadastrar produto
        </button>
      </form>

      <h3>Produtos cadastrados</h3>
      <div className="editar-fotos-produtos">
  <h3>Adicionar ou alterar fotos</h3>
  <p>Escolha um produto e informe o endereço da foto.</p>

  {produtos.map((produto) => (
    <div key={produto.id} className="resumo-carrinho">
      <div>
        <strong>
          {produto.marca || 'Sem marca'} — {produto.nome}
        </strong>

        <p>
          {produto.imagem_url
            ? 'Foto cadastrada'
            : 'Sem foto cadastrada'}
        </p>
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

          <button
            type="button"
            onClick={() => salvarFotoProduto(produto)}
          >
            Salvar foto
          </button>

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
          <div
            className="resumo-carrinho"
            key={produto.id}
          >
            <div>
              <strong>
                {produto.marca || 'Sem marca'} — {produto.nome}
              </strong>
              <p>Categoria: {produto.categoria}</p>
            </div>

            <strong>{formatarPreco(produto.preco)}</strong>
          </div>
        ))
      )}
    </div>
    </section>
)}
        <section className="banner">
          <span className="banner-etiqueta">DELIVERY</span>
          <h2>Seu pedido,<br />do seu jeito.</h2>
          <p>Escolha seus produtos e faça seu pedido.</p>
        </section>

        <section className="catalogo">
          <div className="titulo-secao">
            <div>
              <h2>Nossos produtos</h2>
              <p>Confira o que temos disponível</p>
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
                className={
                  categoriaSelecionada === categoria
                    ? 'categoria ativa'
                    : 'categoria'
                }
                onClick={() => {
  setCategoriaSelecionada(categoria)
  setMarcaSelecionada('')
}}
              >
                {categoria}
              </button>
            ))}
          </div>

                    {carregandoProdutos && (
            <p>Carregando produtos...</p>
          )}
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
      <button
        type="button"
        className="botao-voltar"
        onClick={() => setMarcaSelecionada('')}
      >
        ← Voltar para as marcas
      </button>
    )}

    <div className="grade-produtos">
      {(categoriaSelecionada === 'Essência'
        ? produtosDaMarca
        : produtosFiltrados
      ).map((produto) => (
        <article className="produto" key={produto.id}>
          <div className="produto-imagem">
  {produto.imagem_url ? (
    <img
      src={produto.imagem_url}
      alt={produto.nome}
      className="produto-foto"
    />
  ) : (
    <span>{produto.emoji}</span>
  )}
</div>

          <div className="produto-info">
            <span className="produto-categoria">
              {produto.categoria}
            </span>

            {produto.categoria === 'Essência' && (
              <p className="produto-marca">
                {produto.marca}
              </p>
            )}

            <h3>{produto.nome}</h3>
            <p>{produto.descricao}</p>

            <div className="produto-rodape">
              <strong>{formatarPreco(produto.preco)}</strong>

              <button
                className="botao-adicionar"
                onClick={() => adicionarAoCarrinho(produto)}
                aria-label={`Adicionar ${produto.nome} ao carrinho`}
              >
                +
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  </>
)}

          {produtosFiltrados.length === 0 && (
            <p className="sem-produtos">
              Nenhum produto encontrado.
            </p>
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
                <button
                  onClick={() => alterarQuantidade(item.id, -1)}
                  aria-label={`Diminuir quantidade de ${item.nome}`}
                >
                  −
                </button>

                <span>{item.quantidade}</span>

                <button
                  onClick={() => alterarQuantidade(item.id, 1)}
                  aria-label={`Aumentar quantidade de ${item.nome}`}
                >
                  +
                </button>
              </div>

              <strong className="subtotal">
                {formatarPreco(item.preco * item.quantidade)}
              </strong>
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
    onClick={() => setMostrarCheckout(true)}
  >
    Continuar pedido
  </button>
)}

{mostrarCheckout && (
  <form className="formulario-pedido" onSubmit={enviarPedidoWhatsApp}>
    <h2>Finalizar pedido</h2>
    <p>Preencha seus dados para receber seu pedido da HOOKAH29.</p>

    <label>Nome completo *</label>
    <input
      type="text"
      value={nomeCliente}
      onChange={(evento) => setNomeCliente(evento.target.value)}
      required
      placeholder="Seu nome"
    />

    <label>Telefone com DDD *</label>
    <input
      type="tel"
      value={telefoneCliente}
      onChange={(evento) => setTelefoneCliente(evento.target.value)}
      required
      placeholder="Ex.: (41) 99999-9999"
    />

    <label>Endereço de entrega *</label>
    <input
      type="text"
      value={enderecoCliente}
      onChange={(evento) => setEnderecoCliente(evento.target.value)}
      required
      placeholder="Nome da rua"
    />

    <label>Número da casa *</label>
    <input
      type="text"
      value={numeroCasa}
      onChange={(evento) => setNumeroCasa(evento.target.value)}
      required
      placeholder="Número ou S/N"
    />

    <label>Bairro *</label>
    <input
      type="text"
      value={bairroCliente}
      onChange={(evento) => setBairroCliente(evento.target.value)}
      required
      placeholder="Seu bairro"
    />

    <label>Forma de pagamento *</label>
    <select
      value={pagamento}
      onChange={(evento) => setPagamento(evento.target.value)}
      required
    >
      <option value="Pix">Pix</option>
      <option value="Dinheiro">Dinheiro</option>
      <option value="Cartão na entrega">Cartão na entrega</option>
    </select>

    {pagamento === 'Dinheiro' && (
      <>
        <label>Vai precisar de troco para quanto?</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={valorTroco}
          onChange={(evento) => setValorTroco(evento.target.value)}
          placeholder="Ex.: 50,00"
        />
      </>
    )}

    <label>Observações do pedido</label>
    <textarea
      value={observacoes}
      onChange={(evento) => setObservacoes(evento.target.value)}
      placeholder="Complemento, referência ou outras informações"
      rows="3"
    />

    <div className="resumo-carrinho">
      <span>Total dos produtos</span>
      <strong>{formatarPreco(valorTotal)}</strong>
    </div>

    <button className="botao-finalizar" type="submit">
      Enviar pedido pelo WhatsApp
    </button>

    <button
      className="botao-voltar"
      type="button"
      onClick={() => setMostrarCheckout(false)}
    >
      Voltar ao carrinho
    </button>
  </form>
          )}
        </section>
      </main>

      <footer className="rodape">
        <p>© 2026 Sua Tabacaria — Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

export default App