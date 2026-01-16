import LoadingScreen from '@/components/ui/LoadingScreen'
import MainLayout from '@/components/layout/MainLayout'
import AnalysisPanel from '@/components/ui/panels/AnalysisPanel'
import MoveHistory from '@/components/ui/panels/MoveHistory'
import Board from '@/components/board/Board'

function App() {
  return (
    <>
      <LoadingScreen />
      <MainLayout>
        <aside className="left-panel">
          <AnalysisPanel />
          <MoveHistory />
        </aside>
        <Board />
      </MainLayout>
    </>
  )
}

export default App