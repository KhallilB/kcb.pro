import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { About } from './pages/About'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { ProjectPage } from './pages/ProjectPage'
import { StudiesIndex, StudyPage } from './pages/Studies'
import { WorkIndex } from './pages/WorkIndex'

// Same tree on server and client, so prerendered HTML hydrates cleanly.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="work" element={<WorkIndex />} />
        <Route path="work/:slug" element={<ProjectPage />} />
        <Route path="studies" element={<StudiesIndex />} />
        <Route path="studies/:slug" element={<StudyPage />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
