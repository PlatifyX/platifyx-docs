import React, { useState, useEffect } from 'react';
import { LogIn, CheckCircle, XCircle, Settings, Key } from 'lucide-react';
import { buildSSORedirectUri, fetchSSOConfigs, createOrUpdateSSOConfig, type SSOConfig } from '../../services/settingsApi';

const SSOTab: React.FC = () => {
  const [configs, setConfigs] = useState<SSOConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SSOConfig>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSSOConfigs();
  }, []);

  const loadSSOConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetchSSOConfigs();
      console.log('SSO configs response:', response);

      // Se não houver configs na resposta, inicializar com provedores padrão
      if (!response.configs || response.configs.length === 0) {
        console.log('No SSO configs found, initializing defaults');
        setConfigs([
          {
            provider: 'google',
            enabled: false,
            client_id: '',
            redirect_uri: buildSSORedirectUri('google'),
            allowed_domains: [],
          },
          {
            provider: 'microsoft',
            enabled: false,
            client_id: '',
            redirect_uri: buildSSORedirectUri('microsoft'),
            allowed_domains: [],
          },
        ]);
      } else {
        setConfigs(response.configs);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading SSO configs:', err);
      // Em caso de erro, ainda mostra os provedores para configuração
      setConfigs([
        {
          provider: 'google',
          enabled: false,
          client_id: '',
          redirect_uri: buildSSORedirectUri('google'),
          allowed_domains: [],
        },
        {
          provider: 'microsoft',
          enabled: false,
          client_id: '',
          redirect_uri: buildSSORedirectUri('microsoft'),
          allowed_domains: [],
        },
      ]);
      setError(null); // Não mostrar erro ao usuário, apenas inicializar com defaults
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (provider: string) => {
    const config = configs.find(c => c.provider === provider);
    if (!config) return;

    try {
      const updatedConfig = await createOrUpdateSSOConfig({
        ...config,
        enabled: !config.enabled,
        client_secret: config.client_secret || '',
      });
      setConfigs(configs.map(c =>
        c.provider === provider ? { ...updatedConfig, client_id: updatedConfig.client_id || '***' } : c
      ));
    } catch (err) {
      console.error('Error toggling SSO provider:', err);
      alert('Erro ao atualizar configuração de SSO');
    }
  };

  const openEditModal = (provider: string) => {
    const config = configs.find(c => c.provider === provider);
    if (config) {
      setFormData({
        provider: config.provider,
        enabled: config.enabled,
        client_id: config.client_id === '***' ? '' : config.client_id,
        client_secret: '',
        tenant_id: config.tenant_id || '',
        redirect_uri: config.redirect_uri,
        allowed_domains: config.allowed_domains || [],
      });
      setEditingProvider(provider);
    }
  };

  const closeEditModal = () => {
    setEditingProvider(null);
    setFormData({});
  };

  const handleSaveConfig = async () => {
    if (!editingProvider || !formData.client_id) {
      alert('Client ID é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const configToSave = {
        provider: editingProvider,
        enabled: formData.enabled ?? false,
        client_id: formData.client_id,
        client_secret: formData.client_secret || '',
        tenant_id: formData.tenant_id,
        redirect_uri: formData.redirect_uri || buildSSORedirectUri(editingProvider),
        allowed_domains: formData.allowed_domains || [],
      };

      const updatedConfig = await createOrUpdateSSOConfig(configToSave);

      setConfigs(configs.map(c =>
        c.provider === editingProvider ? updatedConfig : c
      ));

      closeEditModal();
      alert('Configuração salva com sucesso!');
    } catch (err) {
      console.error('Error saving SSO config:', err);
      alert('Erro ao salvar configuração de SSO');
    } finally {
      setSaving(false);
    }
  };

  const handleDomainsChange = (domainsText: string) => {
    const domains = domainsText.split(',').map(d => d.trim()).filter(d => d);
    setFormData({ ...formData, allowed_domains: domains });
  };

  const providerInfo: { [key: string]: { name: string; icon: string; color: string } } = {
    google: { name: 'Google', icon: '🔵', color: 'bg-blue-500' },
    microsoft: { name: 'Microsoft', icon: '🟦', color: 'bg-blue-600' },
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B998B] mb-2"></div>
        <p className="text-gray-400">Carregando configurações de SSO...</p>
      </div>
    );
  }

  console.log('Rendering SSO configs:', configs);
  console.log('Configs length:', configs.length);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1 text-white">Configuração de SSO</h2>
        <p className="text-gray-400">
          Configure provedores de Single Sign-On para autenticação
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-500">{error}</p>
        </div>
      )}

      {configs.length === 0 && (
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-400">Nenhuma configuração de SSO encontrada. Inicializando provedores padrão...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configs.map((config) => {
          const info = providerInfo[config.provider];

          // Se o provedor não estiver no providerInfo, pular
          if (!info) {
            console.warn(`Provider ${config.provider} not found in providerInfo`);
            return null;
          }

          return (
            <div
              key={config.provider}
              className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${info.color}/20 rounded-lg flex items-center justify-center text-2xl`}>
                    {info.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">{info.name}</h3>
                    <div className="flex items-center space-x-1">
                      {config.enabled ? (
                        <span className="flex items-center text-green-500 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Habilitado
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-500 text-sm">
                          <XCircle className="w-4 h-4 mr-1" />
                          Desabilitado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => toggleProvider(config.provider)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B998B]"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Client ID</label>
                  <div className="flex items-center space-x-2 bg-[#1E1E1E] border border-gray-700 rounded p-2">
                    <Key className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{config.client_id}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Redirect URI</label>
                  <div className="bg-[#1E1E1E] border border-gray-700 rounded p-2">
                    <span className="text-sm text-gray-300 break-all">{config.redirect_uri}</span>
                  </div>
                </div>

                {config.allowed_domains && config.allowed_domains.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Domínios Permitidos</label>
                    <div className="flex flex-wrap gap-2">
                      {config.allowed_domains.map((domain, idx) => (
                        <span key={idx} className="px-2 py-1 bg-[#1B998B]/20 text-[#1B998B] rounded text-xs">
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => openEditModal(config.provider)}
                className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3A3A3A] text-white rounded-lg hover:bg-[#4A4A4A] transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Configurar</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <LogIn className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-500 mb-1">Importante</h4>
            <p className="text-sm text-gray-300">
              Certifique-se de configurar corretamente as credenciais OAuth2 em cada provedor.
              URLs de callback devem ser registradas nos respectivos consoles.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Configurar {providerInfo[editingProvider]?.name}
                </h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Client ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client ID *
                  </label>
                  <input
                    type="text"
                    value={formData.client_id || ''}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1E1E1E] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B]"
                    placeholder="Digite o Client ID"
                  />
                </div>

                {/* Client Secret */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client Secret *
                  </label>
                  <input
                    type="password"
                    value={formData.client_secret || ''}
                    onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1E1E1E] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B]"
                    placeholder="Digite o Client Secret"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Deixe em branco para manter o secret atual
                  </p>
                </div>

                {/* Tenant ID (apenas para Microsoft) */}
                {editingProvider === 'microsoft' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tenant ID
                    </label>
                    <input
                      type="text"
                      value={formData.tenant_id || ''}
                      onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                      className="w-full px-4 py-2 bg-[#1E1E1E] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B]"
                      placeholder="Digite o Tenant ID (opcional, padrão: common)"
                    />
                  </div>
                )}

                {/* Redirect URI */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Redirect URI
                  </label>
                  <input
                    type="text"
                    value={formData.redirect_uri || ''}
                    onChange={(e) => setFormData({ ...formData, redirect_uri: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1E1E1E] border border-gray-700 rounded-lg text-gray-400 focus:outline-none focus:border-[#1B998B]"
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Copie esta URL e configure no console do provedor
                  </p>
                </div>

                {/* Allowed Domains */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Domínios Permitidos (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.allowed_domains?.join(', ') || ''}
                    onChange={(e) => handleDomainsChange(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1E1E1E] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B]"
                    placeholder="exemplo.com, outrodominio.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Separe múltiplos domínios com vírgula. Deixe vazio para permitir todos.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving || !formData.client_id}
                  className="px-6 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#158777] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SSOTab;
