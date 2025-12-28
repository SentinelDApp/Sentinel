/**
 * Compatibility wrapper
 * App.jsx currently imports StatsCards.
 * The shopkeeper-friendly component is implemented in StatsCard.
 */

import StatsCard from './StatsCard'

function StatsCards() {
  return <StatsCard />
}

export default StatsCards
