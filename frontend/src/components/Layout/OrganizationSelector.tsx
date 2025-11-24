import { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { useOrganization } from '../../contexts/OrganizationContext'

function OrganizationSelector() {
  const { currentOrganization, organizations, setCurrentOrganization, loading } = useOrganization()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (loading || organizations.length === 0) {
    return null
  }

  const handleSelectOrganization = (org: typeof organizations[0]) => {
    setCurrentOrganization(org)
    setIsOpen(false)
    window.location.reload()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] border border-gray-700 rounded-lg hover:border-[#1B998B] transition-colors text-sm"
        title="Selecionar Organização"
      >
        <Building2 className="w-4 h-4 text-[#1B998B]" />
        <span className="text-gray-300 font-medium max-w-[150px] truncate">
          {currentOrganization?.name || 'Selecione'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {organizations.map((org) => (
                <button
                  key={org.uuid}
                  onClick={() => handleSelectOrganization(org)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    currentOrganization?.uuid === org.uuid
                      ? 'bg-[#1B998B]/20 text-[#1B998B]'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium truncate">{org.name}</p>
                      <p className="text-xs text-gray-500 truncate">{org.uuid}</p>
                    </div>
                  </div>
                  {currentOrganization?.uuid === org.uuid && (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OrganizationSelector

