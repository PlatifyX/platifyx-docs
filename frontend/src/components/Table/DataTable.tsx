import { ReactNode } from 'react'
import styles from './DataTable.module.css'

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
}

function DataTable<T>({ columns, data, loading, emptyMessage = 'Nenhum dado disponível' }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Carregando dados...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={styles[`align-${column.align || 'left'}`]}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={styles[`align-${column.align || 'left'}`]}
                >
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
