import { useState, useEffect } from 'react'
import { FileText, Folder, Plus, Edit2, Trash2, Save, X, FolderPlus, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import AIAssistant from '../components/TechDocs/AIAssistant'
import styles from './TechDocsPage.module.css'
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
          className={`${styles.treeItem} ${selectedDoc?.path === node.path ? styles.treeItemActive : ''}`}
          onClick={() => !node.isDirectory && fetchDocument(node.path)}
        >
          {node.isDirectory ? (
            <Folder size={16} className={styles.folderIcon} />
          ) : (
            <FileText size={16} className={styles.fileIcon} />
          )}
          <span className={styles.treeName}>{node.name}</span>
        </div>
        {node.children && node.children.map(child => renderTreeNode(child, level + 1))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando documentação...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <FileText size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>TechDocs</h1>
            <p className={styles.subtitle}>Documentação técnica centralizada</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.aiButton} onClick={() => setShowAIAssistant(!showAIAssistant)}>
            <Sparkles size={20} />
            <span>Assistente IA</span>
          </button>
          <button className={styles.addButton} onClick={() => setShowNewFolderModal(true)}>
            <FolderPlus size={20} />
            <span>Nova Pasta</span>
          </button>
          <button className={styles.addButton} onClick={() => setShowNewDocModal(true)}>
            <Plus size={20} />
            <span>Novo Documento</span>
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Documentos</h3>
          <div className={styles.tree}>
            {tree.length === 0 ? (
              <p className={styles.emptyMessage}>Nenhum documento encontrado</p>
            ) : (
              tree.map(node => renderTreeNode(node))
            )}
          </div>
        </div>

        {showAIAssistant && (
          <div className={styles.aiPanel}>
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

        <div className={styles.main}>
          {selectedDoc ? (
            <>
              <div className={styles.docHeader}>
                <h2 className={styles.docTitle}>{selectedDoc.name}</h2>
                <div className={styles.docActions}>
                  {isEditing ? (
                    <>
                      <button className={styles.actionButton} onClick={handleSave}>
                        <Save size={18} />
                        <span>Salvar</span>
                      </button>
                      <button className={styles.actionButton} onClick={() => {
                        setIsEditing(false)
                        setEditContent(selectedDoc.content || '')
                      }}>
                        <X size={18} />
                        <span>Cancelar</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className={styles.actionButton} onClick={() => setIsEditing(true)}>
                        <Edit2 size={18} />
                        <span>Editar</span>
                      </button>
                      <button className={styles.actionButtonDanger} onClick={handleDelete}>
                        <Trash2 size={18} />
                        <span>Deletar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.docContent}>
                {isEditing ? (
                  <textarea
                    className={styles.editor}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Escreva seu conteúdo em markdown..."
                  />
                ) : (
                  <div className={styles.markdownViewer}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className={styles.mdH1} {...props} />,
                        h2: ({ node, ...props }) => <h2 className={styles.mdH2} {...props} />,
                        h3: ({ node, ...props }) => <h3 className={styles.mdH3} {...props} />,
                        h4: ({ node, ...props }) => <h4 className={styles.mdH4} {...props} />,
                        p: ({ node, ...props }) => <p className={styles.mdP} {...props} />,
                        code: ({ node, inline, ...props }: any) =>
                          inline ?
                            <code className={styles.mdCodeInline} {...props} /> :
                            <code className={styles.mdCodeBlock} {...props} />,
                        pre: ({ node, ...props }) => <pre className={styles.mdPre} {...props} />,
                        ul: ({ node, ...props }) => <ul className={styles.mdUl} {...props} />,
                        ol: ({ node, ...props }) => <ol className={styles.mdOl} {...props} />,
                        li: ({ node, ...props }) => <li className={styles.mdLi} {...props} />,
                        a: ({ node, ...props }) => <a className={styles.mdLink} {...props} target="_blank" rel="noopener noreferrer" />,
                        blockquote: ({ node, ...props }) => <blockquote className={styles.mdBlockquote} {...props} />,
                        table: ({ node, ...props }) => <table className={styles.mdTable} {...props} />,
                        thead: ({ node, ...props }) => <thead className={styles.mdThead} {...props} />,
                        tbody: ({ node, ...props }) => <tbody className={styles.mdTbody} {...props} />,
                        tr: ({ node, ...props }) => <tr className={styles.mdTr} {...props} />,
                        th: ({ node, ...props }) => <th className={styles.mdTh} {...props} />,
                        td: ({ node, ...props }) => <td className={styles.mdTd} {...props} />,
                        hr: ({ node, ...props }) => <hr className={styles.mdHr} {...props} />,
                        img: ({ node, ...props }) => <img className={styles.mdImg} {...props} />,
                      }}
                    >
                      {selectedDoc.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.placeholder}>
              <FileText size={64} className={styles.placeholderIcon} />
              <p className={styles.placeholderText}>Selecione um documento para visualizar</p>
            </div>
          )}
        </div>
      </div>

      {showNewDocModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Novo Documento</h3>
            <input
              type="text"
              className={styles.modalInput}
              placeholder="ex: guides/tutorial.md"
              value={newDocPath}
              onChange={(e) => setNewDocPath(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.modalButton} onClick={handleCreateDocument}>
                Criar
              </button>
              <button className={styles.modalButtonCancel} onClick={() => {
                setShowNewDocModal(false)
                setNewDocPath('')
              }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFolderModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Nova Pasta</h3>
            <input
              type="text"
              className={styles.modalInput}
              placeholder="ex: guides/advanced"
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.modalButton} onClick={handleCreateFolder}>
                Criar
              </button>
              <button className={styles.modalButtonCancel} onClick={() => {
                setShowNewFolderModal(false)
                setNewFolderPath('')
              }}>
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
