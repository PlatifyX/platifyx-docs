import { useState, useEffect } from 'react'
import { X, Users, Shield, Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { buildApiUrl } from '../../config/api'
import styles from './RBACModal.module.css'

interface User {
  id: number
  email: string
  name: string
  isActive: boolean
  roles?: Role[]
  createdAt: string
}

interface Role {
  id: number
  name: string
  displayName: string
  description: string
  isSystem: boolean
  permissions?: Permission[]
}

interface Permission {
  id: number
  resource: string
  action: string
  description: string
}

interface RBACModalProps {
  onClose: () => void
}

type TabType = 'users' | 'roles'

function RBACModal({ onClose }: RBACModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<number | null>(null)

  // Form states
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    password: '',
    roleIds: [] as number[]
  })

  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    permissionIds: [] as number[]
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'users') {
        const usersRes = await fetch(buildApiUrl('rbac/users'))
        const usersData = await usersRes.json()
        setUsers(usersData)

        const rolesRes = await fetch(buildApiUrl('rbac/roles'))
        const rolesData = await rolesRes.json()
        setRoles(rolesData)
      } else {
        const rolesRes = await fetch(buildApiUrl('rbac/roles'))
        const rolesData = await rolesRes.json()
        setRoles(rolesData)

        const permsRes = await fetch(buildApiUrl('rbac/permissions'))
        const permsData = await permsRes.json()
        setPermissions(permsData)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      const response = await fetch(buildApiUrl('rbac/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar usuário')
      }

      alert('Usuário criado com sucesso!')
      setShowUserForm(false)
      setUserForm({ email: '', name: '', password: '', roleIds: [] })
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(buildApiUrl(`rbac/users/${editingUser.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userForm.name,
          roleIds: userForm.roleIds
        })
      })

      if (!response.ok) throw new Error('Erro ao atualizar usuário')

      alert('Usuário atualizado com sucesso!')
      setEditingUser(null)
      setShowUserForm(false)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return

    try {
      const response = await fetch(buildApiUrl(`rbac/users/${id}`), {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao deletar usuário')

      alert('Usuário deletado com sucesso!')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleCreateRole = async () => {
    try {
      const response = await fetch(buildApiUrl('rbac/roles'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar perfil')
      }

      alert('Perfil criado com sucesso!')
      setShowRoleForm(false)
      setRoleForm({ name: '', displayName: '', description: '', permissionIds: [] })
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteRole = async (id: number, isSystem: boolean) => {
    if (isSystem) {
      alert('Perfis do sistema não podem ser deletados')
      return
    }

    if (!confirm('Tem certeza que deseja deletar este perfil?')) return

    try {
      const response = await fetch(buildApiUrl(`rbac/roles/${id}`), {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao deletar perfil')

      alert('Perfil deletado com sucesso!')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const openEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      email: user.email,
      name: user.name,
      password: '',
      roleIds: user.roles?.map(r => r.id) || []
    })
    setShowUserForm(true)
  }

  const openCreateUser = () => {
    setEditingUser(null)
    setUserForm({ email: '', name: '', password: '', roleIds: [] })
    setShowUserForm(true)
  }

  const groupPermissionsByResource = (perms: Permission[]) => {
    const grouped: Record<string, Permission[]> = {}
    perms.forEach(p => {
      if (!grouped[p.resource]) grouped[p.resource] = []
      grouped[p.resource].push(p)
    })
    return grouped
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Gerenciar RBAC</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            Usuários ({users.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'roles' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <Shield size={18} />
            Perfis ({roles.length})
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : activeTab === 'users' ? (
            <div>
              <div className={styles.toolbar}>
                <button className={styles.createButton} onClick={openCreateUser}>
                  <Plus size={18} />
                  Novo Usuário
                </button>
              </div>

              {showUserForm && (
                <div className={styles.form}>
                  <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                  <input
                    type="email"
                    placeholder="Email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    disabled={!!editingUser}
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Nome"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className={styles.input}
                  />
                  {!editingUser && (
                    <input
                      type="password"
                      placeholder="Senha"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className={styles.input}
                    />
                  )}
                  <div className={styles.checkboxGroup}>
                    <label>Perfis:</label>
                    {roles.map(role => (
                      <label key={role.id} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={userForm.roleIds.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserForm({ ...userForm, roleIds: [...userForm.roleIds, role.id] })
                            } else {
                              setUserForm({ ...userForm, roleIds: userForm.roleIds.filter(id => id !== role.id) })
                            }
                          }}
                        />
                        {role.displayName}
                      </label>
                    ))}
                  </div>
                  <div className={styles.formActions}>
                    <button onClick={() => { setShowUserForm(false); setEditingUser(null) }} className={styles.cancelButton}>
                      Cancelar
                    </button>
                    <button onClick={editingUser ? handleUpdateUser : handleCreateUser} className={styles.saveButton}>
                      {editingUser ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.list}>
                {users.map(user => (
                  <div key={user.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{user.name}</div>
                      <div className={styles.itemEmail}>{user.email}</div>
                      <div className={styles.itemRoles}>
                        {user.roles?.map(r => r.displayName).join(', ') || 'Sem perfil'}
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button onClick={() => setSelectedUserPermissions(user.id)} className={styles.iconButton} title="Ver permissões">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEditUser(user)} className={styles.iconButton} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className={styles.iconButton} title="Deletar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedUserPermissions && (
                <div className={styles.permissionsPanel}>
                  <h4>Permissões do Usuário</h4>
                  {(() => {
                    const user = users.find(u => u.id === selectedUserPermissions)
                    if (!user || !user.roles) return <p>Sem permissões</p>

                    const allPermissions: Permission[] = []
                    user.roles.forEach(role => {
                      if (role.permissions) allPermissions.push(...role.permissions)
                    })

                    const grouped = groupPermissionsByResource(allPermissions)
                    return Object.entries(grouped).map(([resource, perms]) => (
                      <div key={resource} className={styles.permissionGroup}>
                        <strong>{resource}</strong>
                        <ul>
                          {perms.map(p => (
                            <li key={p.id}>{p.action} - {p.description}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  })()}
                  <button onClick={() => setSelectedUserPermissions(null)} className={styles.closePermissions}>
                    Fechar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className={styles.toolbar}>
                <button className={styles.createButton} onClick={() => setShowRoleForm(true)}>
                  <Plus size={18} />
                  Novo Perfil
                </button>
              </div>

              {showRoleForm && (
                <div className={styles.form}>
                  <h3>Novo Perfil</h3>
                  <input
                    type="text"
                    placeholder="Nome (ex: manager)"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Nome de Exibição (ex: Gerente)"
                    value={roleForm.displayName}
                    onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                    className={styles.input}
                  />
                  <textarea
                    placeholder="Descrição"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className={styles.textarea}
                  />
                  <div className={styles.permissionsSelector}>
                    <label>Permissões:</label>
                    {Object.entries(groupPermissionsByResource(permissions)).map(([resource, perms]) => (
                      <div key={resource} className={styles.permissionResource}>
                        <strong>{resource}</strong>
                        {perms.map(perm => (
                          <label key={perm.id} className={styles.checkbox}>
                            <input
                              type="checkbox"
                              checked={roleForm.permissionIds.includes(perm.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRoleForm({ ...roleForm, permissionIds: [...roleForm.permissionIds, perm.id] })
                                } else {
                                  setRoleForm({ ...roleForm, permissionIds: roleForm.permissionIds.filter(id => id !== perm.id) })
                                }
                              }}
                            />
                            {perm.action} - {perm.description}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className={styles.formActions}>
                    <button onClick={() => setShowRoleForm(false)} className={styles.cancelButton}>
                      Cancelar
                    </button>
                    <button onClick={handleCreateRole} className={styles.saveButton}>
                      Criar
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.list}>
                {roles.map(role => (
                  <div key={role.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>
                        {role.displayName}
                        {role.isSystem && <span className={styles.systemBadge}>Sistema</span>}
                      </div>
                      <div className={styles.itemDescription}>{role.description}</div>
                      <div className={styles.itemPermissions}>
                        {role.permissions?.length || 0} permissões
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      {!role.isSystem && (
                        <button onClick={() => handleDeleteRole(role.id, role.isSystem)} className={styles.iconButton} title="Deletar">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RBACModal
