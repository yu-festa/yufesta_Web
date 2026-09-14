import AppLayout from './layout/AppLayout'
import PushNotificationTest from './PushNotificationTest'

const App = () => {
  return (
    <AppLayout header={<div className="flex h-16 items-center text-lg font-bold">YU FESTA</div>}>
      <PushNotificationTest />
    </AppLayout>
  )
}

export default App
