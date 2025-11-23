import { useState, useEffect } from 'react'
import { FileText, Folder, Plus, Edit2, Trash2, Save, X, FolderPlus, Sparkles, Zap, Loader2, CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import AIAssistant from '../components/TechDocs/AIAssistant'
import { buildApiUrl } from '../config/api'

interface TreeNode {
  path: string
  name: string
  isDirectory: boolean
  children?: TreeNode[]
}

interface Document {
  path: string
  name: string
  content: string
  isDirectory: boolean
  size: number
  modifiedTime: string
}

function TechDocsPage() {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [showNewDocModal, setShowNewDocModal] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newDocPath, setNewDocPath] = useState('')
  const [newFolderPath, setNewFolderPath] = useState('')
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [showAutoGenModal, setShowAutoGenModal] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [repoSource, setRepoSource] = useState('github')
  const [serviceName, setServiceName] = useState('')
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([])
  const [generationProgress, setGenerationProgress] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchTree()
  }, [])

  const fetchTree = async () => {
    try {
      const response = await fetch(buildApiUrl('techdocs/tree'))
      if (!response.ok) throw new Error('Failed to fetch document tree')
      const data = await response.json()
      setTree(data.tree || [])
    } catch (err) {
      console.error('Error fetching tree:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocument = async (path: string) => {
    try {
      const response = await fetch(buildApiUrl(`techdocs/document?path=${encodeURIComponent(path)}`))
      if (!response.ok) throw new Error('Failed to fetch document')
      const data = await response.json()
      setSelectedDoc(data)
      setEditContent(data.content || '')
      setIsEditing(false)
    } catch (err) {
      console.error('Error fetching document:', err)
      alert('Erro ao carregar documento')
    }
  }

  const handleSave = async () => {
    if (!selectedDoc) return

    try {
      const response = await fetch(buildApiUrl('techdocs/document'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedDoc.path,
          content: editContent,
        }),
      })

      if (!response.ok) throw new Error('Failed to save document')

      setSelectedDoc({ ...selectedDoc, content: editContent })
      setIsEditing(false)
      alert('Documento salvo com sucesso!')
      fetchTree()
    } catch (err) {
      console.error('Error saving document:', err)
      alert('Erro ao salvar documento')
    }
  }

  const handleDelete = async () => {
    if (!selectedDoc) return

    const confirmed = window.confirm(`Tem certeza que deseja deletar "${selectedDoc.name}"? Esta ação não pode ser desfeita.`)
    if (!confirmed) return

    try {
      const response = await fetch(buildApiUrl(`techdocs/document?path=${encodeURIComponent(selectedDoc.path)}`), {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete document')

      setSelectedDoc(null)
      alert('Documento deletado com sucesso!')
      fetchTree()
    } catch (err) {
      console.error('Error deleting document:', err)
      alert('Erro ao deletar documento')
    }
  }

  const handleCreateDocument = async () => {
    if (!newDocPath.trim()) {
      alert('Por favor, insira um caminho para o documento')
      return
    }

    try {
      const response = await fetch(buildApiUrl('techdocs/document'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: newDocPath.endsWith('.md') ? newDocPath : `${newDocPath}.md`,
          content: '# Novo Documento\n\nEscreva seu conteúdo aqui...',
        }),
      })

      if (!response.ok) throw new Error('Failed to create document')

      setShowNewDocModal(false)
      setNewDocPath('')
      alert('Documento criado com sucesso!')
      fetchTree()
    } catch (err) {
      console.error('Error creating document:', err)
      alert('Erro ao criar documento')
    }
  }

  const handleGenerateDocs = async () => {
    if (!repoUrl || !serviceName) {
      alert('Por favor, preencha a URL do repositório e o nome do serviço')
      return
    }

    try {
      setGenerating(true)
      const response = await fetch(buildApiUrl('autodocs/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          repositoryUrl: repoUrl,
          repositorySource: repoSource,
          serviceName: serviceName,
          docTypes: selectedDocTypes.length > 0 ? selectedDocTypes : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to start generation')

      const progress = await response.json()
      setGenerationProgress(progress)

      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(buildApiUrl(`autodocs/progress/${progress.id}`), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          if (progressResponse.ok) {
            const updatedProgress = await progressResponse.json()
            setGenerationProgress(updatedProgress)

            if (updatedProgress.status === 'completed' || updatedProgress.status === 'failed') {
              clearInterval(pollInterval)
              setGenerating(false)
            }
          }
        } catch (err) {
          console.error('Error polling progress:', err)
        }
      }, 2000)

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        setGenerating(false)
      }, 5 * 60 * 1000)
    } catch (err) {
      console.error('Error generating docs:', err)
      alert('Erro ao gerar documentação')
      setGenerating(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderPath.trim()) {
      alert('Por favor, insira um caminho para a pasta')
      return
    }

    try {
      const response = await fetch(buildApiUrl('techdocs/folder'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: newFolderPath,
        }),
      })

      if (!response.ok) throw new Error('Failed to create folder')

      setShowNewFolderModal(false)
      setNewFolderPath('')
      alert('Pasta criada com sucesso!')
      fetchTree()
    } catch (err) {
      console.error('Error creating folder:', err)
      alert('Erro ao criar pasta')
    }
  }

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    return (
      <div key={node.path} style={{ marginLeft: `${level * 20}px` }}>
        <div
          className={`flex items-center gap-2 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 relative ${
            selectedDoc?.path === node.path
              ? 'bg-gradient-to-br from-[#3e5c7626] to-[#3e5c7626] text-white font-semibold shadow-md shadow-[#3e5c7633]'
              : 'hover:bg-gradient-to-br hover:from-[#3e5c7614] hover:to-[#3e5c7614] hover:translate-x-1'
          }`}
          onClick={() => !node.isDirectory && fetchDocument(node.path)}
        >
          {node.isDirectory ? (
            <Folder size={16} className="text-white flex-shrink-0" />
          ) : (
            <FileText size={16} className="text-white flex-shrink-0" />
          )}
          <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">{node.name}</span>
        </div>
        {node.children && node.children.map(child => renderTreeNode(child, level + 1))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 max-w-full h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex justify-center items-center h-96 text-lg text-text-secondary">Carregando documentação...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-full h-[calc(100vh-4rem)] flex flex-col">
      <div className="bg-gradient-to-br from-[#3e5c76] to-[#3e5c76] rounded-2xl p-10 mb-8 shadow-[0_8px_24px_rgba(62,92,118,0.25)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] rounded-full translate-x-[30%] -translate-y-[30%]"></div>
        <div className="flex items-center gap-4 relative z-10 mb-6">
          <FileText size={32} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />
          <div>
            <h1 className="text-[2rem] font-bold text-white m-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]">TechDocs</h1>
            <p className="text-base text-white/90 mt-1 mb-0">Documentação técnica centralizada</p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 flex-wrap">
          <button
            className="flex items-center gap-2 py-2.5 px-5 bg-gradient-to-br from-[#1B998B] to-[#15887a] text-white border-none rounded-lg cursor-pointer font-medium transition-all duration-200 shadow-[0_2px_4px_rgba(27,153,139,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(27,153,139,0.3)]"
            onClick={() => setShowAutoGenModal(true)}
          >
            <Zap size={20} />
            <span>Gerar Documentação Automática</span>
          </button>
          <button
            className="flex items-center gap-2 py-2.5 px-5 bg-gradient-to-br from-[#3e5c76] to-[#3e5c76] text-white border-none rounded-lg cursor-pointer font-medium transition-all duration-200 shadow-[0_2px_4px_rgba(62,92,118,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(62,92,118,0.3)]"
            onClick={() => setShowAIAssistant(!showAIAssistant)}
          >
            <Sparkles size={20} />
            <span>Assistente IA</span>
          </button>
          <button
            className="flex items-center gap-2 py-2.5 px-5 bg-[#1E1E1E] backdrop-blur-[10px] text-white border border-white/30 rounded-lg cursor-pointer font-semibold transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:bg-[#1E1E1E] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            onClick={() => setShowNewFolderModal(true)}
          >
            <FolderPlus size={20} />
            <span>Nova Pasta</span>
          </button>
          <button
            className="flex items-center gap-2 py-2.5 px-5 bg-[#1E1E1E] backdrop-blur-[10px] text-white border border-white/30 rounded-lg cursor-pointer font-semibold transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:bg-[#1E1E1E] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            onClick={() => setShowNewDocModal(true)}
          >
            <Plus size={20} />
            <span>Novo Documento</span>
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        <div className="w-[280px] bg-[#1E1E1E] rounded-xl p-6 overflow-y-auto border border-[#f0ebd8] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-bold text-white uppercase m-0 mb-4 tracking-wider bg-gradient-to-br from-[#3e5c76] to-[#3e5c76] bg-clip-text text-transparent">Documentos</h3>
          <div className="flex flex-col gap-1">
            {tree.length === 0 ? (
              <p className="text-sm text-white text-center p-4 m-0">Nenhum documento encontrado</p>
            ) : (
              tree.map(node => renderTreeNode(node))
            )}
          </div>
        </div>

        {showAIAssistant && (
          <div className="w-[450px] h-[calc(100vh-200px)] max-h-[800px] overflow-hidden flex-shrink-0">
            <AIAssistant
              currentContent={selectedDoc?.content}
              onInsertContent={(content) => {
                if (isEditing) {
                  setEditContent(content)
                } else {
                  setEditContent(content)
                  setIsEditing(true)
                }
              }}
              onClose={() => setShowAIAssistant(false)}
            />
          </div>
        )}

        <div className="flex-1 bg-[#1E1E1E] rounded-xl border border-[#f0ebd8] flex flex-col overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          {selectedDoc ? (
            <>
              <div className="flex justify-between items-center p-6 border-b border-[#e5e7eb]">
                <h2 className="text-2xl font-semibold text-white m-0">{selectedDoc.name}</h2>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        className="flex items-center gap-1.5 py-2 px-4 bg-[#0d1321] text-white border border-[#f0ebd8] rounded-md cursor-pointer font-medium text-sm transition-all duration-200 hover:bg-[#0d1321] hover:border-[#f0ebd8]"
                        onClick={handleSave}
                      >
                        <Save size={18} />
                        <span>Salvar</span>
                      </button>
                      <button
                        className="flex items-center gap-1.5 py-2 px-4 bg-[#0d1321] text-white border border-[#f0ebd8] rounded-md cursor-pointer font-medium text-sm transition-all duration-200 hover:bg-[#0d1321] hover:border-[#f0ebd8]"
                        onClick={() => {
                          setIsEditing(false)
                          setEditContent(selectedDoc.content || '')
                        }}
                      >
                        <X size={18} />
                        <span>Cancelar</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="flex items-center gap-1.5 py-2 px-4 bg-[#0d1321] text-white border border-[#f0ebd8] rounded-md cursor-pointer font-medium text-sm transition-all duration-200 hover:bg-[#0d1321] hover:border-[#f0ebd8]"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 size={18} />
                        <span>Editar</span>
                      </button>
                      <button
                        className="flex items-center gap-1.5 py-2 px-4 bg-[#0d1321] text-white border border-[#f0ebd8] rounded-md cursor-pointer font-medium text-sm transition-all duration-200 hover:bg-[#0d1321] hover:border-[#f0ebd8]"
                        onClick={handleDelete}
                      >
                        <Trash2 size={18} />
                        <span>Deletar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col bg-[#1E1E1E]">
                {isEditing ? (
                  <textarea
                    className="bg-[#1E1E1E] flex-1 p-6 border-none font-[Monaco,Menlo,'Ubuntu_Mono',monospace] text-sm leading-relaxed resize-none outline-none"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Escreva seu conteúdo em markdown..."
                  />
                ) : (
                  <div className="flex-1 p-8 overflow-auto bg-[#1E1E1E] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI','Roboto','Oxygen','Ubuntu',sans-serif] leading-relaxed text-white">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-4xl font-bold text-white m-0 mb-6 pb-2 border-b-2 border-[#f0ebd8] leading-tight" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-3xl font-semibold text-white mt-8 mb-4 pb-1.5 border-b border-[#f0ebd8] leading-tight" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-2xl font-semibold text-white mt-6 mb-3 leading-snug" {...props} />,
                        h4: ({ node, ...props }) => <h4 className="text-xl font-semibold text-white mt-5 mb-2 leading-snug" {...props} />,
                        p: ({ node, ...props }) => <p className="m-0 mb-4 text-white text-base leading-7" {...props} />,
                        code: ({ node, inline, ...props }: any) =>
                          inline ?
                            <code className="bg-[#f3f4f6] text-[#dc2626] py-0.5 px-1.5 rounded-sm font-[Monaco,Menlo,'Ubuntu_Mono',monospace] text-[0.875em] border border-[#e5e7eb]" {...props} /> :
                            <code className="text-white font-[Monaco,Menlo,'Ubuntu_Mono',monospace] text-sm leading-relaxed" {...props} />,
                        pre: ({ node, ...props }) => <pre className="bg-[#0d1321] rounded-lg p-4 overflow-x-auto my-4 border border-[#f0ebd8]" {...props} />,
                        ul: ({ node, ...props }) => <ul className="my-4 pl-8 text-white" {...props} />,
                        ol: ({ node, ...props }) => <ol className="my-4 pl-8 text-white" {...props} />,
                        li: ({ node, ...props }) => <li className="my-2 leading-7" {...props} />,
                        a: ({ node, ...props }) => <a className="text-white no-underline border-b border-transparent transition-all duration-200 hover:border-[#3e5c76] hover:text-[#3e5c76]" {...props} target="_blank" rel="noopener noreferrer" />,
                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#3e5c76] bg-[#0d1321] py-3 px-5 my-6 rounded-r-md" {...props} />,
                        table: ({ node, ...props }) => <table className="w-full border-collapse my-6 border border-[#e5e7eb] rounded-lg overflow-hidden" {...props} />,
                        thead: ({ node, ...props }) => <thead className="bg-[#f9fafb]" {...props} />,
                        tbody: ({ node, ...props }) => <tbody className="bg-[#1E1E1E]" {...props} />,
                        tr: ({ node, ...props }) => <tr className="border-b border-[#e5e7eb] last:border-b-0 [tbody_&]:hover:bg-[#f9fafb]" {...props} />,
                        th: ({ node, ...props }) => <th className="py-3 px-4 text-left font-semibold text-white border-b-2 border-[#d1d5db]" {...props} />,
                        td: ({ node, ...props }) => <td className="py-3 px-4 text-white" {...props} />,
                        hr: ({ node, ...props }) => <hr className="border-none border-t-2 border-[#e5e7eb] my-8" {...props} />,
                        img: ({ node, ...props }) => <img className="max-w-full h-auto rounded-lg my-4 shadow-md" {...props} />,
                      }}
                    >
                      {selectedDoc.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white">
              <FileText size={64} className="opacity-50" />
              <p className="text-lg m-0">Selecione um documento para visualizar</p>
            </div>
          )}
        </div>
      </div>

      {showNewDocModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-[#1E1E1E] p-8 rounded-xl w-[90%] max-w-[500px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]">
            <h3 className="text-xl font-semibold text-white m-0 mb-6">Novo Documento</h3>
            <input
              type="text"
              className="w-full py-3 px-3 border border-[#d1d5db] rounded-lg text-base mb-6 outline-none transition-colors duration-200 focus:border-[#3e5c76]"
              placeholder="ex: guides/tutorial.md"
              value={newDocPath}
              onChange={(e) => setNewDocPath(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                className="py-2.5 px-6 bg-[#3e5c76] text-white border-none rounded-lg cursor-pointer font-medium transition-colors duration-200 hover:bg-[#3e5c76]"
                onClick={handleCreateDocument}
              >
                Criar
              </button>
              <button
                className="py-2.5 px-6 bg-[#f3f4f6] text-white border border-[#d1d5db] rounded-lg cursor-pointer font-medium transition-all duration-200 hover:bg-[#e5e7eb]"
                onClick={() => {
                  setShowNewDocModal(false)
                  setNewDocPath('')
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFolderModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-[#1E1E1E] p-8 rounded-xl w-[90%] max-w-[500px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]">
            <h3 className="text-xl font-semibold text-white m-0 mb-6">Nova Pasta</h3>
            <input
              type="text"
              className="w-full py-3 px-3 border border-[#d1d5db] rounded-lg text-base mb-6 outline-none transition-colors duration-200 focus:border-[#3e5c76]"
              placeholder="ex: guides/advanced"
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                className="py-2.5 px-6 bg-[#3e5c76] text-white border-none rounded-lg cursor-pointer font-medium transition-colors duration-200 hover:bg-[#3e5c76]"
                onClick={handleCreateFolder}
              >
                Criar
              </button>
              <button
                className="py-2.5 px-6 bg-[#f3f4f6] text-white border border-[#d1d5db] rounded-lg cursor-pointer font-medium transition-all duration-200 hover:bg-[#e5e7eb]"
                onClick={() => {
                  setShowNewFolderModal(false)
                  setNewFolderPath('')
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TechDocsPage
