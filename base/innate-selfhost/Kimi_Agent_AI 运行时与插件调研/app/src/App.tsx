import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Architecture from './pages/Architecture';
import MVP from './pages/MVP';
import Extension from './pages/Extension';
import Roadmap from './pages/Roadmap';
import Docs from './pages/Docs';
import Waitlist from './pages/Waitlist';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/mvp" element={<MVP />} />
        <Route path="/extension" element={<Extension />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/waitlist" element={<Waitlist />} />
      </Route>
    </Routes>
  );
}
