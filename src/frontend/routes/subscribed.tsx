import { createFileRoute } from '@tanstack/react-router'
import { SubscribedView } from '@frontend/components/subscriptions'

export const Route = createFileRoute('/subscribed')({
  component: SubscribedPage,
})

function SubscribedPage() {
  return <SubscribedView />
}
