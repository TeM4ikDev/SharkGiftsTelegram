import { Header } from '@/components/layout/Header';
import WebApp from '@twa-dev/sdk';
import { observer } from 'mobx-react-lite';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Loader } from './components/layout/Loader';
import { isNavFooterHidden, NavFooter } from './components/layout/NavFooter';
import { useStore } from './store/root.store';
import { MOCK_USERS } from './store/user.store';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { UserRoles } from './types/auth';
import { MainAdmin } from './components/subpages/admin/main';
import { UsersShow } from './components/subpages/admin/usersShow';
import { Settings } from './components/subpages/admin/settings';
// import { CanvasComponent } from './components/canvas';

const MainPage = lazy(() => import('./pages/MainPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const TopUpPage = lazy(() => import('./pages/TopUpPage'));
const NoRightsPage = lazy(() => import('./pages/NoRightsPage'));
const NotFoundPage = lazy(() => import('./components/layout/NotFound'));

type BackgroundParticle = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  velocityX: number;
  velocityY: number;
  twinkleSpeed: number;
  phase: number;
};

const DevUserSelector = observer(() => {
  const { userStore } = useStore();
  if (!import.meta.env.DEV) return null;
  return (
    <div className="fixed top-2 left-2 z-[100]">
      <select
        value={userStore.selectedMockUserId}
        onChange={(e) => userStore.setMockUser(Number(e.target.value))}
        className="text-xs bg-app-card/95 border border-app-border rounded-lg px-2 py-1.5 text-app-accent focus:outline-none focus:ring-1 focus:ring-app-accent/50"
      >
        {MOCK_USERS.map((u) => (
          <option key={u.id} value={u.id}>
            @{u.username || u.id} ({u.first_name})
          </option>
        ))}
      </select>
    </div>
  );
});

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const headerRef = useRef<HTMLElement>(null);
  const navFooterRef = useRef<HTMLDivElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [navFooterHeight, setNavFooterHeight] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    WebApp.ready();
    const mobilePlatforms = ['ios', 'android'];
    console.log("mobilePlatform", WebApp.platform);
    console.log("WebApp.isVersionAtLeast", WebApp.isVersionAtLeast("8.0"));


    // WebApp.HapticFeedback.notificationOccurred("error")

    console.log("WebApp.version", WebApp.version);

    // setInterval(() => {
    //   WebApp.HapticFeedback.notificationOccurred("error")
    // }, 1000);

    if (mobilePlatforms.includes(WebApp.platform)) {
      // WebApp.expand();
      // WebApp.requestFullscreen()

      if (WebApp.isVersionAtLeast("8.0")) {
        WebApp.disableVerticalSwipes();
      }
    }
    const handleBack = () => navigate(-1);

    if (location.pathname !== '/') {
      WebApp.BackButton.show();
    } else {
      WebApp.BackButton.hide();
    }

    WebApp.BackButton.onClick(handleBack);

    return () => {
      WebApp.BackButton.offClick(handleBack);
    };
  }, [navigate, location.pathname]);

  useEffect(() => {
    const updateHeights = () => {
      // Получаем значение безопасной зоны сверху из CSS или напрямую (если доступно)
      // Telegram подставляет эти значения в runtime
      const safeAreaTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-top')) || 0;
      const safeAreaBottom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-bottom')) || 0;



      console.log("safeAreaTop", safeAreaTop);
      console.log("safeAreaBottom", safeAreaBottom);

      console.log("safeAreaTop", WebApp.viewportHeight);
      // console.log("safeAreaBottom", WebApp);

      if (headerRef.current) {
        // headerRef.current.offsetHeight
        setHeaderHeight(safeAreaTop ? safeAreaTop - 8 : headerRef.current.offsetHeight);
      }

      if (isNavFooterHidden(location.pathname)) {
        setNavFooterHeight(0);
      } else if (navFooterRef.current) {
        // navFooterRef.current.offsetHeight
        setNavFooterHeight(navFooterRef.current.offsetHeight + safeAreaBottom);
      }
    };

    // Вызываем расчет
    updateHeights();

    // Следим за изменениями размеров
    const resizeObserver = new ResizeObserver(updateHeights);

    if (headerRef.current) resizeObserver.observe(headerRef.current);
    if (navFooterRef.current) resizeObserver.observe(navFooterRef.current);

    window.addEventListener('resize', updateHeights);

    // Telegram может менять размер viewport при появлении клавиатуры
    WebApp.onEvent('viewportChanged', updateHeights);

    return () => {
      window.removeEventListener('resize', updateHeights);
      WebApp.offEvent('viewportChanged', updateHeights);
      resizeObserver.disconnect();
    };
  }, [location.pathname]);



  return (
    <>

      <div
        className="relative  overflow-y-auto flex flex-col bg-gradient-to-br bg-app-darker h-screen scrollbar-hide"
      // style={{
      //   paddingTop: 'calc(var(--tg-safe-area-inset-top) * 2)',
      //   paddingBottom: 'var(--tg-safe-area-inset-bottom)',
      // }}
      >
        <canvas
          ref={backgroundCanvasRef}
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
        />

        <DevUserSelector />
        <Header ref={headerRef} />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="*" element={<ProtectedRoutes />} />
          </Routes>
        </Suspense>
        {/* <Loader /> */}
        <NavFooter ref={navFooterRef} />
      </div>

    </>
  );
}

const ProtectedRoutes = observer(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userStore: { user, isLoading }, routesStore: { getPathByKey } } = useStore();

  // console.log(user)

  // useEffect(() => {
  //   if (!isLoading && !user && location.pathname !== RoutesConfig.NO_RIGHTS.path) {
  //     navigate(RoutesConfig.NO_RIGHTS.path);
  //   }
  // }, [user, location.pathname, navigate, isLoading]);

  // if (isLoading) {
  //   return null;
  // }

  // if (!user?.hasAccess) return <NoRightsPage />

  return (
    <Routes>
      <Route index element={<MainPage />} />

      <Route path="admin/*" element={
        <ProtectedRoute allowedRoles={[UserRoles.Admin, UserRoles.SuperAdmin]}>
          <AdminPage />
        </ProtectedRoute>
      }>
        <Route index element={<MainAdmin />} />
        <Route path="users" element={<UsersShow />} />
        <Route path="settings" element={<Settings />} />
      </Route>


      <Route path="/profile" element={<ProfilePage />} />   
      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  );
});

export { App };

