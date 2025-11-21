import React, { useState } from 'react';
import { Users, Shield, Users2, Lock, LogIn, FileText, Settings as SettingsIcon } from 'lucide-react';
import UsersTab from '../components/Settings/UsersTab';
import RolesTab from '../components/Settings/RolesTab';
import TeamsTab from '../components/Settings/TeamsTab';
import SSOTab from '../components/Settings/SSOTab';
import AuditTab from '../components/Settings/AuditTab';

type TabType = 'users' | 'roles' | 'teams' | 'sso' | 'audit';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  const tabs = [
    { id: 'users' as TabType, label: 'Usuários', icon: Users },
    { id: 'roles' as TabType, label: 'Roles & Permissões', icon: Shield },
    { id: 'teams' as TabType, label: 'Equipes', icon: Users2 },
    { id: 'sso' as TabType, label: 'SSO', icon: LogIn },
    { id: 'audit' as TabType, label: 'Auditoria', icon: FileText },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersTab />;
      case 'roles':
        return <RolesTab />;
      case 'teams':
        return <TeamsTab />;
      case 'sso':
        return <SSOTab />;
      case 'audit':
        return <AuditTab />;
      default:
        return <UsersTab />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-[#1B998B]" />
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>
        <p className="text-gray-400">
          Gerenciamento de usuários, permissões, equipes e segurança
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#1B998B] text-[#1B998B]'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-[#1E1E1E] rounded-lg border border-gray-700">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
