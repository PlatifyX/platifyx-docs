import React, { useState, useEffect } from 'react';
import { LogIn, CheckCircle, XCircle, Settings, Key } from 'lucide-react';
import { buildSSORedirectUri } from '../../services/settingsApi';

interface SSOConfig {
  provider: string;
  enabled: boolean;
  client_id: string;
  redirect_uri: string;
  allowed_domains?: string[];
}

const SSOTab: React.FC = () => {
  const [configs, setConfigs] = useState<SSOConfig[]>([
    {
      provider: 'google',
      enabled: true,
      client_id: '***',
      redirect_uri: buildSSORedirectUri('google'),
      allowed_domains: ['platifyx.com', 'example.com'],
    },
    {
      provider: 'microsoft',
      enabled: false,
      client_id: '***',
      redirect_uri: buildSSORedirectUri('microsoft'),
      allowed_domains: [],
    },
  ]);

  const toggleProvider = (provider: string) => {
    setConfigs(configs.map(c =>
      c.provider === provider ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const providerInfo: { [key: string]: { name: string; icon: string; color: string } } = {
    google: { name: 'Google', icon: '🔵', color: 'bg-blue-500' },
    microsoft: { name: 'Microsoft', icon: '🟦', color: 'bg-blue-600' },
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Configuração de SSO</h2>
        <p className="text-gray-400">
          Configure provedores de Single Sign-On para autenticação
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configs.map((config) => {
          const info = providerInfo[config.provider];
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
                    <h3 className="font-semibold text-lg">{info.name}</h3>
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
                    <span className="text-sm text-gray-400">{config.client_id}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Redirect URI</label>
                  <div className="bg-[#1E1E1E] border border-gray-700 rounded p-2">
                    <span className="text-sm text-gray-300">{config.redirect_uri}</span>
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

              <button className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3A3A3A] text-white rounded-lg hover:bg-[#4A4A4A] transition-colors">
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
    </div>
  );
};

export default SSOTab;
