import React from 'react'
import OwnerStoreHistorySection from './history/OwnerStoreHistorySection'

// Compatibility wrapper retained while MyStoresSection still imports the historical name.
export default function MySubmissionsSection(props) {
  return <OwnerStoreHistorySection {...props} />
}
