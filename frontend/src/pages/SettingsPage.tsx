import React, { useState } from 'react';
import { Users, Shield, Users2, LogIn, FileText, Settings as SettingsIcon } from 'lucide-react';
import UsersTab from '../components/Settings/UsersTab';
import RolesTab from '../components/Settings/RolesTab';
import TeamsTab from '../components/Settings/TeamsTab';
import SSOTab from '../components/Settings/SSOTab';
import AuditTab from '../components/Settings/AuditTab';

type TabType = 'users' | 'roles' | 'teams' | 'sso' | 'audit';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  const tabs = [
    { id: 'users' as TabType, label: 'Usuários', icon: Users, description: 'Gerenciar usuários do sistema' },
    { id: 'roles' as TabType, label: 'Roles & Permissões', icon: Shield, description: 'Configurar roles e permissões' },
    { id: 'teams' as TabType, label: 'Equipes', icon: Users2, description: 'Organizar equipes' },
    { id: 'sso' as TabType, label: 'SSO', icon: LogIn, description: 'Configurar autenticação SSO' },
    { id: 'audit' as TabType, label: 'Auditoria', icon: FileText, description: 'Logs de auditoria' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersTab key="users" />;
      case 'roles':
        return <RolesTab key="roles" />;
      case 'teams':
        return <TeamsTab key="teams" />;
      case 'sso':
        return <SSOTab key="sso" />;
      case 'audit':
        return <AuditTab key="audit" />;
      default:
        return <UsersTab key="users" />;
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-[#1B998B]/20 rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-[#1B998B]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-gray-400 text-sm mt-1">
              Gerenciamento de usuários, permissões, equipes e segurança
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-700 mb-6 overflow-x-auto">
        <nav className="flex space-x-2 md:space-x-8 min-w-max md:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-[#1B998B] text-[#1B998B]'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
                title={tab.description}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="font-medium hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-[#1E1E1E] rounded-lg border border-gray-700 animate-fade-in">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
