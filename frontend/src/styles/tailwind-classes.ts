// Mapeamento de classes CSS modules comuns para Tailwind CSS
export const tw = {
  // Layout
  container: "max-w-[1400px] mx-auto",
  
  // Header  
  header: "mb-8",
  headerContent: "flex items-center gap-4",
  headerIcon: "text-primary",
  title: "text-[32px] font-bold text-text mb-1",
  subtitle: "text-base text-text-secondary",
  
  // Stats Cards
  statCard: "bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:shadow-lg hover:-translate-y-0.5",
  statIcon: "text-primary",
  statInfo: "flex-1 flex flex-col",
  statLabel: "text-sm text-text-secondary mb-1",
  statValue: "text-[28px] font-bold text-text",
  
  // Tabs
  tabs: "flex gap-2 border-b-2 border-border mb-6",
  tab: "bg-transparent border-none py-3 px-6 text-[15px] font-semibold text-text-secondary cursor-pointer relative transition-all duration-200 hover:text-text",
  tabActive: "text-primary after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary",
  
  // Empty State
  emptyState: "text-center py-20 px-5 flex flex-col items-center justify-center",
  
  // Loading
  loading: "text-center py-15 px-5 text-lg text-text-secondary",
  
  // Buttons
  button: "flex items-center gap-2 py-3 px-6 bg-primary text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed",
}
